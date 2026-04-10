import { showLoader, hideLoader, showAlert } from '../ui';
import { t } from '../i18n/i18n';
import { downloadFile, readFileAsArrayBuffer, formatBytes, getPDFDocument } from '../utils/helpers';
import { state } from '../state';
import { createIcons, icons } from 'lucide';
import { showWasmRequiredDialog } from '../utils/wasm-provider';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';

export interface ExtractedImage {
  data: Uint8Array;
  name: string;
  ext: string;
  sourceFileName?: string;
  pageNumber?: number;
}

export interface ExtractImagesOptions {
  dedupePerPage?: boolean;
  filenamePrefix?: string;
}

let extractedImages: ExtractedImage[] = [];
let isPageSetup = false;
const previewUrls: string[] = [];

function getMimeType(ext: string): string {
  const normalizedExt = ext.toLowerCase();
  if (normalizedExt === 'jpg' || normalizedExt === 'jpeg') return 'image/jpeg';
  if (normalizedExt === 'png') return 'image/png';
  if (normalizedExt === 'gif') return 'image/gif';
  if (normalizedExt === 'webp') return 'image/webp';
  if (normalizedExt === 'bmp') return 'image/bmp';
  if (normalizedExt === 'tif' || normalizedExt === 'tiff') return 'image/tiff';
  return 'application/octet-stream';
}

function sanitizeBaseName(fileName: string): string {
  return (
    fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'document'
  );
}

function normalizeExt(ext?: string): string {
  const cleaned = (ext || 'png').trim().toLowerCase();
  return cleaned || 'png';
}

function clearPreviewUrls(): void {
  for (const url of previewUrls) {
    URL.revokeObjectURL(url);
  }
  previewUrls.length = 0;
}

export async function extractImagesPdf(
  files: File[],
  options: ExtractImagesOptions = {}
): Promise<ExtractedImage[]> {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one PDF file.');
  }

  if (!isPyMuPDFAvailable()) {
    showWasmRequiredDialog('pymupdf');
    throw new Error('PyMuPDF is not configured. Configure it in Advanced Settings.');
  }

  const pymupdf = await loadPyMuPDF();
  const result: ExtractedImage[] = [];
  let globalImageCounter = 0;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    showLoader(`Extracting images from ${file.name} (${fileIndex + 1}/${files.length})...`);

    let doc: any | null = null;
    try {
      doc = await pymupdf.open(file);
      const pageCount = doc.pageCount;
      const baseName = sanitizeBaseName(file.name);

      for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
        const page = doc.getPage(pageIdx);
        const images = page.getImages();
        const seenXrefs = new Set<number>();

        for (const imgInfo of images) {
          if (options.dedupePerPage && seenXrefs.has(imgInfo.xref)) {
            continue;
          }

          try {
            const imgData = page.extractImage(imgInfo.xref);
            if (!imgData || !imgData.data) continue;

            seenXrefs.add(imgInfo.xref);
            globalImageCounter++;

            const ext = normalizeExt(imgData.ext);
            const prefix = options.filenamePrefix || baseName;
            const imageName = `${prefix}_p${pageIdx + 1}_img${globalImageCounter}.${ext}`;

            result.push({
              data: imgData.data,
              name: imageName,
              ext,
              sourceFileName: file.name,
              pageNumber: pageIdx + 1,
            });
          } catch (error) {
            console.warn('Failed to extract image:', error);
          }
        }
      }
    } finally {
      if (doc) {
        doc.close();
      }
    }
  }

  return result;
}

export async function downloadImagesAsZip(
  images: ExtractedImage[],
  zipName = 'extracted-images.zip'
): Promise<void> {
  if (images.length === 0) {
    throw new Error('No images to download.');
  }

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  images.forEach((img) => {
    zip.file(img.name, img.data);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadFile(zipBlob, zipName);
}

export function displayExtractedImages(
  images: ExtractedImage[],
  imagesGridElement?: HTMLElement | null,
  imagesContainerElement?: HTMLElement | null
): void {
  const imagesGrid = imagesGridElement || document.getElementById('images-grid');
  const imagesContainer = imagesContainerElement || document.getElementById('images-container');

  if (!imagesGrid || !imagesContainer) return;

  clearPreviewUrls();
  imagesGrid.innerHTML = '';

  if (images.length === 0) {
    imagesContainer.classList.add('hidden');
    return;
  }

  images.forEach((img) => {
    const mimeType = getMimeType(img.ext);
    const blob = new Blob([new Uint8Array(img.data)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    previewUrls.push(url);

    const card = document.createElement('div');
    card.className = 'bg-gray-700 rounded-lg overflow-hidden';

    const imgEl = document.createElement('img');
    imgEl.src = url;
    imgEl.alt = img.name;
    imgEl.className = 'w-full h-32 object-cover';

    const info = document.createElement('div');
    info.className = 'p-2 flex justify-between items-center gap-2';

    const name = document.createElement('span');
    name.className = 'text-xs text-gray-300 truncate';
    name.textContent = img.name;

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'text-indigo-400 hover:text-indigo-300 flex-shrink-0';
    downloadBtn.innerHTML = '<i data-lucide="download" class="w-4 h-4"></i>';
    downloadBtn.onclick = () => {
      downloadFile(blob, img.name);
    };

    info.append(name, downloadBtn);
    card.append(imgEl, info);
    imagesGrid.appendChild(card);
  });

  createIcons({ icons });
  imagesContainer.classList.remove('hidden');
}

export function setupExtractImagesPage(): void {
  if (isPageSetup) return;
  isPageSetup = true;

  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById('process-btn') as HTMLButtonElement | null;
  const fileDisplayArea = document.getElementById('file-display-area');
  const extractOptions = document.getElementById('extract-options');
  const fileControls = document.getElementById('file-controls');
  const addMoreBtn = document.getElementById('add-more-btn');
  const clearFilesBtn = document.getElementById('clear-files-btn');
  const backBtn = document.getElementById('back-to-tools');
  const imagesContainer = document.getElementById('images-container');
  const imagesGrid = document.getElementById('images-grid');
  const downloadAllBtn = document.getElementById('download-all-btn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const updateUI = async () => {
    if (!fileDisplayArea || !extractOptions || !fileControls || !processBtn) return;

    extractedImages = [];
    clearPreviewUrls();
    if (imagesContainer) imagesContainer.classList.add('hidden');
    if (imagesGrid) imagesGrid.innerHTML = '';

    if (state.files.length === 0) {
      fileDisplayArea.innerHTML = '';
      fileControls.classList.add('hidden');
      extractOptions.classList.add('hidden');
      processBtn.disabled = true;
      return;
    }

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
      metaSpan.textContent = `${formatBytes(file.size)} • ${t('common.loadingPageCount')}`;

      infoContainer.append(nameSpan, metaSpan);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
      removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
      removeBtn.onclick = () => {
        state.files = state.files.filter((_: File, i: number) => i !== index);
        updateUI();
      };

      fileDiv.append(infoContainer, removeBtn);
      fileDisplayArea.appendChild(fileDiv);

      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdfDoc = await getPDFDocument({ data: arrayBuffer }).promise;
        metaSpan.textContent = `${formatBytes(file.size)} • ${pdfDoc.numPages} pages`;
      } catch {
        metaSpan.textContent = `${formatBytes(file.size)} • Could not load page count`;
      }
    }

    createIcons({ icons });
    fileControls.classList.remove('hidden');
    extractOptions.classList.remove('hidden');
    processBtn.disabled = false;
  };

  const resetState = () => {
    state.files = [];
    state.pdfDoc = null;
    extractedImages = [];
    clearPreviewUrls();
    if (imagesContainer) imagesContainer.classList.add('hidden');
    if (imagesGrid) imagesGrid.innerHTML = '';
    updateUI();
  };

  const extract = async () => {
    if (state.files.length === 0) {
      showAlert('No Files', 'Please select at least one PDF file.');
      return;
    }

    if (!isPyMuPDFAvailable()) {
      showWasmRequiredDialog('pymupdf');
      return;
    }

    if (processBtn) {
      processBtn.disabled = true;
    }

    try {
      showLoader('Loading PDF processor...');
      extractedImages = await extractImagesPdf(state.files, {
        dedupePerPage: true,
      });

      if (extractedImages.length === 0) {
        showAlert('No Images Found', 'No embedded images were found in the selected PDF(s).');
      } else {
        displayExtractedImages(extractedImages, imagesGrid as HTMLElement | null, imagesContainer);
        showAlert(
          'Extraction Complete',
          `Found ${extractedImages.length} image(s) in ${state.files.length} PDF(s).`,
          'success'
        );
      }
    } catch (error: unknown) {
      showAlert(
        'Error',
        `An error occurred during extraction. Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      hideLoader();
      if (processBtn) {
        processBtn.disabled = false;
      }
    }
  };

  const downloadAll = async () => {
    if (extractedImages.length === 0) return;

    try {
      showLoader('Creating ZIP archive...');
      await downloadImagesAsZip(extractedImages);
    } catch (error: unknown) {
      showAlert(
        'Error',
        `Failed to download ZIP. ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      hideLoader();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const incomingPdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (incomingPdfFiles.length === 0) {
      showAlert('Invalid Files', 'Please select PDF files only.');
      return;
    }

    const existingKeys = new Set(state.files.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
    const uniqueIncoming = incomingPdfFiles.filter(
      (f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`)
    );

    state.files = [...state.files, ...uniqueIncoming];
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
      handleFileSelect(e.dataTransfer?.files || null);
    });

    fileInput.addEventListener('click', () => {
      fileInput.value = '';
    });
  }

  if (addMoreBtn && fileInput) {
    addMoreBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener('click', () => {
      resetState();
    });
  }

  if (processBtn) {
    processBtn.addEventListener('click', extract);
  }

  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', downloadAll);
  }

  updateUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupExtractImagesPage);
} else {
  setupExtractImagesPage();
}
