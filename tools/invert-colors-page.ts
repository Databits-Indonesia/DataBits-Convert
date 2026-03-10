import { createIcons, icons } from 'lucide';
import { showAlert, showLoader, hideLoader } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { invertColors } from '../utils/image-effects';
import * as pdfjsLib from 'pdfjs-dist';
import { getFiles } from '../state';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface InvertColorsState {
  file: File | null;
  pdfDoc: PDFLibDocument | null;
}

const pageState: InvertColorsState = { file: null, pdfDoc: null };

// Main function to invert colors - exported for use in App.tsx
export async function invertColorsOfPdf(): Promise<boolean> {
  const files = getFiles();
  
  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return false;
  }

  showLoader('Inverting PDF colors...');

  try {
    const file = files[0];
    const newPdfDoc = await PDFLibDocument.create();
    
    // Load PDF with pdfjs-dist using ArrayBuffer directly
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfjsDoc = await loadingTask.promise;

    for (let i = 1; i <= pdfjsDoc.numPages; i++) {
      showLoader(`Processing page ${i} of ${pdfjsDoc.numPages}...`);
      const page = await pdfjsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      invertColors(imageData);
      ctx.putImageData(imageData, 0, 0);

      const pngImageBytes = await new Promise<Uint8Array>((resolve) =>
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(new Uint8Array(reader.result as ArrayBuffer));
          reader.readAsArrayBuffer(blob!);
        }, 'image/png')
      );

      const image = await newPdfDoc.embedPng(pngImageBytes);
      const newPage = newPdfDoc.addPage([image.width, image.height]);
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    
    const newPdfBytes = await newPdfDoc.save();
    const originalName = file.name.replace(/\.pdf$/i, '');
    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_inverted.pdf`
    );
    
    hideLoader();
    showAlert('Success', 'Colors inverted successfully!', 'success');
    return true;
  } catch (e: any) {
    console.error(e);
    hideLoader();
    showAlert('Error', e.message || 'Could not invert PDF colors.');
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
  if (processBtn) processBtn.addEventListener('click', handleInvertColors);
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
  fileDiv.className =
    'flex items-center justify-between bg-gray-700 p-3 rounded-lg';
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

async function handleInvertColors() {
  if (!pageState.pdfDoc || !pageState.file) {
    showAlert('Error', 'Please upload a PDF file first.');
    return;
  }
  
  const success = await invertColorsOfPdf();
  
  if (success) {
    resetState();
  }
}
