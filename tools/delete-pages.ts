import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, getPDFDocument } from '../utils/helpers';
import { state } from '../state';

import { PDFDocument as PDFLibDocument } from 'pdf-lib';

async function renderPagePreviews(arrayBuffer: ArrayBuffer) {
  const container = document.querySelector('#delete-pages-preview > div');
  if (!container) return;

  container.innerHTML = '';

  try {
    const pdf = await getPDFDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context!, viewport, canvas }).promise;

      const wrapper = document.createElement('div');
      wrapper.className = 'page-thumbnail relative';
      wrapper.dataset.pageNumber = String(pageNum);

      const innerDiv = document.createElement('div');
      innerDiv.className = 'relative border-2 border-gray-600 rounded-lg p-2 transition-colors';

      const img = document.createElement('img');
      img.src = canvas.toDataURL();
      img.className = 'rounded-md w-full h-auto';

      const pageLabel = document.createElement('div');
      pageLabel.className =
        'absolute top-1 left-1 bg-gray-800 text-white text-xs px-2 py-1 rounded-md font-semibold';
      pageLabel.textContent = String(pageNum);

      innerDiv.append(img, pageLabel);

      const p = document.createElement('p');
      p.className = 'text-center text-xs mt-1 text-gray-300';
      p.textContent = `Page ${pageNum}`;

      wrapper.append(innerDiv, p);
      container.appendChild(wrapper);
    }
  } catch (error) {
    console.error('Error rendering page previews:', error);
  }
}

export async function deletePages() {
  // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
  const pageInput = document.getElementById('pages-to-delete').value;
  if (!pageInput) {
    showAlert('Invalid Input', 'Please enter page numbers to delete.');
    return;
  }
  showLoader('Deleting pages...');
  try {
    const totalPages = state.pdfDoc.getPageCount();
    const indicesToDelete = new Set();
    const ranges = pageInput.split(',');

    for (const range of ranges) {
      const trimmedRange = range.trim();
      if (trimmedRange.includes('-')) {
        const [start, end] = trimmedRange.split('-').map(Number);
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) continue;
        for (let i = start; i <= end; i++) indicesToDelete.add(i - 1);
      } else {
        const pageNum = Number(trimmedRange);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) continue;
        indicesToDelete.add(pageNum - 1);
      }
    }

    if (indicesToDelete.size === 0) {
      showAlert('Invalid Input', 'No valid pages selected for deletion.');
      hideLoader();
      return;
    }
    if (indicesToDelete.size >= totalPages) {
      showAlert('Invalid Input', 'You cannot delete all pages.');
      hideLoader();
      return;
    }

    // Create array of pages to keep (all pages NOT in the delete set)
    const indicesToKeep = [];
    for (let i = 0; i < totalPages; i++) {
      if (!indicesToDelete.has(i)) {
        indicesToKeep.push(i);
      }
    }

    const newPdf = await PDFLibDocument.create();
    const copiedPages = await newPdf.copyPages(state.pdfDoc, indicesToKeep);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      'deleted-pages.pdf'
    );
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Could not delete pages.');
  } finally {
    hideLoader();
  }
}

export async function setupDeletePagesTool() {
  // Show the delete pages tool container
  document.getElementById('delete-pages-tool-container')?.classList.remove('hidden');

  // Load the PDF document into state if not already loaded
  if (!state.pdfDoc && state.files.length > 0) {
    try {
      const { showLoader, hideLoader } = await import('../ui');
      const { readFileAsArrayBuffer } = await import('../utils/helpers');
      const { setPdfDoc } = await import('../state');

      showLoader('Loading PDF...');
      const file = state.files[0];
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);

      // Also render page previews
      await renderPagePreviews(arrayBuffer);

      hideLoader();
    } catch (error) {
      const { hideLoader, showAlert } = await import('../ui');
      hideLoader();
      showAlert('Error', 'Failed to load PDF document.');
      console.error('Error loading PDF:', error);
      return;
    }
  } else if (state.pdfDoc) {
    // PDF already loaded, just render previews
    try {
      const { readFileAsArrayBuffer } = await import('../utils/helpers');
      const file = state.files[0];
      const arrayBuffer = await readFileAsArrayBuffer(file);
      await renderPagePreviews(arrayBuffer);
    } catch (error) {
      console.error('Error rendering previews:', error);
    }
  }

  const input = document.getElementById('pages-to-delete') as HTMLInputElement;
  if (!input) return;

  const updateHighlights = () => {
    const val = input.value;
    const pagesToDelete = new Set<number>();

    const parts = val.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) pagesToDelete.add(i);
        }
      } else {
        const num = Number(trimmed);
        if (!isNaN(num)) pagesToDelete.add(num);
      }
    }

    const thumbnails = document.querySelectorAll('#delete-pages-preview .page-thumbnail');
    thumbnails.forEach((thumb) => {
      const pageNum = parseInt((thumb as HTMLElement).dataset.pageNumber || '0');
      const innerContainer = thumb.querySelector('div.relative');

      if (pagesToDelete.has(pageNum)) {
        innerContainer?.classList.add('border-red-500');
        innerContainer?.classList.remove('border-gray-600');
      } else {
        innerContainer?.classList.remove('border-red-500');
        innerContainer?.classList.add('border-gray-600');
      }
    });
  };

  input.addEventListener('input', updateHighlights);
  updateHighlights();
}
