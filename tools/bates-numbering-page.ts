import { createIcons, icons } from 'lucide';
import { showAlert, showLoader, hideLoader } from '../components/ui';
import { downloadFile, hexToRgb, formatBytes } from '../utils/helpers';
import { StandardFonts, rgb } from 'pdf-lib';
import { loadPdfWithPasswordPrompt } from '../utils/password-prompt';
import JSZip from 'jszip';
import Sortable from 'sortablejs';
import { Position } from '@/types';
import { loadPdfDocument } from '../utils/load-pdf-document';
import { state } from '../state';

interface FileEntry {
  file: File;
  pageCount: number;
}

interface StylePreset {
  template: string;
  padding: number;
}

const FONT_MAP: Record<string, keyof typeof StandardFonts> = {
  Helvetica: 'Helvetica',
  TimesRoman: 'TimesRoman',
  Courier: 'Courier',
};

const STYLE_PRESETS: Record<string, StylePreset> = {
  'full-6': {
    template: 'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]',
    padding: 6,
  },
  'full-5': {
    template: 'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]',
    padding: 5,
  },
  'full-4': {
    template: 'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]',
    padding: 4,
  },
  'full-3': {
    template: 'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]',
    padding: 3,
  },
  'full-0': {
    template: 'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]',
    padding: 0,
  },
  'no-page-6': { template: 'Exhibit [FILE] Case XYZ [BATES]', padding: 6 },
  'no-page-5': { template: 'Exhibit [FILE] Case XYZ [BATES]', padding: 5 },
  'no-page-4': { template: 'Exhibit [FILE] Case XYZ [BATES]', padding: 4 },
  'no-page-3': { template: 'Exhibit [FILE] Case XYZ [BATES]', padding: 3 },
  'no-page-0': { template: 'Exhibit [FILE] Case XYZ [BATES]', padding: 0 },
  'case-6': { template: 'Case XYZ [BATES]', padding: 6 },
  'case-5': { template: 'Case XYZ [BATES]', padding: 5 },
  'case-4': { template: 'Case XYZ [BATES]', padding: 4 },
  'case-3': { template: 'Case XYZ [BATES]', padding: 3 },
  'case-0': { template: 'Case XYZ [BATES]', padding: 0 },
  'bates-6': { template: '[BATES]', padding: 6 },
  'bates-5': { template: '[BATES]', padding: 5 },
  'bates-4': { template: '[BATES]', padding: 4 },
  'bates-3': { template: '[BATES]', padding: 3 },
  'bates-0': { template: '[BATES]', padding: 0 },
};

let isBatesSetup = false;

// ============ Element Helpers ============

function getBatesElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const direct = document.getElementById(id) as T | null;
  if (direct) return direct;

  const container = document.getElementById('bates-numbering-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as T | null;
}

// ============ Dynamic UI Generation ============

function ensureBatesUi() {
  const container = document.getElementById('bates-numbering-container');
  if (!container) return;

  const panelRoot =
    (container.querySelector('.bg-white') as HTMLElement | null) ||
    (container.firstElementChild as HTMLElement | null) ||
    container;

  let body = getBatesElement('bates-body');
  if (!body) {
    body = document.createElement('div');
    body.id = 'bates-body';
    body.className = 'space-y-6';
    panelRoot.appendChild(body);
  }

  // File list area
  if (!getBatesElement('bates-file-list')) {
    const fileList = document.createElement('div');
    fileList.id = 'bates-file-list';
    fileList.className = 'space-y-2';
    body.appendChild(fileList);
  }

  // Options panel
  if (!getBatesElement('bates-options')) {
    const options = document.createElement('div');
    options.id = 'bates-options';
    options.className = 'hidden space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg';
    options.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style Preset</label>
          <select id="style-preset" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="full-6">Full (6 digits)</option>
            <option value="full-5">Full (5 digits)</option>
            <option value="full-4">Full (4 digits)</option>
            <option value="full-3">Full (3 digits)</option>
            <option value="no-page-6">No Page (6 digits)</option>
            <option value="no-page-5">No Page (5 digits)</option>
            <option value="case-6">Case Only (6 digits)</option>
            <option value="case-5">Case Only (5 digits)</option>
            <option value="bates-6">Bates Only (6 digits)</option>
            <option value="bates-5">Bates Only (5 digits)</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template</label>
          <input type="text" id="bates-template" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" value="Exhibit [FILE] Case XYZ [BATES] Page [PAGE]" readonly>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bates Start Number</label>
          <input type="number" id="bates-start" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" value="1" min="1">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Start Number</label>
          <input type="number" id="file-start" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" value="1" min="1">
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
          <select id="position" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-center">Top Center</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font</label>
          <select id="font-family" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="Helvetica">Helvetica</option>
            <option value="TimesRoman">Times Roman</option>
            <option value="Courier">Courier</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
          <input type="number" id="font-size" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" value="10" min="6" max="72">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
          <input type="color" id="text-color" class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg" value="#000000">
        </div>
      </div>
      <div class="flex justify-center">
        <button id="bates-process-btn" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
          Apply Bates Numbers
        </button>
      </div>
    `;
    body.appendChild(options);
  }

  // Preview area
  if (!getBatesElement('bates-preview')) {
    const preview = document.createElement('div');
    preview.id = 'bates-preview';
    preview.className = 'mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg';
    preview.innerHTML = `
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h3>
      <pre id="bates-preview-content" class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono"></pre>
    `;
    body.appendChild(preview);
  }
}

// ============ State Management ============

function resetState() {
  state.files = [];

  const fileListEl = getBatesElement('bates-file-list');
  if (fileListEl) fileListEl.innerHTML = '';

  const optionsPanel = getBatesElement('bates-options');
  if (optionsPanel) optionsPanel.classList.add('hidden');
}

// ============ File Handling ============

async function handleFiles(fileList: FileList) {
  showLoader('Loading PDFs...');
  try {
    const validFiles = Array.from(fileList).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      showAlert('Invalid File', 'Please upload valid PDF files.');
      return;
    }

    // Load PDF metadata to get page counts
    for (const file of validFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(arrayBuffer);
      state.files = [...state.files, file];
    }

    renderFileList();
    const optionsPanel = getBatesElement('bates-options');
    if (optionsPanel) optionsPanel.classList.remove('hidden');
    updatePreview();
  } catch (error) {
    console.error(error);
    showAlert('Error', 'Failed to load one or more PDF files.');
  } finally {
    hideLoader();
  }
}

function renderFileList() {
  const fileListEl = getBatesElement('bates-file-list');
  if (!fileListEl) return;

  fileListEl.innerHTML = '';
  let totalPages = 0;

  // Calculate total pages from state.files
  const loadPromises = state.files.map(async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch {
      return 0;
    }
  });

  Promise.all(loadPromises).then((pageCounts) => {
    state.files.forEach((file, index) => {
      const pageCount = pageCounts[index];
      totalPages += pageCount;

      const fileDiv = document.createElement('div');
      fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg';

      const leftSection = document.createElement('div');
      leftSection.className = 'flex items-center gap-3 flex-1 min-w-0';

      const dragHandle = document.createElement('i');
      dragHandle.setAttribute('data-lucide', 'grip-vertical');
      dragHandle.className = 'drag-handle w-4 h-4 text-gray-400 cursor-grab flex-shrink-0';

      const infoContainer = document.createElement('div');
      infoContainer.className = 'flex flex-col min-w-0';

      const nameSpan = document.createElement('div');
      nameSpan.className = 'truncate font-medium text-gray-200 text-sm';
      nameSpan.textContent = file.name;

      const metaSpan = document.createElement('div');
      metaSpan.className = 'text-xs text-gray-400';
      metaSpan.textContent = `${formatBytes(file.size)} • ${pageCount} pages`;

      infoContainer.append(nameSpan, metaSpan);
      leftSection.append(dragHandle, infoContainer);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
      removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
      removeBtn.onclick = () => {
        const newFiles = [...state.files];
        newFiles.splice(index, 1);
        state.files = newFiles;
        renderFileList();
        updatePreview();
        if (state.files.length === 0) resetState();
      };

      fileDiv.append(leftSection, removeBtn);
      fileListEl.appendChild(fileDiv);
    });

    createIcons({ icons });

    const summary = document.createElement('div');
    summary.className = 'text-xs text-gray-400 mt-1';
    summary.textContent = `${state.files.length} file${state.files.length !== 1 ? 's' : ''} • ${totalPages} total pages`;
    fileListEl.appendChild(summary);
  });
}

// ============ Preview ============

function formatBatesText(
  template: string,
  batesNum: number,
  pageNum: number,
  fileNum: number,
  fileName: string,
  padding: number
): string {
  const batesStr = padding > 0 ? String(batesNum).padStart(padding, '0') : String(batesNum);
  return template
    .replace(/\[BATES\]/g, batesStr)
    .replace(/\[PAGE\]/g, String(pageNum))
    .replace(/\[FILE\]/g, String(fileNum))
    .replace(/\[FILENAME\]/g, fileName);
}

function getActivePadding(): number {
  const presetValue = getBatesElement<HTMLSelectElement>('style-preset')?.value || 'full-6';
  if (presetValue !== 'custom' && STYLE_PRESETS[presetValue]) {
    return STYLE_PRESETS[presetValue].padding;
  }
  return 6;
}

function updatePreview() {
  const previewEl = getBatesElement('bates-preview-content');
  if (!previewEl) return;

  const template =
    getBatesElement<HTMLInputElement>('bates-template')?.value ||
    'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]';
  const padding = getActivePadding();
  const batesStart = parseInt(getBatesElement<HTMLInputElement>('bates-start')?.value || '1');
  const fileStart = parseInt(getBatesElement<HTMLInputElement>('file-start')?.value || '1');

  const lines: string[] = [];

  if (state.files.length === 0) {
    lines.push(formatBatesText(template, batesStart, 1, fileStart, 'document', padding));
    lines.push(formatBatesText(template, batesStart + 1, 2, fileStart, 'document', padding));
  } else {
    let batesCounter = batesStart;
    let fileCounter = fileStart;
    for (const file of state.files) {
      const name = file.name.replace(/\.pdf$/i, '');
      lines.push(
        `File ${fileCounter}, Page 1: ${formatBatesText(template, batesCounter, 1, fileCounter, name, padding)}`
      );
      batesCounter++;
      fileCounter++;
    }
    lines.push('...');
  }

  previewEl.textContent = lines.join('\n');
}

// ============ Position Calculation ============

function calculatePosition(
  pageWidth: number,
  pageHeight: number,
  xOffset: number,
  yOffset: number,
  textWidth: number,
  fontSize: number,
  position: Position
): { x: number; y: number } {
  const minMargin = 8;
  const maxMargin = 40;
  const marginPct = 0.04;

  const hMargin = Math.max(minMargin, Math.min(maxMargin, pageWidth * marginPct));
  const vMargin = Math.max(minMargin, Math.min(maxMargin, pageHeight * marginPct));
  const safeH = Math.max(hMargin, textWidth / 2 + 3);
  const safeV = Math.max(vMargin, fontSize + 3);

  let x = 0,
    y = 0;

  switch (position) {
    case 'bottom-center':
      x =
        Math.max(safeH, Math.min(pageWidth - safeH - textWidth, (pageWidth - textWidth) / 2)) +
        xOffset;
      y = safeV + yOffset;
      break;
    case 'bottom-left':
      x = safeH + xOffset;
      y = safeV + yOffset;
      break;
    case 'bottom-right':
      x = Math.max(safeH, pageWidth - safeH - textWidth) + xOffset;
      y = safeV + yOffset;
      break;
    case 'top-center':
      x =
        Math.max(safeH, Math.min(pageWidth - safeH - textWidth, (pageWidth - textWidth) / 2)) +
        xOffset;
      y = pageHeight - safeV - fontSize + yOffset;
      break;
    case 'top-left':
      x = safeH + xOffset;
      y = pageHeight - safeV - fontSize + yOffset;
      break;
    case 'top-right':
      x = Math.max(safeH, pageWidth - safeH - textWidth) + xOffset;
      y = pageHeight - safeV - fontSize + yOffset;
      break;
  }

  x = Math.max(xOffset + 3, Math.min(xOffset + pageWidth - textWidth - 3, x));
  y = Math.max(yOffset + 3, Math.min(yOffset + pageHeight - fontSize - 3, y));

  return { x, y };
}

// ============ Processing ============

function getBatesOutputFileName(inputName: string): string {
  if (/\.pdf$/i.test(inputName)) {
    return inputName.replace(/\.pdf$/i, '_bates.pdf');
  }
  return `${inputName}_bates.pdf`;
}

async function applyBatesNumbers() {
  if (state.files.length === 0) {
    showAlert('Error', 'Please upload at least one PDF file.');
    return;
  }

  showLoader('Applying Bates numbers...');
  try {
    const template =
      getBatesElement<HTMLInputElement>('bates-template')?.value ||
      'Exhibit [FILE] Case XYZ [BATES] Page [PAGE]';
    const padding = getActivePadding();
    const batesStart = parseInt(getBatesElement<HTMLInputElement>('bates-start')?.value || '1');
    const fileStart = parseInt(getBatesElement<HTMLInputElement>('file-start')?.value || '1');
    const position = (getBatesElement<HTMLSelectElement>('position')?.value ||
      'bottom-center') as Position;
    const fontKey = getBatesElement<HTMLSelectElement>('font-family')?.value || 'Helvetica';
    const fontSize = parseInt(getBatesElement<HTMLInputElement>('font-size')?.value || '10');
    const colorHex = getBatesElement<HTMLInputElement>('text-color')?.value || '#000000';
    const textColor = hexToRgb(colorHex);

    const fontName = FONT_MAP[fontKey] || 'Helvetica';
    const results: { name: string; bytes: Uint8Array }[] = [];
    let batesCounter = batesStart;
    let fileCounter = fileStart;

    for (const file of state.files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts[fontName as keyof typeof StandardFonts]);
      const pages = pdfDoc.getPages();
      const fileName = file.name.replace(/\.pdf$/i, '');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const bounds = page.getCropBox() || page.getMediaBox();
        const text = formatBatesText(template, batesCounter, i + 1, fileCounter, fileName, padding);
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        const { x, y } = calculatePosition(
          bounds.width,
          bounds.height,
          bounds.x || 0,
          bounds.y || 0,
          textWidth,
          fontSize,
          position
        );

        page.drawText(text, {
          x,
          y,
          font,
          size: fontSize,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });

        batesCounter++;
      }

      fileCounter++;
      const pdfBytes = await pdfDoc.save();
      results.push({
        name: getBatesOutputFileName(file.name),
        bytes: new Uint8Array(pdfBytes),
      });
    }

    if (results.length === 1) {
      downloadFile(
        new Blob([new Uint8Array(results[0].bytes)], { type: 'application/pdf' }),
        results[0].name
      );
    } else {
      const zip = new JSZip();
      for (const result of results) {
        zip.file(result.name, result.bytes);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'bates_numbered.zip');
    }

    showAlert(
      'Success',
      `Bates numbers applied successfully! (${batesStart} through ${batesCounter - 1})`,
      'success'
    );
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Failed to apply Bates numbers.');
  } finally {
    hideLoader();
  }
}

// ============ Main Setup ============

export function setupBatesNumberingPage(): void {
  const container = document.getElementById('bates-numbering-container');
  if (container) {
    container.classList.remove('hidden');
  }

  // Ensure UI elements exist
  ensureBatesUi();

  if (state.files.length > 0) {
    renderFileList();
    const optionsPanel = getBatesElement('bates-options');
    if (optionsPanel) optionsPanel.classList.remove('hidden');
    updatePreview();
  }

  if (isBatesSetup) return;
  isBatesSetup = true;

  const backBtn = getBatesElement('back-to-tools');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const fileInput = getBatesElement<HTMLInputElement>('file-input');
  const dropZone = getBatesElement('drop-zone');
  const processBtn = getBatesElement('bates-process-btn');
  const stylePreset = getBatesElement<HTMLSelectElement>('style-preset');
  const templateInput = getBatesElement<HTMLInputElement>('bates-template');

  const handleFileSelect = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    await handleFiles(newFiles);
  };

  if (fileInput && dropZone) {
    fileInput.addEventListener('change', (e) => {
      handleFileSelect((e.target as HTMLInputElement).files);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-indigo-500');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-indigo-500');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-indigo-500');
      handleFileSelect(e.dataTransfer?.files ?? null);
    });

    fileInput.addEventListener('click', () => {
      fileInput.value = '';
    });
  }

  if (processBtn) {
    processBtn.addEventListener('click', () => {
      void applyBatesNumbers();
    });
  }

  if (stylePreset && templateInput) {
    stylePreset.addEventListener('change', () => {
      const value = stylePreset.value;
      const isCustom = value === 'custom';
      if (!isCustom && STYLE_PRESETS[value]) {
        templateInput.value = STYLE_PRESETS[value].template;
      }
      templateInput.readOnly = !isCustom;
      updatePreview();
    });

    templateInput.addEventListener('input', () => {
      if (stylePreset.value !== 'custom') {
        stylePreset.value = 'custom';
        templateInput.readOnly = false;
      }
      updatePreview();
    });
  }

  // Add input listeners for preview updates
  getBatesElement<HTMLInputElement>('bates-start')?.addEventListener('input', updatePreview);
  getBatesElement<HTMLInputElement>('file-start')?.addEventListener('input', updatePreview);

  createIcons({ icons });
}
