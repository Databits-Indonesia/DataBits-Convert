import { createIcons, icons } from 'lucide';
import { showAlert, showLoader, hideLoader } from '../components/ui';
import { downloadFile, hexToRgb, formatBytes } from '../utils/helpers';
import { PDFDocument as PDFLibDocument, rgb, StandardFonts } from 'pdf-lib';
import { state } from '../state';

type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
type PageNumberFormat = 'simple' | 'page_x_of_y';

let pdfDoc: PDFLibDocument | null = null;

function resetState() {
  pdfDoc = null;
  const fileDisplayArea = document.getElementById('page-numbers-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';
  document.getElementById('page-numbers-options-panel')?.classList.add('hidden');
}

function updateFileDisplay() {
  const fileDisplayArea = document.getElementById('page-numbers-file-display-area');
  if (!fileDisplayArea || state.files.length === 0 || !pdfDoc) return;

  const file = state.files[0];
  fileDisplayArea.innerHTML = '';
  const fileDiv = document.createElement('div');
  fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg';

  const infoContainer = document.createElement('div');
  infoContainer.className = 'flex flex-col flex-1 min-w-0';

  const nameSpan = document.createElement('div');
  nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
  nameSpan.textContent = file.name;

  const metaSpan = document.createElement('div');
  metaSpan.className = 'text-xs text-gray-400';
  metaSpan.textContent = `${formatBytes(file.size)} • ${pdfDoc.getPageCount()} pages`;

  infoContainer.append(nameSpan, metaSpan);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
  removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
  removeBtn.onclick = () => {
    state.files = [];
    resetState();
  };

  fileDiv.append(infoContainer, removeBtn);
  fileDisplayArea.appendChild(fileDiv);
  createIcons({ icons });
}

async function handleFileUpload() {
  if (state.files.length === 0) {
    showAlert('Invalid File', 'Please upload a valid PDF file.');
    return;
  }

  const file = state.files[0];
  showLoader('Loading PDF...');
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await PDFLibDocument.load(arrayBuffer);

    updateFileDisplay();
    document.getElementById('page-numbers-options-panel')?.classList.remove('hidden');
    setupButtonListeners();
  } catch (error) {
    console.error(error);
    showAlert('Error', 'Failed to load PDF file.');
  } finally {
    hideLoader();
  }
}

function setupButtonListeners() {
  const processBtn = document.getElementById('page-numbers-process-btn');

  if (processBtn) {
    processBtn.onclick = () => addPageNumbers();
  }
}

async function addPageNumbers() {
  if (!pdfDoc || state.files.length === 0) {
    showAlert('Error', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Adding page numbers...');
  try {
    const position = (document.getElementById('page-numbers-position') as HTMLSelectElement)
      .value as PageNumberPosition;
    const fontSize =
      parseInt((document.getElementById('page-numbers-font-size') as HTMLInputElement).value) || 12;
    const format = (document.getElementById('page-numbers-format') as HTMLSelectElement)
      .value as PageNumberFormat;
    const colorHex = (document.getElementById('page-numbers-text-color') as HTMLInputElement).value;
    const textColor = hexToRgb(colorHex);

    // Create a new PDF with page numbers
    const newPdfDoc = await PDFLibDocument.create();
    const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);

      const page = newPdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // Generate page number text
      let text: string;
      if (format === 'page_x_of_y') {
        text = `Page ${i + 1} of ${totalPages}`;
      } else {
        text = `${i + 1}`;
      }

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      // Calculate position
      let x: number, y: number;
      const margin = 20;

      switch (position) {
        case 'top-left':
          x = margin;
          y = height - margin - textHeight;
          break;
        case 'top-center':
          x = (width - textWidth) / 2;
          y = height - margin - textHeight;
          break;
        case 'top-right':
          x = width - margin - textWidth;
          y = height - margin - textHeight;
          break;
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'bottom-center':
          x = (width - textWidth) / 2;
          y = margin;
          break;
        case 'bottom-right':
          x = width - margin - textWidth;
          y = margin;
          break;
        default:
          x = (width - textWidth) / 2;
          y = margin;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255),
      });
    }

    const newPdfBytes = await newPdfDoc.save();
    const originalName = state.files[0].name.replace(/\.pdf$/i, '');

    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_paginated.pdf`
    );

    showAlert('Success', 'Page numbers added successfully!', 'success', () => {
      resetState();
    });
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Could not add page numbers.');
  } finally {
    hideLoader();
  }
}

export async function setupPageNumbersTool() {
  console.log('[PageNumbers] setupPageNumbersTool called');

  const container = document.getElementById('page-numbers-container');
  console.log('[PageNumbers] Container element:', container);

  if (container) {
    container.classList.remove('hidden');
    console.log('[PageNumbers] Container shown');
  } else {
    console.error('[PageNumbers] Container not found!');
  }

  if (state.files.length > 0) {
    console.log('[PageNumbers] Loading PDF from files');
    await handleFileUpload();
  }
}
