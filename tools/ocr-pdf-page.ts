import { tesseractLanguages } from '../config/tesseract-languages';
import { showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import { OcrState } from '@/types';
import { performOcr } from '../utils/ocr';
import { state } from '../state';

class UnsupportedOcrLanguageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedOcrLanguageError';
  }
}

function resolveConfiguredTesseractAvailableLanguages(): string[] | null {
  const raw =
    process.env.NEXT_PUBLIC_TESSERACT_AVAILABLE_LANGUAGES ||
    process.env.VITE_TESSERACT_AVAILABLE_LANGUAGES;

  if (!raw) {
    return null;
  }

  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : null;
}

function getAvailableTesseractLanguageEntries(): [string, string][] {
  const configured = resolveConfiguredTesseractAvailableLanguages();
  const allowed = configured ? new Set(configured) : null;

  return Object.entries(tesseractLanguages).filter(([code]) => !allowed || allowed.has(code));
}

const pageState: OcrState = {
  file: null,
  searchablePdfBytes: null,
};

let isOcrToolSetup = false;

function getOcrElement(id: string): HTMLElement | null {
  const direct = document.getElementById(id);
  if (direct) return direct;

  const container = document.getElementById('ocr-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as HTMLElement | null;
}

const whitelistPresets: Record<string, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-\'"',
  'numbers-currency': '0123456789$€£¥.,- ',
  'letters-only': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
  'numbers-only': '0123456789',
  invoice: '0123456789$.,/-#: ',
  forms: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()-_/@#:',
};

function updateProgress(status: string, progress: number) {
  const progressBar = document.getElementById('progress-bar');
  const progressStatus = document.getElementById('progress-status');
  const progressLog = document.getElementById('progress-log');

  if (!progressBar || !progressStatus || !progressLog) return;

  progressStatus.textContent = status;
  progressBar.style.width = `${Math.min(100, progress * 100)}%`;

  const logMessage = `Status: ${status}`;
  progressLog.textContent += logMessage + '\n';
  progressLog.scrollTop = progressLog.scrollHeight;
}

function resetState() {
  pageState.file = null;
  pageState.searchablePdfBytes = null;

  const fileDisplayArea = getOcrElement('ocr-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = getOcrElement('ocr-tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const ocrProgress = getOcrElement('ocr-progress');
  if (ocrProgress) ocrProgress.classList.add('hidden');

  const ocrResults = getOcrElement('ocr-results');
  if (ocrResults) ocrResults.classList.add('hidden');

  const progressLog = getOcrElement('progress-log');
  if (progressLog) progressLog.textContent = '';

  const progressBar = getOcrElement('progress-bar');
  if (progressBar) progressBar.style.width = '0%';

  const fileInput = getOcrElement('ocr-file-input') as HTMLInputElement | null;
  if (fileInput) fileInput.value = '';

  // Reset selected languages
  const langCheckboxes = document.querySelectorAll(
    '.lang-checkbox'
  ) as NodeListOf<HTMLInputElement>;
  langCheckboxes.forEach(function (cb) {
    cb.checked = false;
  });

  const selectedLangsDisplay = getOcrElement('selected-langs-display');
  if (selectedLangsDisplay) selectedLangsDisplay.textContent = 'None';

  const processBtn =
    (getOcrElement('ocr-process-btn') as HTMLButtonElement | null) ||
    (getOcrElement('process-btn') as HTMLButtonElement | null);
  if (processBtn) processBtn.disabled = true;
}

function updateLanguageAvailabilityNotice() {
  const notice = document.getElementById('lang-availability-note');
  if (!notice) return;

  const configuredLanguages = resolveConfiguredTesseractAvailableLanguages();
  if (!configuredLanguages) {
    notice.classList.add('hidden');
    notice.textContent = '';
    return;
  }

  const availableEntries = getAvailableTesseractLanguageEntries();
  if (availableEntries.length === 0) {
    notice.classList.remove('hidden');
    notice.textContent =
      'This deployment does not expose any valid OCR languages. Rebuild it with VITE_TESSERACT_AVAILABLE_LANGUAGES set to valid Tesseract codes.';
    return;
  }

  const availableNames = availableEntries.map(([, name]) => name).join(', ');
  notice.classList.remove('hidden');
  notice.textContent = `This deployment bundles OCR for: ${availableNames}.`;
}

function ensureFallbackResultsUi() {
  const container = document.getElementById('ocr-container');
  if (!container) return;

  const panelRoot =
    (container.querySelector('.bg-white') as HTMLElement | null) ||
    (container.firstElementChild as HTMLElement | null) ||
    container;

  let results = getOcrElement('ocr-results') as HTMLElement | null;
  if (!results) {
    results = document.createElement('div');
    results.id = 'ocr-results';
    results.className = 'hidden mt-6';
    panelRoot.appendChild(results);
  }

  const hasTextOutput = Boolean(getOcrElement('ocr-text-output'));
  if (!hasTextOutput) {
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900 dark:text-white mb-2';
    title.textContent = 'Extracted Text';

    const helper = document.createElement('p');
    helper.className = 'text-sm text-gray-600 dark:text-gray-400 mb-3';
    helper.textContent = 'Review and copy the OCR output below.';

    const textarea = document.createElement('textarea');
    textarea.id = 'ocr-text-output';
    textarea.readOnly = true;
    textarea.rows = 12;
    textarea.className =
      'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white';

    const actions = document.createElement('div');
    actions.className = 'mt-3 flex flex-wrap gap-3';

    const copyBtn = document.createElement('button');
    copyBtn.id = 'copy-text-btn';
    copyBtn.type = 'button';
    copyBtn.className =
      'px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow hover:bg-gray-800 transition-all';
    copyBtn.textContent = 'Copy Text';

    const downloadTxtBtn = document.createElement('button');
    downloadTxtBtn.id = 'download-txt-btn';
    downloadTxtBtn.type = 'button';
    downloadTxtBtn.className =
      'px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-gray-700 transition-all';
    downloadTxtBtn.textContent = 'Download TXT';

    actions.append(copyBtn, downloadTxtBtn);

    results.append(title, helper, textarea, actions);
  }
}

function ensureFallbackProgressUi() {
  const container = document.getElementById('ocr-container');
  if (!container) return;

  const panelRoot =
    (container.querySelector('.bg-white') as HTMLElement | null) ||
    (container.firstElementChild as HTMLElement | null) ||
    container;

  if (!getOcrElement('ocr-progress')) {
    const progressWrap = document.createElement('div');
    progressWrap.id = 'ocr-progress';
    progressWrap.className = 'hidden mt-6';

    const status = document.createElement('p');
    status.id = 'progress-status';
    status.className = 'text-sm text-gray-700 dark:text-gray-300 mb-2';
    status.textContent = 'Preparing OCR...';

    const barTrack = document.createElement('div');
    barTrack.className = 'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden';

    const bar = document.createElement('div');
    bar.id = 'progress-bar';
    bar.className = 'h-full bg-primary transition-all duration-200';
    bar.style.width = '0%';

    const log = document.createElement('pre');
    log.id = 'progress-log';
    log.className =
      'mt-3 text-xs bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-32 overflow-auto text-gray-700 dark:text-gray-300';

    barTrack.appendChild(bar);
    progressWrap.append(status, barTrack, log);
    panelRoot.appendChild(progressWrap);
  }
}

function setProcessButtonLoading(isLoading: boolean) {
  const processBtn =
    (getOcrElement('ocr-process-btn') as HTMLButtonElement | null) ||
    (getOcrElement('process-btn') as HTMLButtonElement | null);
  if (!processBtn) return;

  const idleLabel = processBtn.dataset.idleLabel || processBtn.textContent || 'Perform OCR';
  processBtn.dataset.idleLabel = idleLabel;
  processBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Processing OCR...' : idleLabel;
}

async function runOCR() {
  setProcessButtonLoading(true);

  const selectedLangs = getSelectedLanguages();

  const scaleEl = document.getElementById('ocr-resolution') as HTMLSelectElement | null;
  const binarizeEl = document.getElementById('ocr-binarize') as HTMLInputElement | null;
  const embedFullFontsEl = document.getElementById(
    'ocr-embed-full-fonts'
  ) as HTMLInputElement | null;
  const whitelistEl = document.getElementById('ocr-whitelist') as HTMLInputElement | null;

  const scale = scaleEl ? parseFloat(scaleEl.value) : 2;
  const binarize = binarizeEl?.checked ?? false;
  const embedFullFonts = embedFullFontsEl?.checked ?? false;
  const whitelist = whitelistEl?.value ?? '';

  if (selectedLangs.length === 0) {
    showAlert('No Languages Selected', 'Please select at least one language for OCR.');
    setProcessButtonLoading(false);
    return;
  }

  const availableCodes = new Set(getAvailableTesseractLanguageEntries().map(([code]) => code));
  const unsupported = selectedLangs.filter((lang) => !availableCodes.has(lang));
  if (unsupported.length > 0) {
    showAlert(
      'OCR Language Not Available',
      `Unsupported OCR language selected: ${unsupported.join(', ')}`
    );
    setProcessButtonLoading(false);
    return;
  }

  if (!pageState.file && state.files.length > 0 && state.files[0]) {
    pageState.file = state.files[0];
  }

  if (!pageState.file) {
    showAlert('No File', 'Please upload a PDF file first.');
    setProcessButtonLoading(false);
    return;
  }

  const langString = selectedLangs.join('+');

  const toolOptions = getOcrElement('ocr-tool-options');
  const ocrProgress = getOcrElement('ocr-progress');

  if (toolOptions) toolOptions.classList.add('hidden');
  if (ocrProgress) ocrProgress.classList.remove('hidden');

  const progressBar = getOcrElement('progress-bar');
  if (progressBar) progressBar.style.width = '0%';
  const progressLog = getOcrElement('progress-log');
  if (progressLog) progressLog.textContent = '';
  updateProgress('Initializing OCR engine...', 0);

  try {
    const arrayBuffer = await pageState.file.arrayBuffer();

    const result = await performOcr(new Uint8Array(arrayBuffer), {
      language: langString,
      resolution: scale,
      binarize,
      whitelist,
      embedFullFonts,
      onProgress: updateProgress,
    });

    pageState.searchablePdfBytes = result.pdfBytes;

    const ocrResults = getOcrElement('ocr-results');
    if (ocrProgress) ocrProgress.classList.add('hidden');
    if (ocrResults) ocrResults.classList.remove('hidden');

    createIcons({ icons });

    const textOutput = getOcrElement('ocr-text-output') as HTMLTextAreaElement | null;
    if (textOutput) textOutput.value = result.fullText.trim();

    // In minimal panel mode (no dedicated result UI), provide immediate output download.
    if (!ocrResults && !textOutput) {
      const safeName = pageState.file?.name?.replace(/\.pdf$/i, '') || 'document';
      downloadFile(
        new Blob([new Uint8Array(result.pdfBytes)], { type: 'application/pdf' }),
        `${safeName}_ocr.pdf`
      );
      showAlert('Success', 'OCR completed. Searchable PDF has been downloaded.', 'success');
    }
    setProcessButtonLoading(false);
  } catch (e) {
    console.error(e);
    if (e instanceof UnsupportedOcrLanguageError) {
      showAlert('OCR Language Not Available', e.message);
    } else {
      showAlert(
        'OCR Error',
        'An error occurred during the OCR process. The worker may have failed to load. Please try again.'
      );
    }
    if (toolOptions) toolOptions.classList.remove('hidden');
    if (ocrProgress) ocrProgress.classList.add('hidden');
    setProcessButtonLoading(false);
  }
}

async function updateUI() {
  const fileDisplayArea = getOcrElement('ocr-file-display-area');
  const toolOptions = getOcrElement('ocr-tool-options');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (pageState.file) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'flex flex-col overflow-hidden';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
    nameSpan.textContent = pageState.file.name;

    const metaSpan = document.createElement('div');
    metaSpan.className = 'text-xs text-gray-400';
    metaSpan.textContent = formatBytes(pageState.file.size);

    infoContainer.append(nameSpan, metaSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
    removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    removeBtn.onclick = function () {
      resetState();
    };

    fileDiv.append(infoContainer, removeBtn);
    fileDisplayArea.appendChild(fileDiv);
    createIcons({ icons });

    if (toolOptions) toolOptions.classList.remove('hidden');
  } else {
    if (toolOptions) toolOptions.classList.add('hidden');
  }
}

async function handleFileSelect(files: FileList | null) {
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      pageState.file = file;
      await updateUI();
    }
  }
}

function getSelectedLanguages(): string[] {
  const checked = Array.from(document.querySelectorAll('.lang-checkbox:checked')).map(
    (cb) => (cb as HTMLInputElement).value
  );
  if (checked.length > 0) {
    return checked;
  }

  const select = document.getElementById('ocr-language') as HTMLSelectElement | null;
  if (select?.value) {
    return [select.value];
  }

  return [];
}

function populateLanguageList() {
  const langList = document.getElementById('lang-list');
  if (!langList) return;

  langList.innerHTML = '';

  const availableEntries = getAvailableTesseractLanguageEntries();
  if (availableEntries.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'text-sm text-yellow-300 p-2';
    emptyState.textContent = 'No OCR languages are available in this deployment.';
    langList.appendChild(emptyState);
    return;
  }

  availableEntries.forEach(function ([code, name]) {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 p-2 rounded-md hover:bg-gray-700 cursor-pointer';
    label.dataset.search = `${name} ${code}`.toLowerCase();

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = code;
    checkbox.className =
      'lang-checkbox w-4 h-4 rounded text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500';

    label.append(checkbox);
    label.append(document.createTextNode(' ' + name));
    langList.appendChild(label);
  });
}

export function setupOcrTool() {
  if (isOcrToolSetup) return;
  isOcrToolSetup = true;

  const container = document.getElementById('ocr-container');
  if (container) {
    container.classList.remove('hidden');
  }

  const fileInput =
    (getOcrElement('ocr-file-input') as HTMLInputElement | null) ||
    (getOcrElement('file-input') as HTMLInputElement | null);
  const dropZone = getOcrElement('ocr-drop-zone') || getOcrElement('drop-zone');
  const processBtn =
    (document.getElementById('ocr-process-btn') as HTMLButtonElement | null) ||
    (document.getElementById('process-btn') as HTMLButtonElement | null);
  const backBtn = getOcrElement('back-to-tools');
  const langSearch = getOcrElement('lang-search') as HTMLInputElement | null;
  const langList = getOcrElement('lang-list');
  const ocrLanguageSelect = getOcrElement('ocr-language') as HTMLSelectElement | null;
  const selectedLangsDisplay = getOcrElement('selected-langs-display');
  const presetSelect = getOcrElement('whitelist-preset') as HTMLSelectElement | null;
  const whitelistInput = getOcrElement('ocr-whitelist') as HTMLInputElement | null;
  const copyBtn = getOcrElement('copy-text-btn');
  const downloadTxtBtn = getOcrElement('download-txt-btn');
  const downloadPdfBtn = getOcrElement('download-searchable-pdf');

  populateLanguageList();
  updateLanguageAvailabilityNotice();
  ensureFallbackProgressUi();
  ensureFallbackResultsUi();

  if (state.files.length > 0 && state.files[0]) {
    pageState.file = state.files[0];
    void updateUI();
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  if (fileInput && dropZone) {
    fileInput.addEventListener('change', function (e) {
      handleFileSelect((e.target as HTMLInputElement).files);
    });

    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropZone.classList.add('bg-gray-700');
    });

    dropZone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dropZone.classList.remove('bg-gray-700');
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('bg-gray-700');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const pdfFiles = Array.from(files).filter(function (f) {
          return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        });
        if (pdfFiles.length > 0) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(pdfFiles[0]);
          handleFileSelect(dataTransfer.files);
        }
      }
    });

    fileInput.addEventListener('click', function () {
      fileInput.value = '';
    });
  }

  // Language search
  if (langSearch && langList) {
    langSearch.addEventListener('input', function () {
      const searchTerm = langSearch.value.toLowerCase();
      langList.querySelectorAll('label').forEach(function (label) {
        (label as HTMLElement).style.display = (label as HTMLElement).dataset.search?.includes(
          searchTerm
        )
          ? ''
          : 'none';
      });
    });

    langList.addEventListener('change', function () {
      const selected = Array.from(langList.querySelectorAll('.lang-checkbox:checked')).map(
        function (cb) {
          return tesseractLanguages[
            (cb as HTMLInputElement).value as keyof typeof tesseractLanguages
          ];
        }
      );

      if (selectedLangsDisplay) {
        selectedLangsDisplay.textContent = selected.length > 0 ? selected.join(', ') : 'None';
      }

      if (processBtn) {
        processBtn.disabled = selected.length === 0;
      }
    });
  }

  if (ocrLanguageSelect && processBtn) {
    const syncButtonState = () => {
      processBtn.disabled = !ocrLanguageSelect.value;
    };
    syncButtonState();
    ocrLanguageSelect.addEventListener('change', syncButtonState);
  }

  // Whitelist preset
  if (presetSelect && whitelistInput) {
    presetSelect.addEventListener('change', function () {
      const preset = presetSelect.value;
      if (preset && preset !== 'custom') {
        whitelistInput.value = whitelistPresets[preset] || '';
        whitelistInput.disabled = true;
      } else {
        whitelistInput.disabled = false;
        if (preset === '') {
          whitelistInput.value = '';
        }
      }
    });
  }

  // Details toggle
  document.querySelectorAll('details').forEach(function (details) {
    details.addEventListener('toggle', function () {
      const icon = details.querySelector('.details-icon') as HTMLElement;
      if (icon) {
        icon.style.transform = (details as HTMLDetailsElement).open
          ? 'rotate(180deg)'
          : 'rotate(0deg)';
      }
    });
  });

  // Process button
  if (processBtn) {
    processBtn.addEventListener('click', runOCR);
  }

  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const textOutput = document.getElementById('ocr-text-output') as HTMLTextAreaElement;
      if (textOutput) {
        navigator.clipboard.writeText(textOutput.value).then(function () {
          copyBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-green-400"></i>';
          createIcons({ icons });

          setTimeout(function () {
            copyBtn.innerHTML =
              '<i data-lucide="clipboard-copy" class="w-4 h-4 text-gray-300"></i>';
            createIcons({ icons });
          }, 2000);
        });
      }
    });
  }

  // Download txt
  if (downloadTxtBtn) {
    downloadTxtBtn.addEventListener('click', function () {
      const textOutput = document.getElementById('ocr-text-output') as HTMLTextAreaElement;
      if (textOutput) {
        const blob = new Blob([textOutput.value], { type: 'text/plain' });
        downloadFile(blob, 'ocr-text.txt');
      }
    });
  }

  // Download PDF
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', function () {
      if (pageState.searchablePdfBytes) {
        downloadFile(
          new Blob([new Uint8Array(pageState.searchablePdfBytes)], {
            type: 'application/pdf',
          }),
          pageState.file?.name || 'document.pdf'
        );
      }
    });
  }
}
