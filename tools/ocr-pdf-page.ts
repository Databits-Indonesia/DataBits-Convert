import { tesseractLanguages } from '../config/tesseract-languages';
import { showAlert } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import { OcrState } from '@/types';
import { performOcr } from '../utils/ocr';

const pageState: OcrState = {
  file: null,
  searchablePdfBytes: null,
};

const whitelistPresets: Record<string, string> = {
  alphanumeric:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-\'"',
  'numbers-currency': '0123456789$€£¥.,- ',
  'letters-only': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ',
  'numbers-only': '0123456789',
  invoice: '0123456789$.,/-#: ',
  forms:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()-_/@#:',
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

  const fileDisplayArea = document.getElementById('file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const ocrProgress = document.getElementById('ocr-progress');
  if (ocrProgress) ocrProgress.classList.add('hidden');

  const ocrResults = document.getElementById('ocr-results');
  if (ocrResults) ocrResults.classList.add('hidden');

  const progressLog = document.getElementById('progress-log');
  if (progressLog) progressLog.textContent = '';

  const progressBar = document.getElementById('progress-bar');
  if (progressBar) progressBar.style.width = '0%';

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';

  // Reset selected languages
  const langCheckboxes = document.querySelectorAll(
    '.lang-checkbox'
  ) as NodeListOf<HTMLInputElement>;
  langCheckboxes.forEach(function (cb) {
    cb.checked = false;
  });

  const selectedLangsDisplay = document.getElementById(
    'selected-langs-display'
  );
  if (selectedLangsDisplay) selectedLangsDisplay.textContent = 'None';

  const processBtn = document.getElementById(
    'process-btn'
  ) as HTMLButtonElement;
  if (processBtn) processBtn.disabled = true;
}

async function runOCR() {
  const selectedLangs = Array.from(
    document.querySelectorAll('.lang-checkbox:checked')
  ).map(function (cb) {
    return (cb as HTMLInputElement).value;
  });

  const scale = parseFloat(
    (document.getElementById('ocr-resolution') as HTMLSelectElement).value
  );
  const binarize = (document.getElementById('ocr-binarize') as HTMLInputElement)
    .checked;
  const whitelist = (
    document.getElementById('ocr-whitelist') as HTMLInputElement
  ).value;

  if (selectedLangs.length === 0) {
    showAlert(
      'No Languages Selected',
      'Please select at least one language for OCR.'
    );
    return;
  }

  if (!pageState.file) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  const langString = selectedLangs.join('+');

  const toolOptions = document.getElementById('tool-options');
  const ocrProgress = document.getElementById('ocr-progress');

  if (toolOptions) toolOptions.classList.add('hidden');
  if (ocrProgress) ocrProgress.classList.remove('hidden');

  try {
    const arrayBuffer = await pageState.file.arrayBuffer();

    const result = await performOcr(new Uint8Array(arrayBuffer), {
      language: langString,
      resolution: scale,
      binarize,
      whitelist,
      onProgress: updateProgress,
    });

    pageState.searchablePdfBytes = result.pdfBytes;

    const ocrResults = document.getElementById('ocr-results');
    if (ocrProgress) ocrProgress.classList.add('hidden');
    if (ocrResults) ocrResults.classList.remove('hidden');

    createIcons({ icons });

    const textOutput = document.getElementById(
      'ocr-text-output'
    ) as HTMLTextAreaElement;
    if (textOutput) textOutput.value = result.fullText.trim();
  } catch (e) {
    console.error(e);
    showAlert(
      'OCR Error',
      'An error occurred during the OCR process. The worker may have failed to load. Please try again.'
    );
    if (toolOptions) toolOptions.classList.remove('hidden');
    if (ocrProgress) ocrProgress.classList.add('hidden');
  }
}

async function updateUI() {
  const fileDisplayArea = document.getElementById('file-display-area');
  const toolOptions = document.getElementById('tool-options');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (pageState.file) {
    const fileDiv = document.createElement('div');
    fileDiv.className =
      'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

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

function handleFileSelect(files: FileList | null) {
  if (files && files.length > 0) {
    const file = files[0];
    if (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      pageState.file = file;
      updateUI();
    }
  }
}

function populateLanguageList() {
  const langList = document.getElementById('lang-list');
  if (!langList) return;

  langList.innerHTML = '';

  Object.entries(tesseractLanguages).forEach(function ([code, name]) {
    const label = document.createElement('label');
    label.className =
      'flex items-center gap-2 p-2 rounded-md hover:bg-gray-700 cursor-pointer';

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
  const container = document.getElementById('ocr-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>OCR PDF</strong>
          <p>Extract text from scanned PDFs and images using Optical Character Recognition. Supports 100+ languages.</p>
        </div>
      </div>

      <!-- File Upload -->
      <div id="drop-zone" class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
        <i data-lucide="upload-cloud" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
        <p class="text-gray-300 mb-2">Drop PDF file here or click to upload</p>
        <p class="text-sm text-gray-500">Maximum file size: 50MB</p>
        <input type="file" id="file-input" accept=".pdf,application/pdf" class="hidden" />
      </div>

      <!-- File Display -->
      <div id="file-display-area" class="mt-4"></div>

      <!-- OCR Options -->
      <div id="tool-options" class="hidden settings-panel mt-6">
        <h3><i data-lucide="settings"></i> OCR Settings</h3>

        <!-- Language Selection -->
        <div class="form-group">
          <label>Languages</label>
          <div class="bg-gray-700 rounded-lg p-4">
            <input
              type="text"
              id="lang-search"
              placeholder="Search languages..."
              class="w-full mb-3 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div class="text-sm text-gray-400 mb-2">
              Selected: <span id="selected-langs-display" class="text-gray-200">None</span>
            </div>
            <div id="lang-list" class="max-h-48 overflow-y-auto space-y-1"></div>
          </div>
          <small>Select one or more languages for better accuracy</small>
        </div>

        <!-- Resolution -->
        <div class="form-group">
          <label for="ocr-resolution">Resolution</label>
          <select id="ocr-resolution" class="form-select">
            <option value="1">Standard (1x)</option>
            <option value="1.5">High (1.5x)</option>
            <option value="2" selected>Very High (2x)</option>
            <option value="3">Ultra (3x)</option>
          </select>
          <small>Higher resolution improves accuracy but takes longer</small>
        </div>

        <!-- Binarization -->
        <div class="form-group">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="ocr-binarize" class="form-checkbox" />
            <span>Apply Binarization</span>
          </label>
          <small>Convert to black and white for better accuracy on low-quality scans</small>
        </div>

        <!-- Character Whitelist -->
        <details class="form-group">
          <summary class="cursor-pointer font-medium text-gray-200 mb-2 flex items-center gap-2">
            <i data-lucide="chevron-down" class="w-4 h-4 details-icon transition-transform"></i>
            Advanced: Character Whitelist
          </summary>
          <div class="ml-6 space-y-3">
            <div>
              <label for="whitelist-preset">Preset</label>
              <select id="whitelist-preset" class="form-select">
                <option value="">None</option>
                <option value="alphanumeric">Alphanumeric</option>
                <option value="numbers-currency">Numbers & Currency</option>
                <option value="letters-only">Letters Only</option>
                <option value="numbers-only">Numbers Only</option>
                <option value="invoice">Invoice</option>
                <option value="forms">Forms</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label for="ocr-whitelist">Characters</label>
              <input
                type="text"
                id="ocr-whitelist"
                placeholder="Leave empty to allow all characters"
                class="form-input"
              />
              <small>Only recognize these specific characters</small>
            </div>
          </div>
        </details>

        <!-- Process Button -->
        <button id="process-btn" class="btn btn-primary w-full" disabled>
          <i data-lucide="play"></i>
          Start OCR
        </button>
      </div>

      <!-- Progress -->
      <div id="ocr-progress" class="hidden settings-panel mt-6">
        <h3><i data-lucide="loader"></i> Processing...</h3>
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-400 mb-2">
            <span id="progress-status">Initializing...</span>
            <span id="progress-percent">0%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div id="progress-bar" class="bg-indigo-600 h-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
          <pre id="progress-log" class="text-xs text-gray-400 font-mono"></pre>
        </div>
      </div>

      <!-- Results -->
      <div id="ocr-results" class="hidden settings-panel mt-6">
        <h3><i data-lucide="file-text"></i> Extracted Text</h3>
        
        <textarea
          id="ocr-text-output"
          class="w-full h-64 p-4 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm"
          readonly
        ></textarea>

        <div class="flex gap-3 mt-4">
          <button id="copy-text-btn" class="btn btn-secondary flex-1">
            <i data-lucide="clipboard-copy"></i>
            Copy Text
          </button>
          <button id="download-txt-btn" class="btn btn-secondary flex-1">
            <i data-lucide="file-down"></i>
            Download TXT
          </button>
          <button id="download-searchable-pdf" class="btn btn-primary flex-1">
            <i data-lucide="file-check"></i>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  `;

  createIcons({
    icons,
    nameAttr: 'data-lucide',
    attrs: {
      'stroke-width': 2,
      width: 20,
      height: 20,
    },
  });

  populateLanguageList();
  setupEventListeners();
}

function setupEventListeners() {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById(
    'process-btn'
  ) as HTMLButtonElement;
  const langSearch = document.getElementById('lang-search') as HTMLInputElement;
  const langList = document.getElementById('lang-list');
  const selectedLangsDisplay = document.getElementById(
    'selected-langs-display'
  );
  const presetSelect = document.getElementById(
    'whitelist-preset'
  ) as HTMLSelectElement;
  const whitelistInput = document.getElementById(
    'ocr-whitelist'
  ) as HTMLInputElement;
  const copyBtn = document.getElementById('copy-text-btn');
  const downloadTxtBtn = document.getElementById('download-txt-btn');
  const downloadPdfBtn = document.getElementById('download-searchable-pdf');

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
          return (
            f.type === 'application/pdf' ||
            f.name.toLowerCase().endsWith('.pdf')
          );
        });
        if (pdfFiles.length > 0) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(pdfFiles[0]);
          handleFileSelect(dataTransfer.files);
        }
      }
    });

    dropZone.addEventListener('click', function () {
      fileInput.click();
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
        (label as HTMLElement).style.display = label.textContent
          ?.toLowerCase()
          .includes(searchTerm)
          ? ''
          : 'none';
      });
    });

    langList.addEventListener('change', function () {
      const selected = Array.from(
        langList.querySelectorAll('.lang-checkbox:checked')
      ).map(function (cb) {
        return tesseractLanguages[
          (cb as HTMLInputElement).value as keyof typeof tesseractLanguages
        ];
      });

      if (selectedLangsDisplay) {
        selectedLangsDisplay.textContent =
          selected.length > 0 ? selected.join(', ') : 'None';
      }

      if (processBtn) {
        processBtn.disabled = selected.length === 0;
      }
    });
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
      const textOutput = document.getElementById(
        'ocr-text-output'
      ) as HTMLTextAreaElement;
      if (textOutput) {
        navigator.clipboard.writeText(textOutput.value).then(function () {
          copyBtn.innerHTML =
            '<i data-lucide="check" class="w-4 h-4 text-green-400"></i>';
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
      const textOutput = document.getElementById(
        'ocr-text-output'
      ) as HTMLTextAreaElement;
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
          'searchable.pdf'
        );
      }
    });
  }
}
