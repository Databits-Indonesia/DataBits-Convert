import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { state } from '../state';

function resetState() {
  const fileDisplayArea = document.getElementById('add-blank-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('add-blank-tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const pagePositionInput = document.getElementById('add-blank-page-position') as HTMLInputElement;
  if (pagePositionInput) pagePositionInput.value = '0';

  const pageCountInput = document.getElementById('add-blank-page-count') as HTMLInputElement;
  if (pageCountInput) pageCountInput.value = '1';
}

async function updateUI() {
  console.log('[AddBlankPage] updateUI called, state.files:', state.files.length);

  const fileDisplayArea = document.getElementById('add-blank-file-display-area');
  const toolOptions = document.getElementById('add-blank-tool-options');
  const pagePositionHint = document.getElementById('add-blank-page-position-hint');
  const pagePositionInput = document.getElementById('add-blank-page-position') as HTMLInputElement;

  console.log('[AddBlankPage] Elements found:', {
    fileDisplayArea: !!fileDisplayArea,
    toolOptions: !!toolOptions,
    pagePositionHint: !!pagePositionHint,
    pagePositionInput: !!pagePositionInput,
  });

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
      const pdfDoc = await PDFLibDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });
      const totalPages = pdfDoc.getPageCount();
      hideLoader();

      metaSpan.textContent = `${formatBytes(file.size)} • ${totalPages} pages`;

      if (pagePositionHint) {
        pagePositionHint.textContent = `Enter 0 to insert at the beginning, or ${totalPages} to insert at the end.`;
      }
      if (pagePositionInput) {
        pagePositionInput.max = totalPages.toString();
      }

      if (toolOptions) {
        toolOptions.classList.remove('hidden');
        setupButtonListeners(pdfDoc, totalPages);
      }
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

function setupButtonListeners(pdfDoc: PDFLibDocument, totalPages: number) {
  const processBtn = document.getElementById('add-blank-process-btn');

  if (processBtn) {
    processBtn.onclick = function () {
      addBlankPages(pdfDoc, totalPages);
    };
  }
}

async function addBlankPages(pdfDoc: PDFLibDocument, totalPages: number) {
  if (!pdfDoc || state.files.length === 0) {
    showAlert('Error', 'Please upload a PDF first.');
    return;
  }

  const pagePositionInput = document.getElementById('add-blank-page-position') as HTMLInputElement;
  const pageCountInput = document.getElementById('add-blank-page-count') as HTMLInputElement;

  const position = parseInt(pagePositionInput.value);
  const insertCount = parseInt(pageCountInput.value);

  if (isNaN(position) || position < 0 || position > totalPages) {
    showAlert('Invalid Input', `Please enter a number between 0 and ${totalPages}.`);
    return;
  }

  if (isNaN(insertCount) || insertCount < 1) {
    showAlert('Invalid Input', 'Please enter a valid number of pages (1 or more).');
    return;
  }

  showLoader(`Adding ${insertCount} blank page${insertCount > 1 ? 's' : ''}...`);

  try {
    const newPdf = await PDFLibDocument.create();
    const { width, height } = pdfDoc.getPage(0).getSize();
    const allIndices = Array.from({ length: totalPages }, function (_, i) {
      return i;
    });

    const indicesBefore = allIndices.slice(0, position);
    const indicesAfter = allIndices.slice(position);

    if (indicesBefore.length > 0) {
      const copied = await newPdf.copyPages(pdfDoc, indicesBefore);
      copied.forEach(function (p) {
        newPdf.addPage(p);
      });
    }

    for (let i = 0; i < insertCount; i++) {
      newPdf.addPage([width, height]);
    }

    if (indicesAfter.length > 0) {
      const copied = await newPdf.copyPages(pdfDoc, indicesAfter);
      copied.forEach(function (p) {
        newPdf.addPage(p);
      });
    }

    const newPdfBytes = await newPdf.save();
    const originalName = state.files[0].name.replace(/\.pdf$/i, '');

    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_blank-pages-added.pdf`
    );

    showAlert(
      'Success',
      `Added ${insertCount} blank page${insertCount > 1 ? 's' : ''} successfully!`,
      'success'
    );
    resetState();
  } catch (e) {
    console.error(e);
    showAlert('Error', `Could not add blank page${insertCount > 1 ? 's' : ''}.`);
  } finally {
    hideLoader();
  }
}

export async function setupAddBlankPageTool() {
  console.log('[AddBlankPage] setupAddBlankPageTool called');

  // Show the container
  const container = document.getElementById('add-blank-page-container');
  console.log('[AddBlankPage] Container element:', container);

  if (container) {
    container.classList.remove('hidden');
    console.log('[AddBlankPage] Container shown');
  } else {
    console.error('[AddBlankPage] Container not found!');
  }

  await updateUI();
}
