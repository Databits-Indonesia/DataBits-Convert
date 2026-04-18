import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { state } from '../state';

function resetState() {
  const fileDisplayArea = document.getElementById('reverse-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('reverse-tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');
}

function updateUI() {
  const fileDisplayArea = document.getElementById('reverse-file-display-area');
  const toolOptions = document.getElementById('reverse-tool-options');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (state.files.length > 0) {
    state.files.forEach(function (file, index) {
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
      removeBtn.onclick = function () {
        state.files = state.files.filter(function (_, i) {
          return i !== index;
        });
        updateUI();
      };

      fileDiv.append(infoContainer, removeBtn);
      fileDisplayArea.appendChild(fileDiv);
    });

    createIcons({ icons });

    if (toolOptions) {
      toolOptions.classList.remove('hidden');
      setupButtonListeners();
    }
  } else {
    if (toolOptions) toolOptions.classList.add('hidden');
  }
}

function setupButtonListeners() {
  console.log('[Reverse] setupButtonListeners called');

  const processBtn = document.getElementById('reverse-process-btn');
  console.log('[Reverse] processBtn:', processBtn);

  if (processBtn) {
    console.log('[Reverse] Adding click listener to process button');
    processBtn.onclick = function () {
      console.log('[Reverse] Process button clicked!');
      reversePages();
    };
  } else {
    console.warn('[Reverse] Process button not found!');
  }

  // Also expose on window for debugging
  (window as any).testReversePages = reversePages;
  console.log('[Reverse] Test function available as: window.testReversePages()');
}

async function reversePages() {
  if (state.files.length === 0) {
    showAlert('No Files', 'Please select one or more PDF files.');
    return;
  }

  showLoader('Reversing page order...');

  try {
    const zip = new JSZip();

    for (let j = 0; j < state.files.length; j++) {
      const file = state.files[j];
      showLoader(`Processing ${file.name} (${j + 1}/${state.files.length})...`);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      const newPdf = await PDFLibDocument.create();
      const pageCount = pdfDoc.getPageCount();
      const reversedIndices = Array.from({ length: pageCount }, function (_, i) {
        return pageCount - 1 - i;
      });

      const copiedPages = await newPdf.copyPages(pdfDoc, reversedIndices);
      copiedPages.forEach(function (page) {
        newPdf.addPage(page);
      });

      const newPdfBytes = await newPdf.save();
      const originalName = file.name.replace(/\.pdf$/i, '');
      const fileName = `${originalName}_reversed.pdf`;
      zip.file(fileName, newPdfBytes);
    }

    if (state.files.length === 1) {
      // Single file: download directly
      const file = state.files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });

      const newPdf = await PDFLibDocument.create();
      const pageCount = pdfDoc.getPageCount();
      const reversedIndices = Array.from({ length: pageCount }, function (_, i) {
        return pageCount - 1 - i;
      });

      const copiedPages = await newPdf.copyPages(pdfDoc, reversedIndices);
      copiedPages.forEach(function (page) {
        newPdf.addPage(page);
      });

      const newPdfBytes = await newPdf.save();
      const originalName = file.name.replace(/\.pdf$/i, '');

      downloadFile(
        new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
        `${originalName}_reversed.pdf`
      );
    } else {
      // Multiple files: download as ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'reversed_pdfs.zip');
    }

    showAlert('Success', 'Pages have been reversed successfully!', 'success', function () {
      state.files = [];
      resetState();
    });
  } catch (e) {
    console.error(e);
    showAlert(
      'Error',
      'Could not reverse the PDF pages. Please check that your files are valid PDFs.'
    );
  } finally {
    hideLoader();
  }
}

export async function setupReverseTool() {
  console.log('[Reverse] setupReverseTool called');
  document.getElementById('reverse-tool-container')?.classList.remove('hidden');

  // Load files from state if already present
  if (state.files.length > 0) {
    console.log('[Reverse] Loading files from state');
    updateUI();
  }
}

export { reversePages };
