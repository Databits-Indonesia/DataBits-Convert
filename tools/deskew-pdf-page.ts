import { loadPyMuPDF } from '../utils/pymupdf-loader';
import type { PyMuPDFInstance } from '@/types';
import { batchDecryptIfNeeded } from '../utils/password-prompt';
import { createIcons, icons } from 'lucide';
import { downloadFile } from '../utils/helpers';
import { isWasmAvailable } from '../config/wasm-cdn-config';
import { showWasmRequiredDialog } from '../utils/wasm-provider';
import { state } from '../state';
import { showAlert, showLoader, hideLoader } from '../components/ui';

interface DeskewResult {
  totalPages: number;
  correctedPages: number;
  angles: number[];
  corrected: boolean[];
}

function getDeskewOutputFileName(inputName: string): string {
  if (/\.pdf$/i.test(inputName)) {
    return inputName.replace(/\.pdf$/i, '_deskewed.pdf');
  }
  return `${inputName}_deskewed.pdf`;
}

let selectedFiles: File[] = [];
let pymupdf: PyMuPDFInstance | null = null;
let isDeskewSetup = false;

function getDeskewElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const direct = document.getElementById(id) as T | null;
  if (direct) return direct;

  const container = document.getElementById('deskew-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as T | null;
}

async function initPyMuPDF(): Promise<PyMuPDFInstance> {
  if (!pymupdf) {
    pymupdf = (await loadPyMuPDF()) as PyMuPDFInstance;
  }
  return pymupdf;
}

function setProcessButtonLoading(isLoading: boolean) {
  const processBtn = getDeskewElement<HTMLButtonElement>('deskew-process-btn');
  if (!processBtn) return;

  const idleLabel = processBtn.dataset.idleLabel || processBtn.textContent || 'Deskew PDF';
  processBtn.dataset.idleLabel = idleLabel;
  processBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Deskewing...' : idleLabel;
}

function ensureDeskewUi() {
  const container = document.getElementById('deskew-container');
  if (!container) return;

  const panelRoot =
    (container.querySelector('.bg-white') as HTMLElement | null) ||
    (container.firstElementChild as HTMLElement | null) ||
    container;

  let body = getDeskewElement('deskew-body');
  if (!body) {
    body = document.createElement('div');
    body.id = 'deskew-body';
    body.className = 'space-y-6';
    panelRoot.appendChild(body);
  }

  if (!getDeskewElement('deskew-file-display-area')) {
    const fileArea = document.createElement('div');
    fileArea.id = 'deskew-file-display-area';
    fileArea.className = 'space-y-2';
    body.appendChild(fileArea);
  }

  if (!getDeskewElement('deskew-options')) {
    const options = document.createElement('div');
    options.id = 'deskew-options';
    options.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    options.innerHTML = `
      <div>
        <label for="deskew-threshold" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skew Threshold</label>
        <select id="deskew-threshold" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
          <option value="0.3">Low (0.3)</option>
          <option value="0.5" selected>Medium (0.5)</option>
          <option value="0.7">High (0.7)</option>
        </select>
      </div>
      <div>
        <label for="deskew-dpi" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis DPI</label>
        <select id="deskew-dpi" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
          <option value="100">100 DPI</option>
          <option value="150" selected>150 DPI</option>
          <option value="200">200 DPI</option>
          <option value="300">300 DPI</option>
        </select>
      </div>
    `;
    body.appendChild(options);
  }

  if (!getDeskewElement('deskew-results')) {
    const results = document.createElement('div');
    results.id = 'deskew-results';
    results.className = 'hidden rounded-lg border border-gray-200 dark:border-gray-700 p-4';
    results.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Deskew Results</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Total pages: <span id="deskew-result-total">0</span> | Corrected pages: <span id="deskew-result-corrected">0</span>
      </p>
      <div id="deskew-angles-list" class="space-y-1"></div>
    `;
    body.appendChild(results);
  }

  let actionRow = getDeskewElement('deskew-action-row');
  if (!actionRow) {
    actionRow = document.createElement('div');
    actionRow.id = 'deskew-action-row';
    actionRow.className = 'flex justify-center';
    body.appendChild(actionRow);
  }

  const processBtn = panelRoot.querySelector('button');
  if (processBtn && processBtn.id !== 'deskew-process-btn') {
    processBtn.id = 'deskew-process-btn';
  }

  if (processBtn && actionRow && processBtn.parentElement !== actionRow) {
    actionRow.appendChild(processBtn);
  }
}

function renderFiles() {
  const fileArea = getDeskewElement('deskew-file-display-area');
  const processBtn = getDeskewElement<HTMLButtonElement>('deskew-process-btn');
  const results = getDeskewElement('deskew-results');

  if (!fileArea) return;

  if (results) results.classList.add('hidden');

  if (selectedFiles.length === 0) {
    fileArea.innerHTML =
      '<p class="text-sm text-gray-500 dark:text-gray-400">Upload one or more PDF files to deskew.</p>';
    if (processBtn) processBtn.disabled = true;
    return;
  }

  if (processBtn) processBtn.disabled = false;

  fileArea.innerHTML = selectedFiles
    .map(
      (file, index) => `
      <div class="flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm">
        <div class="flex items-center gap-3 min-w-0">
          <i data-lucide="file-text" class="w-5 h-5 text-indigo-400"></i>
          <span class="text-gray-200 truncate">${file.name}</span>
          <span class="text-gray-400">(${(file.size / 1024).toFixed(1)} KB)</span>
        </div>
        <button class="deskew-remove-file text-gray-400 hover:text-red-400" data-index="${index}" type="button">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
    `
    )
    .join('');

  createIcons({ icons });

  fileArea.querySelectorAll('.deskew-remove-file').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '-1', 10);
      if (index >= 0) {
        selectedFiles.splice(index, 1);
        renderFiles();
      }
    });
  });
}

function displayResults(result: DeskewResult) {
  const results = getDeskewElement('deskew-results');
  const total = getDeskewElement('deskew-result-total');
  const corrected = getDeskewElement('deskew-result-corrected');
  const angles = getDeskewElement('deskew-angles-list');

  if (!results || !total || !corrected || !angles) return;

  results.classList.remove('hidden');
  total.textContent = String(result.totalPages);
  corrected.textContent = String(result.correctedPages);

  angles.innerHTML = result.angles
    .map((angle, idx) => {
      const wasCorrected = result.corrected[idx];
      const color = wasCorrected ? 'text-green-400' : 'text-gray-400';
      const icon = wasCorrected ? 'check' : 'minus';
      return `
        <div class="flex items-center gap-2 text-sm py-1">
          <i data-lucide="${icon}" class="w-4 h-4 ${color}"></i>
          <span class="text-gray-300">Page ${idx + 1}:</span>
          <span class="${color}">${angle.toFixed(2)}°</span>
          ${wasCorrected ? '<span class="text-green-400 text-xs">(corrected)</span>' : ''}
        </div>
      `;
    })
    .join('');

  createIcons({ icons });
}

async function processDeskew() {
  if (selectedFiles.length === 0) {
    showAlert('No Files', 'Please upload at least one PDF file first.');
    return;
  }

  if (!isWasmAvailable('pymupdf')) {
    showWasmRequiredDialog('pymupdf');
    return;
  }

  const threshold = parseFloat(
    getDeskewElement<HTMLSelectElement>('deskew-threshold')?.value || '0.5'
  );
  const dpi = parseInt(getDeskewElement<HTMLSelectElement>('deskew-dpi')?.value || '150', 10);

  setProcessButtonLoading(true);

  try {
    selectedFiles = await batchDecryptIfNeeded(selectedFiles);
    if (selectedFiles.length === 0) {
      showAlert('No Files', 'No files available after decrypt step.');
      renderFiles();
      return;
    }

    showLoader('Initializing PyMuPDF...');
    const pdf = await initPyMuPDF();
    await pdf.load();

    for (const file of selectedFiles) {
      showLoader(`Deskewing ${file.name}...`);
      const { pdf: resultPdf, result } = await pdf.deskewPdf(file, { threshold, dpi });
      displayResults(result);
      downloadFile(resultPdf, getDeskewOutputFileName(file.name));
    }

    hideLoader();
    showAlert(
      'Success',
      `Deskewed ${selectedFiles.length} file(s). ${selectedFiles.length > 1 ? 'Downloads started for all files.' : ''}`,
      'success'
    );
  } catch (error) {
    hideLoader();
    console.error('Deskew error:', error);
    showAlert(
      'Error',
      `Failed to deskew PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
  } finally {
    setProcessButtonLoading(false);
  }
}

export function setupDeskewPage() {
  const container = document.getElementById('deskew-container');
  if (container) {
    container.classList.remove('hidden');
  }

  ensureDeskewUi();

  if (state.files.length > 0) {
    selectedFiles = [...state.files];
  }

  renderFiles();

  if (isDeskewSetup) return;
  isDeskewSetup = true;

  const processBtn = getDeskewElement<HTMLButtonElement>('deskew-process-btn');
  if (processBtn) {
    processBtn.addEventListener('click', () => {
      void processDeskew();
    });
  }

  createIcons({ icons });
}
