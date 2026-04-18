import { showAlert } from '../components/ui';
import { downloadFile, formatBytes, readFileAsArrayBuffer } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import JSZip from 'jszip';
import { LinearizePdfState } from '@/types';
import { PDFDocument } from 'pdf-lib';

const pageState: LinearizePdfState = {
  files: [],
};

function resetState() {
  pageState.files = [];

  const fileDisplayArea = document.getElementById('file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const fileControls = document.getElementById('file-controls');
  if (fileControls) fileControls.classList.add('hidden');

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}

async function updateUI() {
  const fileDisplayArea = document.getElementById('file-display-area');
  const toolOptions = document.getElementById('tool-options');
  const fileControls = document.getElementById('file-controls');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (pageState.files.length > 0) {
    pageState.files.forEach((file, index) => {
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
        pageState.files.splice(index, 1);
        updateUI();
      };

      fileDiv.append(infoContainer, removeBtn);
      fileDisplayArea.appendChild(fileDiv);
    });

    createIcons({ icons });

    if (toolOptions) toolOptions.classList.remove('hidden');
    if (fileControls) fileControls.classList.remove('hidden');
  } else {
    if (toolOptions) toolOptions.classList.add('hidden');
    if (fileControls) fileControls.classList.add('hidden');
  }
}

function handleFileSelect(files: FileList | null) {
  if (files && files.length > 0) {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (pdfFiles.length > 0) {
      pageState.files.push(...pdfFiles);
      updateUI();
    }
  }
}

export async function linearizePdf(files?: File[]) {
  const pdfFiles = files
    ? files.filter((file: File) => file.type === 'application/pdf')
    : pageState.files.filter((file: File) => file.type === 'application/pdf');
  if (!pdfFiles || pdfFiles.length === 0) {
    showAlert('No PDF Files', 'Please upload at least one PDF file.');
    return;
  }

  const loaderModal = document.getElementById('loader-modal');
  const loaderText = document.getElementById('loader-text');
  if (loaderModal) loaderModal.classList.remove('hidden');
  if (loaderText) loaderText.textContent = 'Optimizing PDFs for web view...';

  const zip = new JSZip();
  let successCount = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];

      if (loaderText)
        loaderText.textContent = `Optimizing ${file.name} (${i + 1}/${pdfFiles.length})...`;

      try {
        const fileBuffer = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(fileBuffer as ArrayBuffer);

        // Save with optimization options that simulate linearization benefits
        const pdfBytes = await pdfDoc.save({
          useObjectStreams: false, // Disable object streams for faster access
          addDefaultPage: false,
          objectsPerTick: 50, // Process in smaller chunks
        });

        zip.file(`optimized-${file.name}`, pdfBytes, { binary: true });
        successCount++;
      } catch (fileError: any) {
        errorCount++;
        console.error(`Failed to optimize ${file.name}:`, fileError);
      }
    }

    if (successCount === 0) {
      throw new Error('No PDF files could be optimized.');
    }

    if (loaderText) loaderText.textContent = 'Generating ZIP file...';
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, 'optimized-pdfs.zip');

    let alertMessage = `${successCount} PDF(s) optimized successfully.`;
    if (errorCount > 0) {
      alertMessage += ` ${errorCount} file(s) failed.`;
    }
    showAlert('Processing Complete', alertMessage, 'success', () => {
      resetState();
    });
  } catch (error: any) {
    console.error('Optimization process error:', error);
    showAlert('Optimization Failed', `An error occurred: ${error.message || 'Unknown error'}.`);
  } finally {
    if (loaderModal) loaderModal.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById('process-btn');
  const addMoreBtn = document.getElementById('add-more-btn');
  const clearFilesBtn = document.getElementById('clear-files-btn');
  const backBtn = document.getElementById('back-to-tools');

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
      handleFileSelect(e.dataTransfer?.files);
    });

    fileInput.addEventListener('click', function () {
      fileInput.value = '';
    });
  }

  if (processBtn) {
    processBtn.addEventListener('click', linearizePdf);
  }

  if (addMoreBtn) {
    addMoreBtn.addEventListener('click', function () {
      fileInput.value = '';
      fileInput.click();
    });
  }

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener('click', function () {
      resetState();
    });
  }
});
