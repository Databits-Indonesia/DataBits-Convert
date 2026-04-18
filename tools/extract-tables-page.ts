import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import JSZip from 'jszip';
import { loadPyMuPDF } from '../utils/pymupdf-loader';
import { state } from '../state';

let file: File | null = null;
let isExtractTablesSetup = false;

type ExportFormat = 'csv' | 'json' | 'markdown';

interface TableData {
  page: number;
  tableIndex: number;
  rows: (string | null)[][];
  markdown: string;
  rowCount: number;
  colCount: number;
}

const updateUI = () => {
  const fileDisplayArea = document.getElementById('file-display-area');
  const optionsPanel = document.getElementById('options-panel');

  if (!fileDisplayArea || !optionsPanel) return;

  fileDisplayArea.innerHTML = '';

  if (file) {
    optionsPanel.classList.remove('hidden');

    const fileDiv = document.createElement('div');
    fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'flex flex-col overflow-hidden';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
    nameSpan.textContent = file.name;

    const metaSpan = document.createElement('div');
    metaSpan.className = 'text-xs text-gray-400';
    metaSpan.textContent = formatBytes(file.size);

    infoContainer.append(nameSpan, metaSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
    removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    removeBtn.onclick = resetState;

    fileDiv.append(infoContainer, removeBtn);
    fileDisplayArea.appendChild(fileDiv);

    createIcons({ icons });
  } else {
    optionsPanel.classList.add('hidden');
  }
};

const resetState = () => {
  file = null;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
  updateUI();
};

function tableToCsv(rows: (string | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = cell ?? '';
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    )
    .join('\n');
}

async function extract() {
  if (!file) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  void extractTables();
}

function getSelectedExportFormat(): ExportFormat {
  const formatSelect = document.getElementById('extract-tables-format') as HTMLSelectElement | null;
  if (formatSelect) {
    const value = formatSelect.value;
    if (value === 'json' || value === 'markdown' || value === 'csv') {
      return value;
    }
  }

  const formatRadios = document.querySelectorAll('input[name="export-format"]');
  let format: ExportFormat = 'csv';

  formatRadios.forEach((radio: Element) => {
    const input = radio as HTMLInputElement;
    if (input.checked) {
      format = input.value === 'json' ? 'json' : input.value === 'markdown' ? 'markdown' : 'csv';
    }
  });

  return format;
}

function getExportPayload(
  table: TableData,
  format: ExportFormat
): {
  content: string;
  ext: string;
  mimeType: string;
} {
  if (format === 'csv') {
    return {
      content: tableToCsv(table.rows),
      ext: 'csv',
      mimeType: 'text/csv',
    };
  }

  if (format === 'json') {
    return {
      content: JSON.stringify(table.rows, null, 2),
      ext: 'json',
      mimeType: 'application/json',
    };
  }

  return {
    content: table.markdown,
    ext: 'md',
    mimeType: 'text/markdown',
  };
}

export async function extractTables() {
  if (state.files.length > 0 && state.files[0]?.type === 'application/pdf') {
    file = state.files[0];
  }

  if (!file) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  const format = getSelectedExportFormat();

  try {
    showLoader('Loading Engine...');
    const pymupdf = await loadPyMuPDF();

    showLoader('Extracting tables...');

    const doc = await pymupdf.open(file);
    const pageCount = doc.pageCount;
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    const allTables: TableData[] = [];

    for (let i = 0; i < pageCount; i++) {
      showLoader(`Scanning page ${i + 1} of ${pageCount}...`);
      const page = doc.getPage(i);
      const tables = page.findTables();

      tables.forEach((table, tableIdx) => {
        allTables.push({
          page: i + 1,
          tableIndex: tableIdx + 1,
          rows: table.rows,
          markdown: table.markdown,
          rowCount: table.rowCount,
          colCount: table.colCount,
        });
      });
    }

    if (allTables.length === 0) {
      showAlert('No Tables Found', 'No tables were detected in this PDF.');
      return;
    }

    if (allTables.length === 1) {
      const table = allTables[0];
      const { content, ext, mimeType } = getExportPayload(table, format);

      const blob = new Blob([content], { type: mimeType });
      downloadFile(blob, `${baseName}_table.${ext}`);
      showAlert('Success', `Extracted 1 table successfully!`, 'success', resetState);
    } else {
      showLoader('Creating ZIP file...');
      const zip = new JSZip();

      allTables.forEach((table, idx) => {
        const filename = `table_${idx + 1}_page${table.page}`;
        const { content, ext } = getExportPayload(table, format);

        zip.file(`${filename}.${ext}`, content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `${baseName}_tables.zip`);
      showAlert(
        'Success',
        `Extracted ${allTables.length} tables successfully!`,
        'success',
        resetState
      );
    }
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Unknown error';

    if (message.toLowerCase().includes('password') || message.toLowerCase().includes('encrypted')) {
      showAlert('Password Required', 'This PDF is password-protected and is not supported yet.');
    } else {
      showAlert('Error', `Failed to extract tables. ${message}`);
    }
  } finally {
    hideLoader();
  }
}

export function setupExtractTablesPage() {
  if (isExtractTablesSetup) return;
  isExtractTablesSetup = true;

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const processBtn =
    document.getElementById('extract-tables-process-btn') ?? document.getElementById('process-btn');
  const backBtn = document.getElementById('back-to-tools');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const handleFileSelect = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const validFile = Array.from(newFiles).find((f) => f.type === 'application/pdf');

    if (!validFile) {
      showAlert('Invalid File', 'Please upload a PDF file.');
      return;
    }

    file = validFile;
    updateUI();
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
      void extractTables();
    });
  }
}
