import { showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';
import { showWasmRequiredDialog } from '../utils/wasm-provider';
import JSZip from 'jszip';

export interface ExtractedImage {
  data: Uint8Array;
  name: string;
  ext: string;
  width: number;
  height: number;
}

export interface ExtractImagesOptions {
  format?: 'original' | 'png' | 'jpg';
  minWidth?: number;
  minHeight?: number;
}

export async function extractImagesPdf(file: File, options: ExtractImagesOptions = {}): Promise<ExtractedImage[]> {
  const {
    format = 'original',
    minWidth = 0,
    minHeight = 0
  } = options;

  try {
    if (!isPyMuPDFAvailable()) {
      showWasmRequiredDialog('pymupdf', () => {
        window.location.reload();
      });
      throw new Error('PyMuPDF is required for image extraction. Please configure it in Advanced Settings.');
    }

    const pymupdf = await loadPyMuPDF();
    const extractedImages: ExtractedImage[] = [];
    let imgCounter = 0;

    const doc = await pymupdf.open(file);
    const pageCount = doc.pageCount;

    for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
      const page = doc.getPage(pageIdx);
      const images = page.getImages();

      for (const imgInfo of images) {
        try {
          const imgData = page.extractImage(imgInfo.xref);
          if (imgData && imgData.data) {
            const width = imgData.width || 0;
            const height = imgData.height || 0;

            // Filter by minimum dimensions
            if (width >= minWidth && height >= minHeight) {
              imgCounter++;
              const ext = format === 'original' ? (imgData.ext || 'png') : format;
              
              extractedImages.push({
                data: imgData.data,
                name: `image_${imgCounter}_page${pageIdx + 1}.${ext}`,
                ext: ext,
                width: width,
                height: height
              });
            }
          }
        } catch (e) {
          console.warn(`Failed to extract image from page ${pageIdx + 1}:`, e);
        }
      }
    }
    
    doc.close();
    return extractedImages;
  } catch (error: any) {
    console.error('Extract images error:', error);
    throw error;
  }
}

export async function downloadImagesAsZip(images: ExtractedImage[], filename: string = 'extracted_images.zip'): Promise<void> {
  try {
    const zip = new JSZip();
    const folder = zip.folder('images');

    if (!folder) {
      throw new Error('Failed to create zip folder');
    }

    images.forEach((img) => {
      folder.file(img.name, img.data);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadFile(blob, filename);
  } catch (error: any) {
    console.error('Download zip error:', error);
    throw error;
  }
}

export function setupExtractImagesPage() {
  const container = document.getElementById('extract-images-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>Extract Images from PDF</strong>
          <p>Extract all embedded images from your PDF files. Requires PyMuPDF to be configured in Advanced Settings.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="image"></i> Extraction Options</h3>
        
        <div class="form-group">
          <label for="image-format">Output Format</label>
          <select id="image-format" class="form-select">
            <option value="original">Original Format</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
          <small>Choose the format for extracted images</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label for="min-width">Minimum Width (px)</label>
            <input type="number" id="min-width" value="0" min="0" placeholder="0">
            <small>Filter images by minimum width</small>
          </div>
          
          <div class="form-group">
            <label for="min-height">Minimum Height (px)</label>
            <input type="number" id="min-height" value="0" min="0" placeholder="0">
            <small>Filter images by minimum height</small>
          </div>
        </div>
      </div>

      <div id="extracted-images-preview" class="hidden settings-panel">
        <h3><i data-lucide="image"></i> Extracted Images (<span id="image-count">0</span>)</h3>
        <div id="images-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto"></div>
      </div>

      <div class="action-buttons">
        <button id="extract-images-btn" class="btn btn-primary">
          <i data-lucide="image-plus"></i>
          Extract Images
        </button>
        <button id="download-zip-btn" class="btn btn-secondary hidden">
          <i data-lucide="download"></i>
          Download as ZIP
        </button>
      </div>
    </div>
  `;

  createIcons({
    icons,
    nameAttr: 'data-lucide',
    attrs: {
      'stroke-width': 2,
      width: 20,
      height: 20,
    },
  });

  // Return the container so event listeners can be attached
  return container;
}

export function displayExtractedImages(images: ExtractedImage[]) {
  const previewContainer = document.getElementById('extracted-images-preview');
  const imagesGrid = document.getElementById('images-grid');
  const imageCount = document.getElementById('image-count');
  const downloadZipBtn = document.getElementById('download-zip-btn');

  if (!imagesGrid || !previewContainer || !imageCount) return;

  imageCount.textContent = images.length.toString();
  imagesGrid.innerHTML = '';

  images.forEach((img, index) => {
    const blob = new Blob([img.data]);
    const url = URL.createObjectURL(blob);

    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow';

    card.innerHTML = `
      <div class="relative group">
        <img src="${url}" alt="${img.name}" class="w-full h-32 object-cover">
        <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button class="download-single-btn text-white hover:text-gray-200 p-2" data-index="${index}">
            <i data-lucide="download" class="w-6 h-6"></i>
          </button>
        </div>
      </div>
      <div class="p-2">
        <p class="text-xs text-gray-700 dark:text-gray-300 truncate" title="${img.name}">${img.name}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">${img.width}×${img.height}px</p>
      </div>
    `;

    imagesGrid.appendChild(card);
  });

  // Add click handlers for individual downloads
  document.querySelectorAll('.download-single-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '0');
      const img = images[index];
      const blob = new Blob([img.data]);
      downloadFile(blob, img.name);
    });
  });

  createIcons({
    icons,
    nameAttr: 'data-lucide',
    attrs: {
      'stroke-width': 2,
      width: 20,
      height: 20,
    },
  });

  previewContainer.classList.remove('hidden');
  if (downloadZipBtn) downloadZipBtn.classList.remove('hidden');
}
