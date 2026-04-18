import { createIcons, icons } from 'lucide';
import { showAlert, showLoader, hideLoader } from '../components/ui';
import {
  downloadFile,
  hexToRgb,
  formatBytes,
  getPDFDocument,
  readFileAsArrayBuffer,
} from '../utils/helpers';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { getFiles } from '../state';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface TextColorState {
  file: File | null;
  pdfDoc: PDFLibDocument | null;
}

const pageState: TextColorState = { file: null, pdfDoc: null };

// Main function to change text color - exported for use in App.tsx
export async function changeTextColorOfPdf(colorHex: string): Promise<boolean> {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return false;
  }

  showLoader('Changing text color...');

  try {
    const file = files[0];
    const { r, g, b } = hexToRgb(colorHex);
    const darknessThreshold = 120;

    const newPdfDoc = await PDFLibDocument.create();

    // Load PDF with pdfjs-dist using ArrayBuffer directly
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Processing page ${i} of ${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d')!;
      await page.render({ canvasContext: context, viewport }).promise;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Change dark pixels (text) to the selected color
      for (let j = 0; j < data.length; j += 4) {
        if (
          data[j] < darknessThreshold &&
          data[j + 1] < darknessThreshold &&
          data[j + 2] < darknessThreshold
        ) {
          data[j] = r * 255;
          data[j + 1] = g * 255;
          data[j + 2] = b * 255;
        }
      }
      context.putImageData(imageData, 0, 0);

      const pngImageBytes = await new Promise<Uint8Array>((resolve) =>
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
          reader.readAsArrayBuffer(blob!);
        }, 'image/png')
      );

      const pngImage = await newPdfDoc.embedPng(pngImageBytes);
      const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
      newPage.drawImage(pngImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    const newPdfBytes = await newPdfDoc.save();
    const originalName = file.name.replace(/\.pdf$/i, '');
    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_text-color.pdf`
    );

    hideLoader();
    showAlert('Success', 'Text color changed successfully!', 'success');
    return true;
  } catch (e: any) {
    console.error(e);
    hideLoader();
    showAlert('Error', e.message || 'Could not change text color.');
    return false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

function initializePage() {
  createIcons({ icons });
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const backBtn = document.getElementById('back-to-tools');
  const processBtn = document.getElementById('process-btn');

  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
    fileInput.addEventListener('click', () => {
      fileInput.value = '';
    });
  }
  if (dropZone) {
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
      if (e.dataTransfer?.files.length) handleFiles(e.dataTransfer.files);
    });
  }
  if (backBtn)
    backBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  if (processBtn) processBtn.addEventListener('click', changeTextColor);
}

function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) handleFiles(input.files);
}

async function handleFiles(files: FileList) {
  const file = files[0];
  if (!file || file.type !== 'application/pdf') {
    showAlert('Invalid File', 'Please upload a valid PDF file.');
    return;
  }
  showLoader('Loading PDF...');
  try {
    const arrayBuffer = await file.arrayBuffer();
    pageState.pdfDoc = await PDFLibDocument.load(arrayBuffer);
    pageState.file = file;
    updateFileDisplay();
    document.getElementById('options-panel')?.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    showAlert('Error', 'Failed to load PDF file.');
  } finally {
    hideLoader();
  }
}

function updateFileDisplay() {
  const fileDisplayArea = document.getElementById('file-display-area');
  if (!fileDisplayArea || !pageState.file || !pageState.pdfDoc) return;
  fileDisplayArea.innerHTML = '';
  const fileDiv = document.createElement('div');
  fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg';
  const infoContainer = document.createElement('div');
  infoContainer.className = 'flex flex-col flex-1 min-w-0';
  const nameSpan = document.createElement('div');
  nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
  nameSpan.textContent = pageState.file.name;
  const metaSpan = document.createElement('div');
  metaSpan.className = 'text-xs text-gray-400';
  metaSpan.textContent = `${formatBytes(pageState.file.size)} • ${pageState.pdfDoc.getPageCount()} pages`;
  infoContainer.append(nameSpan, metaSpan);
  const removeBtn = document.createElement('button');
  removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
  removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
  removeBtn.onclick = resetState;
  fileDiv.append(infoContainer, removeBtn);
  fileDisplayArea.appendChild(fileDiv);
  createIcons({ icons });
}

function resetState() {
  pageState.file = null;
  pageState.pdfDoc = null;
  const fileDisplayArea = document.getElementById('file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';
  document.getElementById('options-panel')?.classList.add('hidden');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}

async function changeTextColor() {
  if (!pageState.pdfDoc || !pageState.file) {
    showAlert('Error', 'Please upload a PDF file first.');
    return;
  }

  const colorHex = (document.getElementById('text-color-input') as HTMLInputElement).value;
  const success = await changeTextColorOfPdf(colorHex);

  if (success) {
    resetState();
  }
}
