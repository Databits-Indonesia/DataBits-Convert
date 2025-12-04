import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, readFileAsArrayBuffer, getPDFDocument } from '../utils/helpers';
import { state } from '../state';
import { renderPagesProgressively, cleanupLazyRendering } from '../utils/render-utils';

import { createIcons, icons } from 'lucide';
import * as pdfjsLib from 'pdfjs-dist';
import Sortable from 'sortablejs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface MergeState {
  pdfDocs: Record<string, any>;
  pdfBytes: Record<string, ArrayBuffer>;
  activeMode: 'file' | 'page';
  sortableInstances: {
    fileList?: Sortable;
    pageThumbnails?: Sortable;
  };
  isRendering: boolean;
  cachedThumbnails: boolean | null;
  lastFileHash: string | null;
}

const mergeState: MergeState = {
  pdfDocs: {},
  pdfBytes: {},
  activeMode: 'file',
  sortableInstances: {},
  isRendering: false,
  cachedThumbnails: null,
  lastFileHash: null,
};

// Worker code removed - using direct pdf-lib implementation instead

function initializeFileListSortable() {
  const fileList = document.getElementById('file-list');
  if (!fileList) return;

  if (mergeState.sortableInstances.fileList) {
    mergeState.sortableInstances.fileList.destroy();
  }

  mergeState.sortableInstances.fileList = Sortable.create(fileList, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart: function (evt: any) {
      evt.item.style.opacity = '0.5';
    },
    onEnd: function (evt: any) {
      evt.item.style.opacity = '1';
    },
  });
}

function initializePageThumbnailsSortable() {
  const container = document.getElementById('page-merge-preview');
  if (!container) return;

  if (mergeState.sortableInstances.pageThumbnails) {
    mergeState.sortableInstances.pageThumbnails.destroy();
  }

  mergeState.sortableInstances.pageThumbnails = Sortable.create(container, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart: function (evt: any) {
      evt.item.style.opacity = '0.5';
    },
    onEnd: function (evt: any) {
      evt.item.style.opacity = '1';
    },
  });
}

function generateFileHash() {
  return (state.files as File[])
    .map((f) => `${f.name}-${f.size}-${f.lastModified}`)
    .join('|');
}

async function renderPageMergeThumbnails() {
  const container = document.getElementById('page-merge-preview');
  if (!container) return;

  const currentFileHash = generateFileHash();
  const filesChanged = currentFileHash !== mergeState.lastFileHash;

  if (!filesChanged && mergeState.cachedThumbnails !== null) {
    // Simple check to see if it's already rendered to avoid flicker.
    if (container.firstChild) {
      initializePageThumbnailsSortable();
      return;
    }
  }

  if (mergeState.isRendering) {
    return;
  }

  mergeState.isRendering = true;
  container.textContent = '';

  cleanupLazyRendering();

  let totalPages = 0;
  for (const file of state.files) {
    const doc = mergeState.pdfDocs[file.name];
    if (doc) totalPages += doc.numPages;
  }

  try {
    let currentPageNumber = 0;

    // Function to create wrapper element for each page
    const createWrapper = (canvas: HTMLCanvasElement, pageNumber: number, fileName?: string) => {
      const wrapper = document.createElement('div');
      wrapper.className =
        'page-thumbnail relative cursor-move flex flex-col items-center gap-1 p-2 border-2 border-gray-600 hover:border-indigo-500 rounded-lg bg-gray-700 transition-colors';
      wrapper.dataset.fileName = fileName || '';
      wrapper.dataset.pageIndex = (pageNumber - 1).toString();

      const imgContainer = document.createElement('div');
      imgContainer.className = 'relative';

      const img = document.createElement('img');
      img.src = canvas.toDataURL();
      img.className = 'rounded-md shadow-md max-w-full h-auto';

      const pageNumDiv = document.createElement('div');
      pageNumDiv.className =
        'absolute top-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-lg';
      pageNumDiv.textContent = pageNumber.toString();

      imgContainer.append(img, pageNumDiv);

      const fileNamePara = document.createElement('p');
      fileNamePara.className =
        'text-xs text-gray-400 truncate w-full text-center';
      const fullTitle = fileName ? `${fileName} (page ${pageNumber})` : `Page ${pageNumber}`;
      fileNamePara.title = fullTitle;
      fileNamePara.textContent = fileName
        ? `${fileName.substring(0, 10)}... (p${pageNumber})`
        : `Page ${pageNumber}`;

      wrapper.append(imgContainer, fileNamePara);
      return wrapper;
    };

    // Render pages from all files progressively
    for (const file of state.files) {
      const pdfjsDoc = mergeState.pdfDocs[file.name];
      if (!pdfjsDoc) continue;

      // Create a wrapper function that includes the file name
      const createWrapperWithFileName = (canvas: HTMLCanvasElement, pageNumber: number) => {
        return createWrapper(canvas, pageNumber, file.name);
      };

      // Render pages progressively with lazy loading
      await renderPagesProgressively(
        pdfjsDoc,
        container,
        createWrapperWithFileName,
        {
          batchSize: 8,
          useLazyLoading: true,
          lazyLoadMargin: '300px',
          onProgress: (current, total) => {
            currentPageNumber++;
            showLoader(
              `Rendering page previews...`
            );
          },
          onBatchComplete: () => {
            createIcons({ icons });
          }
        }
      );
    }

    mergeState.cachedThumbnails = true;
    mergeState.lastFileHash = currentFileHash;

    initializePageThumbnailsSortable();
  } catch (error) {
    console.error('Error rendering page thumbnails:', error);
    showAlert('Error', 'Failed to render page thumbnails');
  } finally {
    hideLoader();
    mergeState.isRendering = false;
  }
}

export async function merge() {
  showLoader('Merging PDFs...');
  try {
    // Import pdf-lib dynamically
    const { PDFDocument } = await import('pdf-lib');
    
    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();
    
    if (mergeState.activeMode === 'file') {
      // File Mode: merge entire files in order
      const fileList = document.getElementById('file-list');
      if (!fileList) throw new Error('File list not found');

      const sortedFiles = Array.from(fileList.children)
        .map((li) => {
          return state.files.find((f) => f.name === (li as HTMLElement).dataset.fileName);
        })
        .filter(Boolean) as File[];

      if (sortedFiles.length === 0) {
        throw new Error('No files selected to merge');
      }

      for (const file of sortedFiles) {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
        const rangeInput = document.getElementById(`range-${safeFileName}`) as HTMLInputElement;
        const rangeString = rangeInput?.value.trim();

        const pdfBytes = mergeState.pdfBytes[file.name];
        if (!pdfBytes) continue;

        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        if (rangeString) {
          // Parse range like "1-3,5,7-9"
          const pages = parsePageRange(rangeString, pdfDoc.getPageCount());
          for (const pageIndex of pages) {
            const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [pageIndex]);
            mergedPdf.addPage(copiedPage);
          }
        } else {
          // Copy all pages
          const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
      }
    } else {
      // Page Mode: merge specific pages in displayed order
      const pageContainer = document.getElementById('page-merge-preview');
      if (!pageContainer) throw new Error('Page container not found');
      const pageElements = Array.from(pageContainer.children);

      if (pageElements.length === 0) {
        throw new Error('No pages selected to merge');
      }

      for (const el of pageElements) {
        const element = el as HTMLElement;
        const fileName = element.dataset.fileName;
        const pageIndex = parseInt(element.dataset.pageIndex || '', 10);

        if (!fileName || isNaN(pageIndex)) continue;

        const pdfBytes = mergeState.pdfBytes[fileName];
        if (!pdfBytes) continue;

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [pageIndex]);
        mergedPdf.addPage(copiedPage);
      }
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    downloadFile(blob, 'merged.pdf');
    
    hideLoader();
    showAlert('Success', 'PDFs merged successfully!');

  } catch (e: any) {
    console.error('Merge error:', e);
    hideLoader();
    showAlert(
      'Error',
      'Failed to merge PDFs. Please check that all files are valid and not password-protected.'
    );
  }
}

// Helper function to parse page ranges like "1-3,5,7-9"
function parsePageRange(rangeString: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeString.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      if (isNaN(start) || isNaN(end)) continue;
      
      for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
        pages.add(i - 1); // Convert to 0-based index
      }
    } else {
      const pageNum = parseInt(part);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum - 1); // Convert to 0-based index
      }
    }
  }
  
  return Array.from(pages).sort((a, b) => a - b);
}

export async function setupMergeTool() {
  document.getElementById('merge-options')?.classList.remove('hidden');
  const processBtn = document.getElementById('process-btn') as HTMLButtonElement;
  if (processBtn) processBtn.disabled = false;

  const wasInPageMode = mergeState.activeMode === 'page';

  showLoader('Loading PDF documents...');
  try {
    mergeState.pdfDocs = {};
    mergeState.pdfBytes = {};

    for (const file of state.files) {
      const pdfBytes = await readFileAsArrayBuffer(file);
      mergeState.pdfBytes[file.name] = pdfBytes as ArrayBuffer;

      const bytesForPdfJs = (pdfBytes as ArrayBuffer).slice(0);
      const pdfjsDoc = await getPDFDocument({ data: bytesForPdfJs }).promise;
      mergeState.pdfDocs[file.name] = pdfjsDoc;
    }
  } catch (error) {
    console.error('Error loading PDFs:', error);
    showAlert('Error', 'Failed to load one or more PDF files');
    return;
  } finally {
    hideLoader();
  }

  const fileModeBtn = document.getElementById('file-mode-btn');
  const pageModeBtn = document.getElementById('page-mode-btn');
  const filePanel = document.getElementById('file-mode-panel');
  const pagePanel = document.getElementById('page-mode-panel');
  const fileList = document.getElementById('file-list');

  if (!fileModeBtn || !pageModeBtn || !filePanel || !pagePanel || !fileList) return;

  fileList.textContent = ''; // Clear list safely
  (state.files as File[]).forEach((f) => {
    const doc = mergeState.pdfDocs[f.name];
    const pageCount = doc ? doc.numPages : 'N/A';
    const safeFileName = f.name.replace(/[^a-zA-Z0-9]/g, '_');

    const li = document.createElement('li');
    li.className =
      'bg-gray-700 p-3 rounded-lg border border-gray-600 hover:border-indigo-500 transition-colors';
    li.dataset.fileName = f.name;

    const mainDiv = document.createElement('div');
    mainDiv.className = 'flex items-center justify-between';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'truncate font-medium text-white flex-1 mr-2';
    nameSpan.title = f.name;
    nameSpan.textContent = f.name;

    const dragHandle = document.createElement('div');
    dragHandle.className =
      'drag-handle cursor-move text-gray-400 hover:text-white p-1 rounded transition-colors';
    dragHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>`; // Safe: static content

    mainDiv.append(nameSpan, dragHandle);

    const rangeDiv = document.createElement('div');
    rangeDiv.className = 'mt-2';

    const label = document.createElement('label');
    label.htmlFor = `range-${safeFileName}`;
    label.className = 'text-xs text-gray-400';
    label.textContent = `Pages (e.g., 1-3, 5) - Total: ${pageCount}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `range-${safeFileName}`;
    input.className =
      'w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm mt-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors';
    input.placeholder = 'Leave blank for all pages';

    rangeDiv.append(label, input);
    li.append(mainDiv, rangeDiv);
    fileList.appendChild(li);
  });

  initializeFileListSortable();

  const newFileModeBtn = fileModeBtn.cloneNode(true) as HTMLElement;
  const newPageModeBtn = pageModeBtn.cloneNode(true) as HTMLElement;
  fileModeBtn.replaceWith(newFileModeBtn);
  pageModeBtn.replaceWith(newPageModeBtn);

  newFileModeBtn.addEventListener('click', () => {
    if (mergeState.activeMode === 'file') return;

    mergeState.activeMode = 'file';
    filePanel.classList.remove('hidden');
    pagePanel.classList.add('hidden');

    newFileModeBtn.classList.add('bg-indigo-600', 'text-white');
    newFileModeBtn.classList.remove('bg-gray-700', 'text-gray-300');
    newPageModeBtn.classList.remove('bg-indigo-600', 'text-white');
    newPageModeBtn.classList.add('bg-gray-700', 'text-gray-300');
  });

  newPageModeBtn.addEventListener('click', async () => {
    if (mergeState.activeMode === 'page') return;

    mergeState.activeMode = 'page';
    filePanel.classList.add('hidden');
    pagePanel.classList.remove('hidden');

    newPageModeBtn.classList.add('bg-indigo-600', 'text-white');
    newPageModeBtn.classList.remove('bg-gray-700', 'text-gray-300');
    newFileModeBtn.classList.remove('bg-indigo-600', 'text-white');
    newFileModeBtn.classList.add('bg-gray-700', 'text-gray-300');

    await renderPageMergeThumbnails();
  });

  if (wasInPageMode) {
    mergeState.activeMode = 'page';
    filePanel.classList.add('hidden');
    pagePanel.classList.remove('hidden');

    newPageModeBtn.classList.add('bg-indigo-600', 'text-white');
    newPageModeBtn.classList.remove('bg-gray-700', 'text-gray-300');
    newFileModeBtn.classList.remove('bg-indigo-600', 'text-white');
    newFileModeBtn.classList.add('bg-gray-700', 'text-gray-300');

    await renderPageMergeThumbnails();
  } else {
    newFileModeBtn.classList.add('bg-indigo-600', 'text-white');
    newPageModeBtn.classList.add('bg-gray-700', 'text-gray-300');
  }
}
