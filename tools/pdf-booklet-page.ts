import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes, readFileAsArrayBuffer } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument, degrees, PageSizes } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { state } from '../state';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface BookletState {
  pdfDoc: PDFLibDocument | null;
  pdfBytes: Uint8Array | null;
  pdfjsDoc: pdfjsLib.PDFDocumentProxy | null;
}

let bookletState: BookletState = {
  pdfDoc: null,
  pdfBytes: null,
  pdfjsDoc: null,
};

let isBookletSetup = false;

// ============ Element Helpers ============

function getBookletElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const direct = document.getElementById(id) as T | null;
  if (direct) return direct;

  const container = document.getElementById('booklet-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as T | null;
}

// ============ Dynamic UI Generation ============

function ensureBookletUi() {
  const container = document.getElementById('booklet-container');
  if (!container) return;

  const panelRoot =
    (container.querySelector('.bg-white') as HTMLElement | null) ||
    (container.firstElementChild as HTMLElement | null) ||
    container;

  let body = getBookletElement('booklet-body');
  if (!body) {
    body = document.createElement('div');
    body.id = 'booklet-body';
    body.className = 'space-y-6';
    panelRoot.appendChild(body);
  }

  // File display area
  if (!getBookletElement('booklet-file-display-area')) {
    const fileArea = document.createElement('div');
    fileArea.id = 'booklet-file-display-area';
    fileArea.className = 'space-y-2';
    body.appendChild(fileArea);
  }

  // Options panel
  if (!getBookletElement('booklet-options')) {
    const options = document.createElement('div');
    options.id = 'booklet-options';
    options.className = 'hidden space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg';
    options.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grid Mode</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="radio" name="grid-mode" value="1x2" checked class="mr-2">
              <span class="text-sm">1×2 (Booklet)</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="grid-mode" value="2x2" class="mr-2">
              <span class="text-sm">2×2 (4-up)</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="grid-mode" value="2x4" class="mr-2">
              <span class="text-sm">2×4 (8-up)</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="grid-mode" value="4x4" class="mr-2">
              <span class="text-sm">4×4 (16-up)</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paper Size</label>
          <select id="paper-size" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="Letter">Letter (8.5" × 11")</option>
            <option value="Legal">Legal (8.5" × 14")</option>
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="A5">A5 (148 × 210 mm)</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orientation</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="radio" name="orientation" value="auto" checked class="mr-2">
              <span class="text-sm">Auto</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="orientation" value="portrait" class="mr-2">
              <span class="text-sm">Portrait</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="orientation" value="landscape" class="mr-2">
              <span class="text-sm">Landscape</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Rotation</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="radio" name="rotation" value="none" checked class="mr-2">
              <span class="text-sm">None</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="rotation" value="90cw" class="mr-2">
              <span class="text-sm">90° Clockwise</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="rotation" value="90ccw" class="mr-2">
              <span class="text-sm">90° Counter-clockwise</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="rotation" value="alternate" class="mr-2">
              <span class="text-sm">Alternate</span>
            </label>
          </div>
        </div>
      </div>
      <div class="flex justify-center space-x-4">
        <button id="booklet-preview-btn" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Generate Preview
        </button>
        <button id="booklet-download-btn" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Create Booklet
        </button>
      </div>
    `;
    body.appendChild(options);
  }

  // Preview area
  if (!getBookletElement('booklet-preview')) {
    const preview = document.createElement('div');
    preview.id = 'booklet-preview';
    preview.className = 'mt-4';
    preview.innerHTML =
      '<p class="text-gray-400 text-center py-8">Upload a PDF and click "Generate Preview" to see the booklet layout</p>';
    body.appendChild(preview);
  }
}

// ============ State Management ============

function resetState() {
  bookletState.pdfDoc = null;
  bookletState.pdfBytes = null;
  bookletState.pdfjsDoc = null;

  const fileDisplayArea = getBookletElement('booklet-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = getBookletElement('booklet-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const previewArea = getBookletElement('booklet-preview');
  if (previewArea) {
    previewArea.innerHTML =
      '<p class="text-gray-400 text-center py-8">Upload a PDF and click "Generate Preview" to see the booklet layout</p>';
  }

  const downloadBtn = getBookletElement<HTMLButtonElement>('booklet-download-btn');
  if (downloadBtn) downloadBtn.disabled = true;
}

async function updateUI() {
  const fileDisplayArea = getBookletElement('booklet-file-display-area');
  const toolOptions = getBookletElement('booklet-options');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (state.files.length > 0) {
    const file = state.files[0];

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
      bookletState.pdfBytes = new Uint8Array(arrayBuffer);

      bookletState.pdfDoc = await PDFLibDocument.load(bookletState.pdfBytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      bookletState.pdfjsDoc = await pdfjsLib.getDocument({
        data: bookletState.pdfBytes.slice(),
      }).promise;

      hideLoader();

      const pageCount = bookletState.pdfDoc.getPageCount();
      metaSpan.textContent = `${formatBytes(file.size)} • ${pageCount} pages`;

      if (toolOptions) toolOptions.classList.remove('hidden');

      const previewBtn = getBookletElement<HTMLButtonElement>('booklet-preview-btn');
      if (previewBtn) previewBtn.disabled = false;
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

// ============ Settings ============

function getGridDimensions(): { rows: number; cols: number } {
  const gridMode =
    getBookletElement<HTMLInputElement>('grid-mode')?.value ||
    (document.querySelector('input[name="grid-mode"]:checked') as HTMLInputElement)?.value ||
    '1x2';
  switch (gridMode) {
    case '1x2':
      return { rows: 1, cols: 2 };
    case '2x2':
      return { rows: 2, cols: 2 };
    case '2x4':
      return { rows: 2, cols: 4 };
    case '4x4':
      return { rows: 4, cols: 4 };
    default:
      return { rows: 1, cols: 2 };
  }
}

function getOrientation(isBookletMode: boolean): 'portrait' | 'landscape' {
  const orientationValue =
    getBookletElement<HTMLInputElement>('orientation')?.value ||
    (document.querySelector('input[name="orientation"]:checked') as HTMLInputElement)?.value ||
    'auto';
  if (orientationValue === 'portrait') return 'portrait';
  if (orientationValue === 'landscape') return 'landscape';
  return isBookletMode ? 'landscape' : 'portrait';
}

function getSheetDimensions(isBookletMode: boolean): { width: number; height: number } {
  const paperSizeKey =
    ((getBookletElement('paper-size') as HTMLSelectElement)?.value as keyof typeof PageSizes) ||
    (document.getElementById('paper-size') as HTMLSelectElement)?.value ||
    'Letter';
  const pageDims = PageSizes[paperSizeKey as keyof typeof PageSizes] || PageSizes.Letter;
  const orientation = getOrientation(isBookletMode);
  if (orientation === 'landscape') {
    return { width: pageDims[1], height: pageDims[0] };
  }
  return { width: pageDims[0], height: pageDims[1] };
}

// ============ Preview ============

async function generatePreview() {
  if (!bookletState.pdfDoc || !bookletState.pdfjsDoc) {
    showAlert('Error', 'Please load a PDF first.');
    return;
  }

  const previewArea = getBookletElement('booklet-preview')!;
  const totalPages = bookletState.pdfDoc.getPageCount();
  const { rows, cols } = getGridDimensions();
  const pagesPerSheet = rows * cols;
  const isBookletMode = rows === 1 && cols === 2;

  let numSheets: number;
  if (isBookletMode) {
    const sheetsNeeded = Math.ceil(totalPages / 4);
    numSheets = sheetsNeeded * 2;
  } else {
    numSheets = Math.ceil(totalPages / pagesPerSheet);
  }

  const { width: sheetWidth, height: sheetHeight } = getSheetDimensions(isBookletMode);

  const previewContainer = getBookletElement('booklet-preview');
  const containerWidth = previewContainer ? previewContainer.clientWidth - 32 : 800;
  const aspectRatio = sheetWidth / sheetHeight;
  const canvasWidth = containerWidth;
  const canvasHeight = containerWidth / aspectRatio;

  previewArea.innerHTML = '<p class="text-gray-400 text-center py-4">Generating preview...</p>';

  const totalRounded = isBookletMode ? Math.ceil(totalPages / 4) * 4 : totalPages;
  const rotationMode =
    getBookletElement<HTMLInputElement>('rotation')?.value ||
    (document.querySelector('input[name="rotation"]:checked') as HTMLInputElement)?.value ||
    'none';

  const pageThumbnails: Map<number, ImageBitmap> = new Map();
  const thumbnailScale = 1;

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page = await bookletState.pdfjsDoc.getPage(i);
      const viewport = page.getViewport({ scale: thumbnailScale });

      const offscreen = new OffscreenCanvas(viewport.width, viewport.height);
      const ctx = offscreen.getContext('2d')!;

      await page.render({
        canvasContext: ctx as any,
        viewport: viewport,
        canvas: offscreen as any,
      }).promise;

      const bitmap = await createImageBitmap(offscreen);
      pageThumbnails.set(i, bitmap);
    } catch (e) {
      console.error(`Failed to render page ${i}:`, e);
    }
  }

  previewArea.innerHTML = `<p class="text-indigo-400 text-sm mb-4 text-center">${totalPages} pages → ${numSheets} output sheets</p>`;

  for (let sheetIndex = 0; sheetIndex < numSheets; sheetIndex++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.className = 'border border-gray-600 rounded-lg mb-4';

    const ctx = canvas.getContext('2d')!;

    const isFront = sheetIndex % 2 === 0;
    ctx.fillStyle = isFront ? '#1f2937' : '#1a2e1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    const cellWidth = canvasWidth / cols;
    const cellHeight = canvasHeight / rows;
    const padding = 4;

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellWidth, 0);
      ctx.lineTo(c * cellWidth, canvasHeight);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellHeight);
      ctx.lineTo(canvasWidth, r * cellHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIndex = r * cols + c;
        let pageNumber: number;

        if (isBookletMode) {
          const physicalSheet = Math.floor(sheetIndex / 2);
          const isFrontSide = sheetIndex % 2 === 0;
          if (isFrontSide) {
            pageNumber = c === 0 ? totalRounded - 2 * physicalSheet : 2 * physicalSheet + 1;
          } else {
            pageNumber = c === 0 ? 2 * physicalSheet + 2 : totalRounded - 2 * physicalSheet - 1;
          }
        } else {
          pageNumber = sheetIndex * pagesPerSheet + slotIndex + 1;
        }

        const x = c * cellWidth + padding;
        const y = r * cellHeight + padding;
        const slotWidth = cellWidth - padding * 2;
        const slotHeight = cellHeight - padding * 2;

        const exists = pageNumber >= 1 && pageNumber <= totalPages;

        if (exists) {
          const thumbnail = pageThumbnails.get(pageNumber);
          if (thumbnail) {
            let rotation = 0;
            if (rotationMode === '90cw') rotation = 90;
            else if (rotationMode === '90ccw') rotation = -90;
            else if (rotationMode === 'alternate') rotation = pageNumber % 2 === 1 ? 90 : -90;

            const isRotated = rotation !== 0;
            const srcWidth = isRotated ? thumbnail.height : thumbnail.width;
            const srcHeight = isRotated ? thumbnail.width : thumbnail.height;
            const scale = Math.min(slotWidth / srcWidth, slotHeight / srcHeight);
            const drawWidth = srcWidth * scale;
            const drawHeight = srcHeight * scale;
            const drawX = x + (slotWidth - drawWidth) / 2;
            const drawY = y + (slotHeight - drawHeight) / 2;

            ctx.save();
            if (rotation !== 0) {
              const centerX = drawX + drawWidth / 2;
              const centerY = drawY + drawHeight / 2;
              ctx.translate(centerX, centerY);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.drawImage(thumbnail, -drawHeight / 2, -drawWidth / 2, drawHeight, drawWidth);
            } else {
              ctx.drawImage(thumbnail, drawX, drawY, drawWidth, drawHeight);
            }
            ctx.restore();

            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${pageNumber}`, x + slotWidth / 2, y + slotHeight - 4);
          }
        } else {
          ctx.fillStyle = '#374151';
          ctx.fillRect(x, y, slotWidth, slotHeight);
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, slotWidth, slotHeight);

          ctx.fillStyle = '#6b7280';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('(blank)', x + slotWidth / 2, y + slotHeight / 2);
        }
      }
    }

    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const sideLabel = isBookletMode ? (isFront ? 'Front' : 'Back') : '';
    ctx.fillText(
      `Sheet ${Math.floor(sheetIndex / (isBookletMode ? 2 : 1)) + 1} ${sideLabel}`,
      canvasWidth - 6,
      4
    );

    previewArea.appendChild(canvas);
  }

  pageThumbnails.forEach((bitmap) => bitmap.close());

  const downloadBtn = getBookletElement<HTMLButtonElement>('booklet-download-btn');
  if (downloadBtn) downloadBtn.disabled = false;
}

// ============ Processing ============

function applyRotation(doc: PDFLibDocument, mode: string) {
  const pages = doc.getPages();
  pages.forEach((page, index) => {
    let rotation: number;
    switch (mode) {
      case '90cw':
        rotation = 90;
        break;
      case '90ccw':
        rotation = -90;
        break;
      case 'alternate':
        rotation = index % 2 === 0 ? 90 : -90;
        break;
      default:
        rotation = 0;
    }
    if (rotation !== 0) {
      page.setRotation(degrees(page.getRotation().angle + rotation));
    }
  });
}

function getBookletOutputFileName(inputName: string): string {
  if (/\.pdf$/i.test(inputName)) {
    return inputName.replace(/\.pdf$/i, '_booklet.pdf');
  }
  return `${inputName}_booklet.pdf`;
}

async function createBooklet() {
  if (!bookletState.pdfBytes) {
    showAlert('Error', 'Please load a PDF first.');
    return;
  }

  showLoader('Creating Booklet...');

  try {
    const sourceDoc = await PDFLibDocument.load(bookletState.pdfBytes.slice());
    const rotationMode =
      getBookletElement<HTMLInputElement>('rotation')?.value ||
      (document.querySelector('input[name="rotation"]:checked') as HTMLInputElement)?.value ||
      'none';
    applyRotation(sourceDoc, rotationMode);

    const totalPages = sourceDoc.getPageCount();
    const { rows, cols } = getGridDimensions();
    const pagesPerSheet = rows * cols;
    const isBookletMode = rows === 1 && cols === 2;

    const { width: sheetWidth, height: sheetHeight } = getSheetDimensions(isBookletMode);

    const outputDoc = await PDFLibDocument.create();

    let numSheets: number;
    let totalRounded: number;
    if (isBookletMode) {
      totalRounded = Math.ceil(totalPages / 4) * 4;
      numSheets = Math.ceil(totalPages / 4) * 2;
    } else {
      totalRounded = totalPages;
      numSheets = Math.ceil(totalPages / pagesPerSheet);
    }

    const cellWidth = sheetWidth / cols;
    const cellHeight = sheetHeight / rows;
    const padding = 10;

    for (let sheetIndex = 0; sheetIndex < numSheets; sheetIndex++) {
      const outputPage = outputDoc.addPage([sheetWidth, sheetHeight]);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const slotIndex = r * cols + c;
          let pageNumber: number;

          if (isBookletMode) {
            const physicalSheet = Math.floor(sheetIndex / 2);
            const isFrontSide = sheetIndex % 2 === 0;
            if (isFrontSide) {
              pageNumber = c === 0 ? totalRounded - 2 * physicalSheet : 2 * physicalSheet + 1;
            } else {
              pageNumber = c === 0 ? 2 * physicalSheet + 2 : totalRounded - 2 * physicalSheet - 1;
            }
          } else {
            pageNumber = sheetIndex * pagesPerSheet + slotIndex + 1;
          }

          if (pageNumber >= 1 && pageNumber <= totalPages) {
            const [embeddedPage] = await outputDoc.embedPdf(sourceDoc, [pageNumber - 1]);
            const { width: srcW, height: srcH } = embeddedPage;

            const availableWidth = cellWidth - padding * 2;
            const availableHeight = cellHeight - padding * 2;
            const scale = Math.min(availableWidth / srcW, availableHeight / srcH);

            const scaledWidth = srcW * scale;
            const scaledHeight = srcH * scale;

            const x = c * cellWidth + padding + (availableWidth - scaledWidth) / 2;
            const y =
              sheetHeight - (r + 1) * cellHeight + padding + (availableHeight - scaledHeight) / 2;

            outputPage.drawPage(embeddedPage, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
          }
        }
      }
    }

    const pdfBytes = await outputDoc.save();
    const originalName = state.files[0]?.name.replace(/\.pdf$/i, '') || 'document';

    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      getBookletOutputFileName(originalName)
    );

    showAlert('Success', `Booklet created with ${numSheets} sheets!`, 'success');
  } catch (e) {
    console.error(e);
    showAlert('Error', 'An error occurred while creating the booklet.');
  } finally {
    hideLoader();
  }
}

// ============ Main Setup ============

export function setupBookletPage(): void {
  const container = document.getElementById('booklet-container');
  if (container) {
    container.classList.remove('hidden');
  }

  // Ensure UI elements exist
  ensureBookletUi();

  if (state.files.length > 0) {
    updateUI();
  }

  if (isBookletSetup) return;
  isBookletSetup = true;

  const backBtn = getBookletElement('back-to-tools');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const fileInput = getBookletElement<HTMLInputElement>('file-input');
  const dropZone = getBookletElement('drop-zone');
  const previewBtn = getBookletElement('booklet-preview-btn');
  const downloadBtn = getBookletElement('booklet-download-btn');

  const handleFileSelect = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const validFiles = Array.from(newFiles).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      showAlert('Invalid File', 'Please upload a PDF file.');
      return;
    }

    state.files = validFiles;
    bookletState.pdfDoc = null;
    bookletState.pdfBytes = null;
    bookletState.pdfjsDoc = null;
    await updateUI();
  };

  if (fileInput && dropZone) {
    fileInput.addEventListener('change', (e) => {
      handleFileSelect((e.target as HTMLInputElement).files);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('bg-gray-700');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('bg-gray-700');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('bg-gray-700');
      handleFileSelect(e.dataTransfer?.files ?? null);
    });

    fileInput.addEventListener('click', () => {
      fileInput.value = '';
    });
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      void generatePreview();
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      void createBooklet();
    });
  }

  createIcons({ icons });
}
