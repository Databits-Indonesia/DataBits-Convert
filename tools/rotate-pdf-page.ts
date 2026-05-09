import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes, getPDFDocument } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument, RotationTypes } from 'pdf-lib';
import { renderPagesProgressively, cleanupLazyRendering } from '../utils/render-utils';
import * as pdfjsLib from 'pdfjs-dist';
import { state } from '../state';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface RotateState {
  pdfDoc: PDFLibDocument | null;
  pdfJsDoc: pdfjsLib.PDFDocumentProxy | null;
  rotations: number[];
}

const rotateState: RotateState = {
  pdfDoc: null,
  pdfJsDoc: null,
  rotations: [],
};

function resetState() {
  cleanupLazyRendering();
  rotateState.pdfDoc = null;
  rotateState.pdfJsDoc = null;
  rotateState.rotations = [];

  const fileDisplayArea = document.getElementById('file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const pageThumbnails = document.getElementById('page-thumbnails');
  if (pageThumbnails) pageThumbnails.innerHTML = '';
}

function updateAllRotationDisplays() {
  for (let i = 0; i < rotateState.rotations.length; i++) {
    const container = document.querySelector(`[data-page-index="${i}"]`);
    if (container) {
      const wrapper = container.querySelector('.thumbnail-wrapper') as HTMLElement;
      if (wrapper) wrapper.style.transform = `rotate(${rotateState.rotations[i]}deg)`;
    }
  }
}

function createPageWrapper(canvas: HTMLCanvasElement, pageNumber: number): HTMLElement {
  const pageIndex = pageNumber - 1;

  const container = document.createElement('div');
  container.className = 'page-thumbnail relative bg-gray-700 rounded-lg overflow-hidden';
  container.dataset.pageIndex = pageIndex.toString();
  container.dataset.pageNumber = pageNumber.toString();

  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'thumbnail-wrapper flex items-center justify-center p-2 h-36';
  canvasWrapper.style.transition = 'transform 0.3s ease';
  // Apply initial rotation if it exists
  const initialRotation = rotateState.rotations[pageIndex] || 0;
  canvasWrapper.style.transform = `rotate(${initialRotation}deg)`;

  canvas.className = 'max-w-full max-h-full object-contain';
  canvasWrapper.appendChild(canvas);

  const pageLabel = document.createElement('div');
  pageLabel.className =
    'absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded';
  pageLabel.textContent = `${pageNumber}`;

  container.appendChild(canvasWrapper);
  container.appendChild(pageLabel);

  // Per-page rotation controls - Left and Right buttons only
  const controls = document.createElement('div');
  controls.className = 'flex items-center justify-center gap-2 p-2 bg-gray-800';

  const rotateLeftBtn = document.createElement('button');
  rotateLeftBtn.className =
    'flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 text-xs';
  rotateLeftBtn.innerHTML = '<i data-lucide="rotate-ccw" class="w-3 h-3"></i>';
  rotateLeftBtn.onclick = function (e) {
    e.stopPropagation();
    rotateState.rotations[pageIndex] = rotateState.rotations[pageIndex] - 90;
    const wrapper = container.querySelector('.thumbnail-wrapper') as HTMLElement;
    if (wrapper) wrapper.style.transform = `rotate(${rotateState.rotations[pageIndex]}deg)`;
  };

  const rotateRightBtn = document.createElement('button');
  rotateRightBtn.className =
    'flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 text-xs';
  rotateRightBtn.innerHTML = '<i data-lucide="rotate-cw" class="w-3 h-3"></i>';
  rotateRightBtn.onclick = function (e) {
    e.stopPropagation();
    rotateState.rotations[pageIndex] = rotateState.rotations[pageIndex] + 90;
    const wrapper = container.querySelector('.thumbnail-wrapper') as HTMLElement;
    if (wrapper) wrapper.style.transform = `rotate(${rotateState.rotations[pageIndex]}deg)`;
  };

  controls.append(rotateLeftBtn, rotateRightBtn);
  container.appendChild(controls);

  // Re-create icons for the new element
  setTimeout(function () {
    createIcons({ icons });
  }, 0);

  return container;
}

async function renderThumbnails() {
  const pageThumbnails = document.getElementById('page-thumbnails');
  if (!pageThumbnails || !rotateState.pdfJsDoc) return;

  pageThumbnails.innerHTML = '';

  await renderPagesProgressively(rotateState.pdfJsDoc, pageThumbnails, createPageWrapper, {
    batchSize: 8,
    useLazyLoading: true,
    lazyLoadMargin: '200px',
    onBatchComplete: function () {
      createIcons({ icons });
    },
  });

  createIcons({ icons });
}

async function updateUI() {
  const fileDisplayArea = document.getElementById('file-display-area');
  const toolOptions = document.getElementById('tool-options');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (state.files.length > 0) {
    const file = state.files[0]; // Use first file from state
    const fileDiv = document.createElement('div');
    fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'flex flex-col overflow-hidden';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
    nameSpan.textContent = file.name;

    const metaSpan = document.createElement('div');
    metaSpan.className = 'text-xs text-gray-400';
    metaSpan.textContent = `${formatBytes(file.size)} • Loading...`;

    infoContainer.append(nameSpan, metaSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
    removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    removeBtn.onclick = function () {
      state.files = [];
      resetState();
    };

    fileDiv.append(infoContainer, removeBtn);
    fileDisplayArea.appendChild(fileDiv);
    createIcons({ icons });

    try {
      showLoader('Loading PDF...');
      const arrayBuffer = await file.arrayBuffer();

      rotateState.pdfDoc = await PDFLibDocument.load(arrayBuffer.slice(0), {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      rotateState.pdfJsDoc = await getPDFDocument({ data: arrayBuffer.slice(0) }).promise;

      const pageCount = rotateState.pdfDoc.getPageCount();
      rotateState.rotations = new Array(pageCount).fill(0);

      metaSpan.textContent = `${formatBytes(file.size)} • ${pageCount} pages`;

      await renderThumbnails();
      hideLoader();

      if (toolOptions) {
        toolOptions.classList.remove('hidden');
        // Setup button listeners AFTER showing the options
        setupButtonListeners();
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      hideLoader();
      showAlert('Error', 'Failed to load PDF file.');
      resetState();
    }
  } else {
    if (toolOptions) toolOptions.classList.add('hidden');
  }
}

function setupButtonListeners() {
  console.log('[Rotate] setupButtonListeners called');

  const processBtn = document.getElementById('rotate-process-btn');
  const rotateAllLeft = document.getElementById('rotate-all-left');
  const rotateAllRight = document.getElementById('rotate-all-right');

  console.log('[Rotate] processBtn:', processBtn);
  console.log('[Rotate] rotateAllLeft:', rotateAllLeft);
  console.log('[Rotate] rotateAllRight:', rotateAllRight);

  if (rotateAllLeft) {
    rotateAllLeft.onclick = function () {
      console.log('[Rotate] Rotate all left clicked');
      for (let i = 0; i < rotateState.rotations.length; i++) {
        rotateState.rotations[i] = rotateState.rotations[i] - 90;
      }
      updateAllRotationDisplays();
    };
  }

  if (rotateAllRight) {
    rotateAllRight.onclick = function () {
      console.log('[Rotate] Rotate all right clicked');
      for (let i = 0; i < rotateState.rotations.length; i++) {
        rotateState.rotations[i] = rotateState.rotations[i] + 90;
      }
      updateAllRotationDisplays();
    };
  }

  if (processBtn) {
    console.log('[Rotate] Adding click listener to process button');
    processBtn.onclick = function () {
      console.log('[Rotate] Process button clicked!');
      applyRotations();
    };
  } else {
    console.warn('[Rotate] Process button not found!');
  }

  // Also expose on window for debugging
  (window as any).testRotateApply = applyRotations;
  console.log('[Rotate] Test function available as: window.testRotateApply()');
}

async function applyRotations() {
  console.log('[Rotate] applyRotations called');
  console.log('[Rotate] rotateState.pdfDoc:', rotateState.pdfDoc);
  console.log('[Rotate] state.files:', state.files);
  console.log('[Rotate] rotateState.rotations:', rotateState.rotations);

  if (!rotateState.pdfDoc || state.files.length === 0) {
    showAlert('Error', 'Please upload a PDF first.');
    return;
  }

  showLoader('Applying rotations...');

  try {
    const pages = rotateState.pdfDoc.getPages();
    console.log('[Rotate] Pages count:', pages.length);

    for (let i = 0; i < pages.length; i++) {
      if (rotateState.rotations[i] !== 0) {
        const currentRotation = pages[i].getRotation().angle;
        const newRotation = (currentRotation + rotateState.rotations[i]) % 360;
        console.log(`[Rotate] Page ${i}: rotating from ${currentRotation} to ${newRotation}`);
        pages[i].setRotation({ type: RotationTypes.Degrees, angle: newRotation });
      }
    }

    console.log('[Rotate] Saving PDF...');
    const pdfBytes = await rotateState.pdfDoc.save();
    console.log('[Rotate] PDF saved, size:', pdfBytes.length);

    const originalName = state.files[0].name.replace(/\.pdf$/i, '');
    const filename = `${originalName}_rotated.pdf`;
    console.log('[Rotate] Downloading as:', filename);

    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], {
        type: 'application/pdf',
      }),
      filename
    );

    console.log('[Rotate] Download triggered');
    hideLoader();

    showAlert('Success', 'Rotations applied successfully!', 'success', function () {
      state.files = [];
      resetState();
    });
  } catch (e) {
    console.error('[Rotate] Error:', e);
    hideLoader();
    showAlert('Error', 'Could not apply rotations.');
  }
}

// Export for use in other modules
export { applyRotations };

export async function setupRotateTool() {
  console.log('[Rotate] setupRotateTool called');
  document.getElementById('rotate-tool-container')?.classList.remove('hidden');

  // Load PDF from state if files are already present
  console.log('[Rotate] Checking for existing files, count:', state.files.length);
  if (state.files.length > 0) {
    console.log('[Rotate] Loading PDF from existing files');
    await updateUI();
  }
}
