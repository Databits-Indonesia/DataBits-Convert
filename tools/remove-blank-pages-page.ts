import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createIcons, icons } from 'lucide';
import { initPagePreview } from '../utils/page-preview';
import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { state } from '../state';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// State
const pageState: {
  pdfDoc: PDFDocument | null;
  detectedBlankPages: number[];
  pageThumbnails: Map<number, string>;
} = {
  pdfDoc: null,
  detectedBlankPages: [],
  pageThumbnails: new Map(),
};

function updateFileDisplay() {
  const area = document.getElementById('remove-blank-file-display-area');
  if (!area || state.files.length === 0 || !pageState.pdfDoc) return;

  const file = state.files[0];
  const fileSize =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  const pageCount = pageState.pdfDoc.getPageCount();

  area.innerHTML = `
        <div class="bg-gray-700 p-3 rounded-lg border border-gray-600 hover:border-indigo-500 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <p class="truncate font-medium text-white">${file.name}</p>
                    <p class="text-gray-400 text-sm">${fileSize} • ${pageCount} page${pageCount !== 1 ? 's' : ''}</p>
                </div>
                <button id="remove-blank-remove-file" class="text-red-400 hover:text-red-300 p-2 flex-shrink-0 ml-2" title="Remove file">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;
  createIcons({ icons });
  document.getElementById('remove-blank-remove-file')?.addEventListener('click', resetState);
}

function resetState() {
  pageState.pdfDoc = null;
  pageState.detectedBlankPages = [];
  pageState.pageThumbnails.forEach((url) => URL.revokeObjectURL(url));
  pageState.pageThumbnails.clear();

  const area = document.getElementById('remove-blank-file-display-area');
  if (area) area.innerHTML = '';
  document.getElementById('remove-blank-options-panel')?.classList.add('hidden');
  document.getElementById('remove-blank-preview-panel')?.classList.add('hidden');
  
  const slider = document.getElementById('remove-blank-sensitivity-slider') as HTMLInputElement;
  if (slider) slider.value = '80';
  const sliderLabel = document.getElementById('remove-blank-sensitivity-value');
  if (sliderLabel) sliderLabel.textContent = '80';
}

async function handleFileUpload() {
  if (state.files.length === 0) {
    showAlert('Error', 'Please upload a valid PDF file.');
    return;
  }
  
  const file = state.files[0];
  showLoader('Loading PDF...');
  try {
    const buf = await file.arrayBuffer();
    pageState.pdfDoc = await PDFDocument.load(buf);
    pageState.detectedBlankPages = [];
    updateFileDisplay();
    document.getElementById('remove-blank-options-panel')?.classList.remove('hidden');
    document.getElementById('remove-blank-preview-panel')?.classList.add('hidden');
    setupButtonListeners();
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Failed to load PDF file.');
  } finally {
    hideLoader();
  }
}

function setupButtonListeners() {
  const detectBtn = document.getElementById('remove-blank-detect-btn');
  const processBtn = document.getElementById('remove-blank-process-btn');
  const sensitivitySlider = document.getElementById('remove-blank-sensitivity-slider') as HTMLInputElement;
  const sensitivityValue = document.getElementById('remove-blank-sensitivity-value');

  if (sensitivitySlider && sensitivityValue) {
    sensitivitySlider.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      sensitivityValue.textContent = value;
    });
  }

  if (detectBtn) {
    detectBtn.onclick = () => detectBlankPages();
  }

  if (processBtn) {
    processBtn.onclick = () => processRemoveBlankPages();
  }
}

async function isPageBlank(
  page: any,
  maxNonWhitePercent = 0.5
): Promise<boolean> {
  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const totalPixels = data.length / 4;

  let nonWhitePixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness < 240) nonWhitePixels++;
  }

  const nonWhitePercent = (nonWhitePixels / totalPixels) * 100;
  return nonWhitePercent <= maxNonWhitePercent;
}

async function generateThumbnail(page: any): Promise<string> {
  const viewport = page.getViewport({ scale: 1 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.7);
}

async function detectBlankPages() {
  if (!pageState.pdfDoc || state.files.length === 0)
    return showAlert('Error', 'Please upload a PDF first.');

  const file = state.files[0];
  const sensitivitySlider = document.getElementById('remove-blank-sensitivity-slider') as HTMLInputElement;
  const sensitivityPercent = parseInt(sensitivitySlider?.value || '80');
  const maxNonWhitePercent = 5 - (sensitivityPercent / 100) * 4.9;

  showLoader('Detecting blank pages...');
  try {
    const pdfData = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const totalPages = pdfDoc.numPages;

    pageState.detectedBlankPages = [];
    pageState.pageThumbnails.forEach((url) => URL.revokeObjectURL(url));
    pageState.pageThumbnails.clear();

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      if (await isPageBlank(page, maxNonWhitePercent)) {
        pageState.detectedBlankPages.push(i - 1); // 0-indexed
        const thumbnail = await generateThumbnail(page);
        pageState.pageThumbnails.set(i - 1, thumbnail);
      }
    }

    if (pageState.detectedBlankPages.length === 0) {
      showAlert('Info', 'No blank pages detected in this PDF.');
      hideLoader();
      return;
    }

    // Show preview panel
    updatePreviewPanel();
    document.getElementById('remove-blank-preview-panel')?.classList.remove('hidden');

    const previewContainer = document.getElementById('remove-blank-pages-preview');
    if (previewContainer) initPagePreview(previewContainer, pdfDoc);

    hideLoader();
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Could not detect blank pages.');
    hideLoader();
  }
}

function updatePreviewPanel() {
  const previewInfo = document.getElementById('remove-blank-preview-info');
  const previewContainer = document.getElementById('remove-blank-pages-preview');

  if (!previewInfo || !previewContainer) return;

  previewInfo.textContent = `Found ${pageState.detectedBlankPages.length} blank page(s). Click on a page to deselect it.`;
  previewContainer.innerHTML = '';

  pageState.detectedBlankPages.forEach((pageIndex) => {
    const thumbnail = pageState.pageThumbnails.get(pageIndex) || '';
    const div = document.createElement('div');
    div.className =
      'relative cursor-pointer flex flex-col items-center gap-1 p-2 border-2 border-red-500 rounded-lg bg-gray-700 transition-colors group';
    div.dataset.pageIndex = String(pageIndex);
    div.dataset.selected = 'true';

    div.innerHTML = `
            <div class="relative">
                <img src="${thumbnail}" alt="Page ${pageIndex + 1}" class="rounded-md shadow-md max-w-full h-auto">
                <div class="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-lg z-10 pointer-events-none">
                    ${pageIndex + 1}
                </div>
                <div class="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center check-mark z-10">
                    <i data-lucide="check" class="w-3 h-3 text-white"></i>
                </div>
            </div>
        `;

    div.addEventListener('click', () => togglePageSelection(div, pageIndex));
    previewContainer.appendChild(div);
  });

  createIcons({ icons });
}

function togglePageSelection(div: HTMLElement, pageIndex: number) {
  const isSelected = div.dataset.selected === 'true';
  const checkMark = div.querySelector('.check-mark') as HTMLElement;

  if (isSelected) {
    div.dataset.selected = 'false';
    div.classList.remove('border-red-500');
    div.classList.add('border-gray-600', 'opacity-50');
    checkMark?.classList.add('hidden');
  } else {
    div.dataset.selected = 'true';
    div.classList.add('border-red-500');
    div.classList.remove('border-gray-600', 'opacity-50');
    checkMark?.classList.remove('hidden');
  }
}

async function processRemoveBlankPages() {
  if (!pageState.pdfDoc || state.files.length === 0)
    return showAlert('Error', 'Please upload a PDF first.');

  // Get selected pages to remove
  const previewContainer = document.getElementById('remove-blank-pages-preview');
  const selectedPages: number[] = [];
  previewContainer?.querySelectorAll('[data-selected="true"]').forEach((el) => {
    const pageIndex = parseInt((el as HTMLElement).dataset.pageIndex || '-1');
    if (pageIndex >= 0) selectedPages.push(pageIndex);
  });

  if (selectedPages.length === 0) {
    showAlert('Info', 'No pages selected for removal.');
    return;
  }

  showLoader(`Removing ${selectedPages.length} blank page(s)...`);
  try {
    const newPdf = await PDFDocument.create();
    const pages = pageState.pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      if (!selectedPages.includes(i)) {
        const [copiedPage] = await newPdf.copyPages(pageState.pdfDoc, [i]);
        newPdf.addPage(copiedPage);
      }
    }

    const newPdfBytes = await newPdf.save();
    const originalName = state.files[0].name.replace(/\.pdf$/i, '');
    
    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_blank-pages-removed.pdf`
    );
    showAlert(
      'Success',
      `Removed ${selectedPages.length} blank page(s) successfully!`,
      'success',
      resetState
    );
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Could not remove blank pages.');
  } finally {
    hideLoader();
  }
}

export async function setupRemoveBlankPagesTool() {
  console.log('[RemoveBlankPages] setupRemoveBlankPagesTool called');
  
  const container = document.getElementById('remove-blank-pages-container');
  console.log('[RemoveBlankPages] Container element:', container);
  
  if (container) {
    container.classList.remove('hidden');
    console.log('[RemoveBlankPages] Container shown');
  } else {
    console.error('[RemoveBlankPages] Container not found!');
  }
  
  if (state.files.length > 0) {
    console.log('[RemoveBlankPages] Loading PDF from files');
    await handleFileUpload();
  }
}
