import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, formatBytes, parsePageRanges } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { state } from '../state';

function resetState() {
  const fileDisplayArea = document.getElementById('divide-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('divide-tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const splitTypeSelect = document.getElementById('divide-split-type') as HTMLSelectElement;
  if (splitTypeSelect) splitTypeSelect.value = 'vertical';

  const pageRangeInput = document.getElementById('divide-page-range') as HTMLInputElement;
  if (pageRangeInput) pageRangeInput.value = '';
}

async function updateUI() {
  const fileDisplayArea = document.getElementById('divide-file-display-area');
  const toolOptions = document.getElementById('divide-tool-options');

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
  console.log('[Divide] setupButtonListeners called');

  const processBtn = document.getElementById('divide-process-btn');
  console.log('[Divide] processBtn:', processBtn);

  if (processBtn) {
    console.log('[Divide] Adding click listener to process button');
    processBtn.onclick = function () {
      console.log('[Divide] Process button clicked!');
      dividePages(pdfDoc, totalPages);
    };
  } else {
    console.warn('[Divide] Process button not found!');
  }

  (window as any).testDividePages = () => dividePages(pdfDoc, totalPages);
  console.log('[Divide] Test function available as: window.testDividePages()');
}

async function dividePages(pdfDoc: PDFLibDocument, totalPages: number) {
  if (!pdfDoc || state.files.length === 0) {
    showAlert('Error', 'Please upload a PDF first.');
    return;
  }

  const file = state.files[0];
  const pageRangeInput = document.getElementById('divide-page-range') as HTMLInputElement;
  const pageRangeValue = pageRangeInput?.value.trim().toLowerCase() || '';
  const splitTypeSelect = document.getElementById('divide-split-type') as HTMLSelectElement;
  const splitType = splitTypeSelect?.value || 'vertical';

  let pagesToDivide: Set<number>;

  if (pageRangeValue === '' || pageRangeValue === 'all') {
    pagesToDivide = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
  } else {
    const parsedIndices = parsePageRanges(pageRangeValue, totalPages);
    pagesToDivide = new Set(parsedIndices.map((i) => i + 1));

    if (pagesToDivide.size === 0) {
      showAlert('Invalid Range', 'Please enter a valid page range (e.g., 1-5, 8, 11-13).');
      return;
    }
  }

  console.log('[Divide] Pages to divide:', Array.from(pagesToDivide));

  try {
    showLoader('Dividing pages...');
    const newPdfDoc = await PDFLibDocument.create();
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      const originalPage = pages[i];
      const { width, height } = originalPage.getSize();

      showLoader(`Processing page ${pageNum} of ${pages.length}...`);

      if (pagesToDivide.has(pageNum)) {
        const [page1] = await newPdfDoc.copyPages(pdfDoc, [i]);
        const [page2] = await newPdfDoc.copyPages(pdfDoc, [i]);

        switch (splitType) {
          case 'vertical':
            page1.setCropBox(0, 0, width / 2, height);
            page2.setCropBox(width / 2, 0, width / 2, height);
            break;
          case 'horizontal':
            page1.setCropBox(0, height / 2, width, height / 2);
            page2.setCropBox(0, 0, width, height / 2);
            break;
        }

        newPdfDoc.addPage(page1);
        newPdfDoc.addPage(page2);
      } else {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    const newPdfBytes = await newPdfDoc.save();
    const originalName = file.name.replace(/\.pdf$/i, '');

    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_divided.pdf`
    );

    showAlert('Success', 'Pages have been divided successfully!', 'success', function () {
      state.files = [];
      resetState();
    });
  } catch (e) {
    console.error(e);
    showAlert('Error', 'An error occurred while dividing the PDF.');
  } finally {
    hideLoader();
  }
}

export async function setupDivideTool() {
  console.log('[Divide] setupDivideTool called');
  document.getElementById('divide-tool-container')?.classList.remove('hidden');

  // Load PDF from state if available
  if (state.files.length > 0) {
    console.log('[Divide] Loading PDF from files');
    await updateUI();
  }
}
