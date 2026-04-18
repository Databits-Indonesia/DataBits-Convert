import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes, readFileAsArrayBuffer, getPDFDocument } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument } from 'pdf-lib';
import { applyScannerEffect } from '../utils/image-effects';
import * as pdfjsLib from 'pdfjs-dist';
import type { ScanSettings } from '../types';
import { state } from '../state';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ScannerEffectState {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  cachedBaselineData: ImageData | null;
  cachedWidth: number;
  cachedHeight: number;
}

let scannerState: ScannerEffectState = {
  pdfDoc: null,
  cachedBaselineData: null,
  cachedWidth: 0,
  cachedHeight: 0,
};

let isScannerEffectSetup = false;

// ============ Element Helpers ============

function getScannerElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const direct = document.getElementById(id) as T | null;
  if (direct) return direct;

  const container = document.getElementById('scanner-effect-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as T | null;
}

// ============ Settings ============

function getSettings(): ScanSettings {
  return {
    grayscale: getScannerElement<HTMLInputElement>('setting-grayscale')?.checked ?? false,
    border: getScannerElement<HTMLInputElement>('setting-border')?.checked ?? false,
    rotate: parseFloat(getScannerElement<HTMLInputElement>('setting-rotate')?.value ?? '0'),
    rotateVariance: parseFloat(
      getScannerElement<HTMLInputElement>('setting-rotate-variance')?.value ?? '0'
    ),
    brightness: parseInt(getScannerElement<HTMLInputElement>('setting-brightness')?.value ?? '0'),
    contrast: parseInt(getScannerElement<HTMLInputElement>('setting-contrast')?.value ?? '0'),
    blur: parseFloat(getScannerElement<HTMLInputElement>('setting-blur')?.value ?? '0'),
    noise: parseInt(getScannerElement<HTMLInputElement>('setting-noise')?.value ?? '10'),
    yellowish: parseInt(getScannerElement<HTMLInputElement>('setting-yellowish')?.value ?? '0'),
    resolution: parseInt(getScannerElement<HTMLInputElement>('setting-resolution')?.value ?? '150'),
  };
}

// ============ Effects ============

function applyEffects(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  settings: ScanSettings
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  const processed = applyScannerEffect(imageData, {
    brightness: settings.brightness,
    contrast: settings.contrast,
    sharpen: true,
  });

  canvas.width = processed.width;
  canvas.height = processed.height;
  context.putImageData(processed, 0, 0);
}

function updatePreview(): void {
  if (!scannerState.cachedBaselineData) return;

  const previewCanvas = getScannerElement<HTMLCanvasElement>('preview-canvas');
  if (!previewCanvas) return;

  const settings = getSettings();
  const baselineCopy = new ImageData(
    new Uint8ClampedArray(scannerState.cachedBaselineData.data),
    scannerState.cachedWidth,
    scannerState.cachedHeight
  );

  applyEffects(baselineCopy, previewCanvas, settings);
}

async function renderPreview(): Promise<void> {
  if (!scannerState.pdfDoc) return;

  const page = await scannerState.pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  scannerState.cachedBaselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  scannerState.cachedWidth = canvas.width;
  scannerState.cachedHeight = canvas.height;

  updatePreview();
}

// ============ UI ============

function getScannerOutputFileName(inputName: string): string {
  if (/\.pdf$/i.test(inputName)) {
    return inputName.replace(/\.pdf$/i, '_scanned.pdf');
  }
  return `${inputName}_scanned.pdf`;
}

function ensureScannerUi(): void {
  const container = document.getElementById('scanner-effect-container');
  if (!container) return;

  const panelRoot =
    (container.querySelector('.bg-white') as HTMLElement | null) ||
    (container.firstElementChild as HTMLElement | null) ||
    container;

  let body = getScannerElement('scanner-body');
  if (!body) {
    body = document.createElement('div');
    body.id = 'scanner-body';
    body.className = 'space-y-6';
    panelRoot.appendChild(body);
  }

  // File display area
  if (!getScannerElement('scanner-file-display-area')) {
    const fileArea = document.createElement('div');
    fileArea.id = 'scanner-file-display-area';
    fileArea.className = 'space-y-2';
    body.appendChild(fileArea);
  }

  // Options panel
  if (!getScannerElement('scanner-options-panel')) {
    const options = document.createElement('div');
    options.id = 'scanner-options-panel';
    options.className = 'hidden space-y-4';
    options.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label for="setting-rotate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rotate</label>
          <input type="range" id="setting-rotate" min="-15" max="15" value="0" class="w-full" />
          <span id="rotate-value" class="text-xs text-gray-500">0°</span>
        </div>
        <div>
          <label for="setting-rotate-variance" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rotate Variance</label>
          <input type="range" id="setting-rotate-variance" min="0" max="10" value="0" class="w-full" />
          <span id="rotate-variance-value" class="text-xs text-gray-500">0°</span>
        </div>
        <div>
          <label for="setting-brightness" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brightness</label>
          <input type="range" id="setting-brightness" min="-50" max="50" value="0" class="w-full" />
          <span id="brightness-value" class="text-xs text-gray-500">0</span>
        </div>
        <div>
          <label for="setting-contrast" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contrast</label>
          <input type="range" id="setting-contrast" min="-50" max="50" value="0" class="w-full" />
          <span id="contrast-value" class="text-xs text-gray-500">0</span>
        </div>
        <div>
          <label for="setting-blur" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blur</label>
          <input type="range" id="setting-blur" min="0" max="5" step="0.5" value="0" class="w-full" />
          <span id="blur-value" class="text-xs text-gray-500">0px</span>
        </div>
        <div>
          <label for="setting-noise" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Noise</label>
          <input type="range" id="setting-noise" min="0" max="50" value="10" class="w-full" />
          <span id="noise-value" class="text-xs text-gray-500">10</span>
        </div>
        <div>
          <label for="setting-yellowish" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yellowish</label>
          <input type="range" id="setting-yellowish" min="0" max="30" value="0" class="w-full" />
          <span id="yellowish-value" class="text-xs text-gray-500">0</span>
        </div>
        <div>
          <label for="setting-resolution" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution</label>
          <input type="range" id="setting-resolution" min="72" max="300" value="150" class="w-full" />
          <span id="resolution-value" class="text-xs text-gray-500">150 DPI</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2">
          <input type="checkbox" id="setting-grayscale" class="rounded" />
          <span class="text-sm text-gray-700 dark:text-gray-300">Grayscale</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" id="setting-border" class="rounded" />
          <span class="text-sm text-gray-700 dark:text-gray-300">Add Border</span>
        </label>
        <button id="reset-settings-btn" class="ml-auto px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
          Reset Settings
        </button>
      </div>
    `;
    body.appendChild(options);
  }

  // Preview canvas
  if (!getScannerElement('preview-canvas-wrapper')) {
    const previewWrapper = document.createElement('div');
    previewWrapper.id = 'preview-canvas-wrapper';
    previewWrapper.className = 'hidden rounded-lg border border-gray-200 dark:border-gray-700 p-4';
    previewWrapper.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Preview</h3>
      <canvas id="preview-canvas" class="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded"></canvas>
    `;
    body.appendChild(previewWrapper);
  }

  // Action row
  let actionRow = getScannerElement('scanner-action-row');
  if (!actionRow) {
    actionRow = document.createElement('div');
    actionRow.id = 'scanner-action-row';
    actionRow.className = 'flex justify-center';
    body.appendChild(actionRow);
  }

  const processBtn = panelRoot.querySelector('button');
  if (processBtn && processBtn.id !== 'scanner-process-btn') {
    processBtn.id = 'scanner-process-btn';
  }

  if (processBtn && actionRow && processBtn.parentElement !== actionRow) {
    actionRow.appendChild(processBtn);
  }
}

function renderFiles(): void {
  const fileArea = getScannerElement('scanner-file-display-area');
  const optionsPanel = getScannerElement('scanner-options-panel');
  const previewWrapper = getScannerElement('preview-canvas-wrapper');
  const processBtn = getScannerElement<HTMLButtonElement>('scanner-process-btn');

  if (!fileArea) return;

  if (previewWrapper) previewWrapper.classList.add('hidden');

  if (state.files.length === 0) {
    fileArea.innerHTML =
      '<p class="text-sm text-gray-500 dark:text-gray-400">Upload a PDF file to apply scanner effect.</p>';
    if (processBtn) processBtn.disabled = true;
    return;
  }

  if (processBtn) processBtn.disabled = false;

  fileArea.innerHTML = state.files
    .map(
      (file, index) => `
      <div class="flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm">
        <div class="flex items-center gap-3 min-w-0">
          <i data-lucide="file-text" class="w-5 h-5 text-indigo-400"></i>
          <span class="text-gray-200 truncate">${file.name}</span>
          <span class="text-gray-400">(${(file.size / 1024).toFixed(1)} KB)</span>
        </div>
        <button class="scanner-remove-file text-gray-400 hover:text-red-400" data-index="${index}" type="button">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    `
    )
    .join('');

  createIcons({ icons });

  fileArea.querySelectorAll('.scanner-remove-file').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '-1', 10);
      if (index >= 0) {
        state.files = [];
        scannerState.pdfDoc = null;
        scannerState.cachedBaselineData = null;
        renderFiles();
      }
    });
  });

  if (optionsPanel) {
    optionsPanel.classList.remove('hidden');
  }
}

// ============ Processing ============

async function processScannerEffect(): Promise<void> {
  if (state.files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  const settings = getSettings();
  showLoader('Applying scanner effect...');

  try {
    const file = state.files[0];
    const pdfBytes = (await readFileAsArrayBuffer(file)) as ArrayBuffer;
    const doc = await getPDFDocument({ data: pdfBytes }).promise;
    const newPdfDoc = await PDFDocument.create();
    const dpiScale = settings.resolution / 72;

    for (let i = 1; i <= doc.numPages; i++) {
      showLoader(`Processing page ${i} of ${doc.numPages}...`);

      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: dpiScale });
      const renderCanvas = document.createElement('canvas');
      const renderCtx = renderCanvas.getContext('2d')!;
      renderCanvas.width = viewport.width;
      renderCanvas.height = viewport.height;

      await page.render({
        canvasContext: renderCtx,
        viewport,
        canvas: renderCanvas,
      }).promise;

      const baseData = renderCtx.getImageData(0, 0, renderCanvas.width, renderCanvas.height);
      const baselineCopy = new ImageData(
        new Uint8ClampedArray(baseData.data),
        baseData.width,
        baseData.height
      );

      const outputCanvas = document.createElement('canvas');
      applyEffects(baselineCopy, outputCanvas, settings);

      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        outputCanvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (jpegBlob) {
        const jpegBytes = await jpegBlob.arrayBuffer();
        const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
        const newPage = newPdfDoc.addPage([outputCanvas.width, outputCanvas.height]);
        newPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: outputCanvas.width,
          height: outputCanvas.height,
        });
      }
    }

    const resultBytes = await newPdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' }),
      getScannerOutputFileName(file.name)
    );

    showAlert('Success', 'Scanner effect applied successfully!', 'success');
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Failed to apply scanner effect. The file might be corrupted.');
  } finally {
    hideLoader();
  }
}

// ============ Settings Listeners ============

const sliderDefaults: { id: string; display: string; suffix: string; defaultValue: string }[] = [
  { id: 'setting-rotate', display: 'rotate-value', suffix: '°', defaultValue: '0' },
  {
    id: 'setting-rotate-variance',
    display: 'rotate-variance-value',
    suffix: '°',
    defaultValue: '0',
  },
  { id: 'setting-brightness', display: 'brightness-value', suffix: '', defaultValue: '0' },
  { id: 'setting-contrast', display: 'contrast-value', suffix: '', defaultValue: '0' },
  { id: 'setting-blur', display: 'blur-value', suffix: 'px', defaultValue: '0' },
  { id: 'setting-noise', display: 'noise-value', suffix: '', defaultValue: '10' },
  { id: 'setting-yellowish', display: 'yellowish-value', suffix: '', defaultValue: '0' },
  { id: 'setting-resolution', display: 'resolution-value', suffix: ' DPI', defaultValue: '150' },
];

function resetSettings(): void {
  sliderDefaults.forEach(({ id, display, suffix, defaultValue }) => {
    const slider = getScannerElement<HTMLInputElement>(id);
    const label = getScannerElement(display);
    if (slider) slider.value = defaultValue;
    if (label) label.textContent = defaultValue + suffix;
  });

  const grayscale = getScannerElement<HTMLInputElement>('setting-grayscale');
  const border = getScannerElement<HTMLInputElement>('setting-border');
  if (grayscale) grayscale.checked = false;
  if (border) border.checked = false;

  updatePreview();
}

function setupSettingsListeners(): void {
  sliderDefaults.forEach(({ id, display, suffix }) => {
    const slider = getScannerElement<HTMLInputElement>(id);
    const label = getScannerElement(display);
    if (slider && label) {
      slider.addEventListener('input', () => {
        label.textContent = slider.value + suffix;
        if (id !== 'setting-resolution') {
          updatePreview();
        }
      });
    }
  });

  const toggleIds = ['setting-grayscale', 'setting-border'];
  toggleIds.forEach((id) => {
    const toggle = getScannerElement<HTMLInputElement>(id);
    if (toggle) {
      toggle.addEventListener('change', updatePreview);
    }
  });

  const resetBtn = getScannerElement('reset-settings-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }
}

// ============ File Handling ============

async function loadPdfForPreview(file: File): Promise<void> {
  showLoader('Loading preview...');
  try {
    const buffer = await readFileAsArrayBuffer(file);
    scannerState.pdfDoc = await getPDFDocument({ data: buffer }).promise;
    await renderPreview();

    const previewWrapper = getScannerElement('preview-canvas-wrapper');
    if (previewWrapper) {
      previewWrapper.classList.remove('hidden');
    }
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Failed to load PDF for preview.');
  } finally {
    hideLoader();
  }
}

// ============ Main Setup ============

export function setupScannerEffectPage(): void {
  const container = document.getElementById('scanner-effect-container');
  if (container) {
    container.classList.remove('hidden');
  }

  ensureScannerUi();

  if (state.files.length > 0) {
    renderFiles();
    if (state.files.length > 0) {
      loadPdfForPreview(state.files[0]);
    }
  }

  if (isScannerEffectSetup) return;
  isScannerEffectSetup = true;

  const backBtn = getScannerElement('back-to-tools');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const fileInput = getScannerElement<HTMLInputElement>('file-input');
  const dropZone = getScannerElement('drop-zone');
  const processBtn = getScannerElement<HTMLButtonElement>('scanner-process-btn');

  const handleFileSelect = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const validFiles = Array.from(newFiles).filter((file) => file.type === 'application/pdf');

    if (validFiles.length === 0) {
      showAlert('Invalid File', 'Please upload a PDF file.');
      return;
    }

    state.files = validFiles;
    scannerState.pdfDoc = null;
    scannerState.cachedBaselineData = null;
    renderFiles();
    await loadPdfForPreview(validFiles[0]);
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

  if (processBtn) {
    processBtn.addEventListener('click', () => {
      void processScannerEffect();
    });
  }

  setupSettingsListeners();
  createIcons({ icons });
}
