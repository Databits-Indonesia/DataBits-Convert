import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument } from 'pdf-lib';
import { applyColorAdjustments } from '../utils/image-effects';
import * as pdfjsLib from 'pdfjs-dist';
import { getFiles } from '../state';
import type { AdjustColorsSettings } from '../types/adjust-colors-type';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

let files: File[] = [];
let cachedBaselineData: ImageData | null = null;
let cachedBaselineWidth = 0;
let cachedBaselineHeight = 0;
let pdfjsDoc: pdfjsLib.PDFDocumentProxy | null = null;

// Main function to adjust colors - exported for use in App.tsx
export async function adjustColorsOfPdf(settings: AdjustColorsSettings): Promise<boolean> {
  const stateFiles = getFiles();
  
  if (stateFiles.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return false;
  }

  showLoader('Applying color adjustments...');

  try {
    const file = stateFiles[0];
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const doc = await loadingTask.promise;
    const newPdfDoc = await PDFDocument.create();

    for (let i = 1; i <= doc.numPages; i++) {
      showLoader(`Processing page ${i} of ${doc.numPages}...`);

      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const renderCanvas = document.createElement('canvas');
      const renderCtx = renderCanvas.getContext('2d')!;
      renderCanvas.width = viewport.width;
      renderCanvas.height = viewport.height;

      await page.render({
        canvasContext: renderCtx,
        viewport,
        canvas: renderCanvas,
      }).promise;

      const baseData = renderCtx.getImageData(
        0,
        0,
        renderCanvas.width,
        renderCanvas.height
      );

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = renderCanvas.width;
      outputCanvas.height = renderCanvas.height;
      
      const result = applyColorAdjustments(baseData, settings);
      const ctx = outputCanvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(result, 0, 0);
      }

      const pngBlob = await new Promise<Blob | null>((resolve) =>
        outputCanvas.toBlob(resolve, 'image/png')
      );

      if (pngBlob) {
        const pngBytes = await pngBlob.arrayBuffer();
        const pngImage = await newPdfDoc.embedPng(pngBytes);
        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdfDoc.addPage([
          origViewport.width,
          origViewport.height,
        ]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }
    }

    const resultBytes = await newPdfDoc.save();
    const originalName = file.name.replace(/\.pdf$/i, '');
    downloadFile(
      new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' }),
      `${originalName}_color-adjusted.pdf`
    );
    
    hideLoader();
    showAlert(
      'Success',
      'Color adjustments applied successfully!',
      'success'
    );
    return true;
  } catch (e: any) {
    console.error(e);
    hideLoader();
    showAlert(
      'Error',
      e.message || 'Failed to apply color adjustments. The file might be corrupted.'
    );
    return false;
  }
}

function getSettings(): AdjustColorsSettings {
  return {
    brightness: parseInt(
      (document.getElementById('setting-brightness') as HTMLInputElement)
        ?.value ?? '0'
    ),
    contrast: parseInt(
      (document.getElementById('setting-contrast') as HTMLInputElement)
        ?.value ?? '0'
    ),
    saturation: parseInt(
      (document.getElementById('setting-saturation') as HTMLInputElement)
        ?.value ?? '0'
    ),
    hueShift: parseInt(
      (document.getElementById('setting-hue-shift') as HTMLInputElement)
        ?.value ?? '0'
    ),
    temperature: parseInt(
      (document.getElementById('setting-temperature') as HTMLInputElement)
        ?.value ?? '0'
    ),
    tint: parseInt(
      (document.getElementById('setting-tint') as HTMLInputElement)?.value ??
        '0'
    ),
    gamma: parseFloat(
      (document.getElementById('setting-gamma') as HTMLInputElement)?.value ??
        '1.0'
    ),
    sepia: parseInt(
      (document.getElementById('setting-sepia') as HTMLInputElement)?.value ??
        '0'
    ),
  };
}

const applyEffects = applyColorAdjustments;

function updatePreview(): void {
  if (!cachedBaselineData) return;

  const previewCanvas = document.getElementById(
    'preview-canvas'
  ) as HTMLCanvasElement;
  if (!previewCanvas) return;

  const settings = getSettings();
  const baselineCopy = new ImageData(
    new Uint8ClampedArray(cachedBaselineData.data),
    cachedBaselineWidth,
    cachedBaselineHeight
  );

  const result = applyEffects(baselineCopy, settings);
  
  // Draw to canvas
  const ctx = previewCanvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(result, 0, 0);
  }
}

async function renderPreview(): Promise<void> {
  if (!pdfjsDoc) return;

  const page = await pdfjsDoc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  cachedBaselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  cachedBaselineWidth = canvas.width;
  cachedBaselineHeight = canvas.height;

  updatePreview();
}

const updateUI = () => {
  const fileDisplayArea = document.getElementById('file-display-area');
  const optionsPanel = document.getElementById('options-panel');

  if (!fileDisplayArea || !optionsPanel) return;

  fileDisplayArea.innerHTML = '';

  if (files.length > 0) {
    optionsPanel.classList.remove('hidden');

    files.forEach((file) => {
      const fileDiv = document.createElement('div');
      fileDiv.className =
        'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

      const infoContainer = document.createElement('div');
      infoContainer.className = 'flex flex-col overflow-hidden';

      const nameSpan = document.createElement('div');
      nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
      nameSpan.textContent = file.name;

      const metaSpan = document.createElement('div');
      metaSpan.className = 'text-xs text-gray-400';
      metaSpan.textContent = `${formatBytes(file.size)} • Loading pages...`;

      infoContainer.append(nameSpan, metaSpan);

      const removeBtn = document.createElement('button');
      removeBtn.className =
        'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
      removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
      removeBtn.onclick = () => {
        files = [];
        pdfjsDoc = null;
        cachedBaselineData = null;
        updateUI();
      };

      fileDiv.append(infoContainer, removeBtn);
      fileDisplayArea.appendChild(fileDiv);

      file.arrayBuffer()
        .then((buffer: ArrayBuffer) => {
          const loadingTask = pdfjsLib.getDocument({ data: buffer });
          return loadingTask.promise;
        })
        .then((pdf: pdfjsLib.PDFDocumentProxy) => {
          metaSpan.textContent = `${formatBytes(file.size)} • ${pdf.numPages} page${pdf.numPages !== 1 ? 's' : ''}`;
        })
        .catch(() => {
          metaSpan.textContent = formatBytes(file.size);
        });
    });

    createIcons({ icons });
  } else {
    optionsPanel.classList.add('hidden');
  }
};

const resetState = () => {
  files = [];
  pdfjsDoc = null;
  cachedBaselineData = null;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
  updateUI();
};

async function processAllPages(): Promise<void> {
  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  const settings = getSettings();
  const success = await adjustColorsOfPdf(settings);
  
  if (success) {
    resetState();
  }
}

const sliderDefaults: {
  id: string;
  display: string;
  suffix: string;
  defaultValue: string;
}[] = [
  {
    id: 'setting-brightness',
    display: 'brightness-value',
    suffix: '',
    defaultValue: '0',
  },
  {
    id: 'setting-contrast',
    display: 'contrast-value',
    suffix: '',
    defaultValue: '0',
  },
  {
    id: 'setting-saturation',
    display: 'saturation-value',
    suffix: '',
    defaultValue: '0',
  },
  {
    id: 'setting-hue-shift',
    display: 'hue-shift-value',
    suffix: '°',
    defaultValue: '0',
  },
  {
    id: 'setting-temperature',
    display: 'temperature-value',
    suffix: '',
    defaultValue: '0',
  },
  { id: 'setting-tint', display: 'tint-value', suffix: '', defaultValue: '0' },
  {
    id: 'setting-gamma',
    display: 'gamma-value',
    suffix: '',
    defaultValue: '1.0',
  },
  {
    id: 'setting-sepia',
    display: 'sepia-value',
    suffix: '',
    defaultValue: '0',
  },
];

function resetSettings(): void {
  sliderDefaults.forEach(({ id, display, suffix, defaultValue }) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const label = document.getElementById(display);
    if (slider) slider.value = defaultValue;
    if (label) label.textContent = defaultValue + suffix;
  });

  updatePreview();
}

function setupSettingsListeners(): void {
  sliderDefaults.forEach(({ id, display, suffix }) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const label = document.getElementById(display);
    if (slider && label) {
      slider.addEventListener('input', () => {
        label.textContent = slider.value + suffix;
        updatePreview();
      });
    }
  });

  const resetBtn = document.getElementById('reset-settings-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById('process-btn');
  const backBtn = document.getElementById('back-to-tools');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }

  const handleFileSelect = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const validFiles = Array.from(newFiles).filter(
      (file) => file.type === 'application/pdf'
    );

    if (validFiles.length === 0) {
      showAlert('Invalid File', 'Please upload a PDF file.');
      return;
    }

    files = [validFiles[0]];
    updateUI();

    showLoader('Loading preview...');
    try {
      const buffer = await validFiles[0].arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      pdfjsDoc = await loadingTask.promise;
      await renderPreview();
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to load PDF for preview.');
    } finally {
      hideLoader();
    }
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
    processBtn.addEventListener('click', processAllPages);
  }

  setupSettingsListeners();
});
