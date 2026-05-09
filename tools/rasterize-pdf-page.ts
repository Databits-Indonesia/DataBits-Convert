import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer, formatBytes, getPDFDocument } from '../utils/helpers';
import { state, getFiles } from '../state';
import { createIcons, icons } from 'lucide';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';
import { showWasmRequiredDialog } from '../utils/wasm-provider';

export interface RasterizeOptions {
  dpi: number;
  format: 'png' | 'jpeg';
  grayscale: boolean;
  quality?: number;
}

// Main function to rasterize PDF - exported for use in App.tsx
export async function rasterizePdf(options: RasterizeOptions): Promise<boolean> {
  const stateFiles = getFiles();

  if (stateFiles.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return false;
  }

  showLoader('Initializing rasterization...');

  try {
    const { dpi, format, grayscale, quality = 95 } = options;
    const scale = dpi / 72; // PDF default is 72 DPI

    const total = stateFiles.length;
    let completed = 0;
    let failed = 0;

    if (total === 1) {
      const file = stateFiles[0];
      showLoader(`Rasterizing ${file.name}...`);

      const rasterizedBlob = await rasterizeSinglePdf(file, scale, format, grayscale, quality);

      const outName = file.name.replace(/\.pdf$/i, '') + '_rasterized.pdf';
      downloadFile(rasterizedBlob, outName);

      hideLoader();
      showAlert('Rasterization Complete', `Successfully rasterized PDF at ${dpi} DPI.`, 'success');
      return true;
    } else {
      // Multiple files - create ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const file of stateFiles) {
        try {
          showLoader(`Rasterizing ${file.name} (${completed + 1}/${total})...`);

          const rasterizedBlob = await rasterizeSinglePdf(file, scale, format, grayscale, quality);

          const outName = file.name.replace(/\.pdf$/i, '') + '_rasterized.pdf';
          zip.file(outName, rasterizedBlob);

          completed++;
        } catch (error) {
          console.error(`Failed to rasterize ${file.name}:`, error);
          failed++;
        }
      }

      showLoader('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      downloadFile(zipBlob, 'rasterized-pdfs.zip');

      hideLoader();

      if (failed === 0) {
        showAlert(
          'Rasterization Complete',
          `Successfully rasterized ${completed} PDF(s) at ${dpi} DPI.`,
          'success'
        );
      } else {
        showAlert(
          'Rasterization Partial',
          `Rasterized ${completed} PDF(s), failed ${failed}.`,
          'warning'
        );
      }
      return true;
    }
  } catch (e: any) {
    hideLoader();
    showAlert('Error', `An error occurred during rasterization. Error: ${e.message}`);
    return false;
  }
}

async function rasterizeSinglePdf(
  file: File,
  scale: number,
  format: 'png' | 'jpeg',
  grayscale: boolean,
  quality: number
): Promise<Blob> {
  // Load the original PDF with pdfjs
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  // Create a new PDF document with pdf-lib
  const newPdfDoc = await PDFDocument.create();

  const numPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    showLoader(`Rasterizing page ${pageNum}/${numPages}...`);

    // Render page to canvas
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, canvas, viewport }).promise;

    // Convert to grayscale if needed
    if (grayscale) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      context.putImageData(imageData, 0, 0);
    }

    // Convert canvas to blob
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob from canvas'));
        },
        mimeType,
        format === 'jpeg' ? quality / 100 : undefined
      );
    });

    // Embed image in new PDF
    const imageBytes = await imageBlob.arrayBuffer();
    let embeddedImage;
    if (format === 'png') {
      embeddedImage = await newPdfDoc.embedPng(imageBytes);
    } else {
      embeddedImage = await newPdfDoc.embedJpg(imageBytes);
    }

    const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  // Save the new PDF
  const pdfBytes = await newPdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById('process-btn');
  const fileDisplayArea = document.getElementById('file-display-area');
  const rasterizeOptions = document.getElementById('rasterize-options');
  const fileControls = document.getElementById('file-controls');
  const addMoreBtn = document.getElementById('add-more-btn');
  const clearFilesBtn = document.getElementById('clear-files-btn');
  const backBtn = document.getElementById('back-to-tools');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const updateUI = async () => {
    if (!fileDisplayArea || !rasterizeOptions || !processBtn || !fileControls) return;

    if (state.files.length > 0) {
      fileDisplayArea.innerHTML = '';

      for (let index = 0; index < state.files.length; index++) {
        const file = state.files[index];
        const fileDiv = document.createElement('div');
        fileDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

        const infoContainer = document.createElement('div');
        infoContainer.className = 'flex flex-col overflow-hidden';

        const nameSpan = document.createElement('div');
        nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
        nameSpan.textContent = file.name;

        const metaSpan = document.createElement('div');
        metaSpan.className = 'text-xs text-gray-400';
        metaSpan.textContent = `${formatBytes(file.size)} • Loading pages...`;

        infoContainer.append(nameSpan, metaSpan);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
        removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
        removeBtn.onclick = () => {
          state.files = state.files.filter((_, i) => i !== index);
          updateUI();
        };

        fileDiv.append(infoContainer, removeBtn);
        fileDisplayArea.appendChild(fileDiv);

        try {
          const arrayBuffer = await readFileAsArrayBuffer(file);
          const pdfDoc = await getPDFDocument({ data: arrayBuffer }).promise;
          metaSpan.textContent = `${formatBytes(file.size)} • ${pdfDoc.numPages} pages`;
        } catch (error) {
          console.error('Error loading PDF:', error);
          metaSpan.textContent = `${formatBytes(file.size)} • Could not load page count`;
        }
      }

      createIcons({ icons });
      fileControls.classList.remove('hidden');
      rasterizeOptions.classList.remove('hidden');
      (processBtn as HTMLButtonElement).disabled = false;
    } else {
      fileDisplayArea.innerHTML = '';
      fileControls.classList.add('hidden');
      rasterizeOptions.classList.add('hidden');
      (processBtn as HTMLButtonElement).disabled = true;
    }
  };

  const resetState = () => {
    state.files = [];
    state.pdfDoc = null;
    updateUI();
  };

  const rasterize = async () => {
    try {
      if (state.files.length === 0) {
        showAlert('No Files', 'Please select at least one PDF file.');
        return;
      }

      if (!isPyMuPDFAvailable()) {
        showWasmRequiredDialog('pymupdf');
        return;
      }

      showLoader('Loading engine...');
      const pymupdf = await loadPyMuPDF();

      // Get options from UI
      const dpi =
        parseInt((document.getElementById('rasterize-dpi') as HTMLSelectElement).value) || 150;
      const format = (document.getElementById('rasterize-format') as HTMLSelectElement).value as
        | 'png'
        | 'jpeg';
      const grayscale = (document.getElementById('rasterize-grayscale') as HTMLInputElement)
        .checked;

      const total = state.files.length;
      let completed = 0;
      let failed = 0;

      if (total === 1) {
        const file = state.files[0];
        showLoader(`Rasterizing ${file.name}...`);

        const rasterizedBlob = await (pymupdf as any).rasterizePdf(file, {
          dpi,
          format,
          grayscale,
          quality: 95,
        });

        const outName = file.name.replace(/\.pdf$/i, '') + '_rasterized.pdf';
        downloadFile(rasterizedBlob, outName);

        hideLoader();
        showAlert(
          'Rasterization Complete',
          `Successfully rasterized PDF at ${dpi} DPI.`,
          'success',
          () => resetState()
        );
      } else {
        // Multiple files - create ZIP
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (const file of state.files) {
          try {
            showLoader(`Rasterizing ${file.name} (${completed + 1}/${total})...`);

            const rasterizedBlob = await (pymupdf as any).rasterizePdf(file, {
              dpi,
              format,
              grayscale,
              quality: 95,
            });

            const outName = file.name.replace(/\.pdf$/i, '') + '_rasterized.pdf';
            zip.file(outName, rasterizedBlob);

            completed++;
          } catch (error) {
            console.error(`Failed to rasterize ${file.name}:`, error);
            failed++;
          }
        }

        showLoader('Creating ZIP archive...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        downloadFile(zipBlob, 'rasterized-pdfs.zip');

        hideLoader();

        if (failed === 0) {
          showAlert(
            'Rasterization Complete',
            `Successfully rasterized ${completed} PDF(s) at ${dpi} DPI.`,
            'success',
            () => resetState()
          );
        } else {
          showAlert(
            'Rasterization Partial',
            `Rasterized ${completed} PDF(s), failed ${failed}.`,
            'warning',
            () => resetState()
          );
        }
      }
    } catch (e: any) {
      hideLoader();
      showAlert('Error', `An error occurred during rasterization. Error: ${e.message}`);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        state.files = [...state.files, ...pdfFiles];
        updateUI();
      }
    }
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

  if (addMoreBtn) {
    addMoreBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener('click', resetState);
  }

  if (processBtn) {
    processBtn.addEventListener('click', rasterize);
  }
});
