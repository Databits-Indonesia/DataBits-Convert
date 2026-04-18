import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { state, setPdfDoc } from '../state';

import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function setupOrganizeTool() {
  if (!state.files || !state.files[0]) {
    showAlert('Error', 'No PDF file loaded.');
    return;
  }

  try {
    showLoader('Loading PDF...');
    const file = state.files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFLibDocument.load(arrayBuffer);
    setPdfDoc(pdfDoc);

    // Show the organize tool container
    document.getElementById('organize-tool-container')?.classList.remove('hidden');

    // Render page thumbnails
    await renderOrganizePages();

    hideLoader();
  } catch (error) {
    console.error('Error loading PDF for organizing:', error);
    hideLoader();
    showAlert('Error', 'Failed to load PDF document.');
  }
}

async function renderOrganizePages() {
  const pageContainer = document.getElementById('page-organizer');
  if (!pageContainer || !state.pdfDoc) return;

  pageContainer.innerHTML = '';

  const pageCount = state.pdfDoc.getPageCount();

  // Import pdfjs dynamically
  const { getPDFDocument } = await import('../utils/helpers');
  const pdfData = await state.files[0].arrayBuffer();
  const pdf = await getPDFDocument({ data: pdfData }).promise;

  for (let i = 0; i < pageCount; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 0.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context!, viewport, canvas }).promise;

    // Create draggable page item
    const pageItem = document.createElement('div');
    pageItem.className =
      'relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 cursor-move hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500';
    pageItem.draggable = true;
    pageItem.dataset.pageIndex = String(i);

    // Page number label
    const pageLabel = document.createElement('div');
    pageLabel.className =
      'absolute top-1 left-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded';
    pageLabel.textContent = `${i + 1}`;

    pageItem.appendChild(pageLabel);
    pageItem.appendChild(canvas);

    // Drag and drop handlers
    pageItem.addEventListener('dragstart', handleDragStart);
    pageItem.addEventListener('dragover', handleDragOver);
    pageItem.addEventListener('drop', handleDrop);
    pageItem.addEventListener('dragend', handleDragEnd);

    pageContainer.appendChild(pageItem);
  }
}

let draggedElement: HTMLElement | null = null;

function handleDragStart(e: DragEvent) {
  draggedElement = e.currentTarget as HTMLElement;
  draggedElement.style.opacity = '0.5';
  e.dataTransfer!.effectAllowed = 'move';
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
  const target = e.currentTarget as HTMLElement;
  if (target !== draggedElement) {
    target.style.borderColor = '#3b82f6';
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.style.borderColor = 'transparent';

  if (draggedElement && target !== draggedElement) {
    const container = document.getElementById('page-organizer');
    if (!container) return;

    const allItems = Array.from(container.children);
    const draggedIndex = allItems.indexOf(draggedElement);
    const targetIndex = allItems.indexOf(target);

    if (draggedIndex < targetIndex) {
      target.after(draggedElement);
    } else {
      target.before(draggedElement);
    }
  }
}

function handleDragEnd(e: DragEvent) {
  const target = e.currentTarget as HTMLElement;
  target.style.opacity = '1';
  target.style.borderColor = 'transparent';
  draggedElement = null;

  // Remove border from all items
  const container = document.getElementById('page-organizer');
  if (container) {
    Array.from(container.children).forEach((child) => {
      (child as HTMLElement).style.borderColor = 'transparent';
    });
  }
}

export async function organize() {
  if (!state.pdfDoc) {
    showAlert('Error', 'No PDF document loaded.');
    return;
  }

  showLoader('Saving changes...');
  try {
    const newPdf = await PDFLibDocument.create();
    const pageContainer = document.getElementById('page-organizer');

    if (!pageContainer) {
      throw new Error('Page organizer container not found');
    }

    const pageIndices = Array.from(pageContainer.children).map((child) =>
      parseInt((child as HTMLElement).dataset.pageIndex)
    );

    const copiedPages = await newPdf.copyPages(state.pdfDoc, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      'organized.pdf'
    );
    showAlert('Success', 'PDF pages organized successfully!');
  } catch (e) {
    console.error(e);
    showAlert('Error', `Could not save the changes: ${e.message}`);
  } finally {
    hideLoader();
  }
}
