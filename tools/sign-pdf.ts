import { PDFDocument } from 'pdf-lib';
import { showLoader, hideLoader, showAlert } from '../components/ui';
import { readFileAsArrayBuffer, getPDFDocument } from '../utils/helpers';
import { state, setPdfDoc } from '../state';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const signState = {
  currentPage: 1,
  totalPages: 0,
  pdfDoc: null as PDFDocumentProxy | null,
  signatureCanvas: null as HTMLCanvasElement | null,
  isDrawing: false,
  signatureData: null as string | null,
  signaturePosition: { page: 1, x: 0, y: 0 },
  signaturePreviewElement: null as HTMLElement | null,
  signatureScale: 1.0,
  baseSignatureWidth: 150,
  baseSignatureHeight: 50,
  signaturePlaced: false,
};

export async function setupSignTool() {
  document.getElementById('signature-editor')?.classList.remove('hidden');

  showLoader('Loading PDF...');

  const container = document.getElementById('canvas-container-sign');
  if (!container) {
    console.error('Sign tool canvas container not found');
    hideLoader();
    return;
  }

  if (!state.files || !state.files[0]) {
    console.error('No file loaded into state for signing');
    hideLoader();
    return;
  }

  try {
    // Load PDF document
    const file = state.files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    setPdfDoc(pdfDoc);

    // Load PDF for rendering
    const pdf = await getPDFDocument({ data: arrayBuffer }).promise;
    signState.pdfDoc = pdf;
    signState.totalPages = pdf.numPages;
    signState.currentPage = 1;

    // Render the interface
    container.innerHTML = '';
    await renderSignInterface(container);

    hideLoader();
  } catch (error) {
    console.error('Error loading PDF for signing:', error);
    hideLoader();
    showAlert('Error', 'Failed to load PDF document.');
  }
}

async function renderSignInterface(container: HTMLElement) {
  // Clear and set up the container properly
  container.innerHTML = '';
  container.className = 'mb-6 bg-gray-100 dark:bg-gray-900 rounded-lg p-4';

  // Create PDF preview area
  const pdfPreview = document.createElement('div');
  pdfPreview.className =
    'overflow-auto bg-gray-50 dark:bg-gray-900 mb-6 max-h-[700px] flex justify-center';
  pdfPreview.id = 'pdf-preview-sign';

  // Create signature drawing area
  const signatureArea = document.createElement('div');
  signatureArea.className =
    'border-t border-gray-300 dark:border-gray-600 pt-4 bg-white dark:bg-gray-800 rounded-lg p-4';
  signatureArea.innerHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Step 1: Draw your signature below
      </label>
      <div class="flex justify-center">
        <canvas id="signature-canvas" 
          class="border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair bg-white"
          width="600" height="150">
        </canvas>
      </div>
    </div>
    
    <div class="mb-4">
      <label for="signature-scale" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
        Signature Size: <span id="scale-value" class="font-bold">100</span>%
      </label>
      <div class="flex items-center gap-3 max-w-md mx-auto">
        <span class="text-sm text-gray-600 dark:text-gray-400">50%</span>
        <input type="range" id="signature-scale" min="0.5" max="3.0" value="1.0" step="0.1"
          class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">
        <span class="text-sm text-gray-600 dark:text-gray-400">300%</span>
      </div>
    </div>
    
    <p class="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
      Step 2: Adjust signature size, then click on any PDF page above to position it
    </p>
    
    <div class="flex gap-2 justify-center">
      <button id="clear-signature-btn" 
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
        Clear Signature
      </button>
      <button id="place-signature-btn" 
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Place Signature on Preview
      </button>
    </div>
    
    <div id="signature-placed-message" class="hidden mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
      <p class="text-sm text-green-800 dark:text-green-200 text-center">
        ✓ Signature placed! Click "Save Signed PDF" button below to download your signed document.
      </p>
    </div>
  `;

  container.appendChild(pdfPreview);
  container.appendChild(signatureArea);

  // Render PDF pages
  await renderPDFPages();

  // Setup signature canvas (with a small delay to ensure DOM is ready)
  setTimeout(() => {
    setupSignatureCanvas();
  }, 100);

  // Setup button handlers
  const clearBtn = document.getElementById('clear-signature-btn');
  clearBtn?.addEventListener('click', clearSignature);

  const placeBtn = document.getElementById('place-signature-btn');
  placeBtn?.addEventListener('click', placeSignature);

  // Setup scale slider
  const scaleSlider = document.getElementById('signature-scale') as HTMLInputElement;
  const scaleValue = document.getElementById('scale-value');

  scaleSlider?.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    signState.signatureScale = value;
    if (scaleValue) scaleValue.textContent = Math.round(value * 100).toString();
    updateSignaturePreview();
  });
}

function updateSignaturePreview() {
  // Update the preview if it exists
  if (signState.signaturePreviewElement) {
    const width = signState.baseSignatureWidth * signState.signatureScale;
    const height = signState.baseSignatureHeight * signState.signatureScale;

    signState.signaturePreviewElement.style.width = `${width}px`;
    signState.signaturePreviewElement.style.height = `${height}px`;

    // Recalculate the position to keep it centered
    const currentLeft = parseFloat(signState.signaturePreviewElement.style.left);
    const currentTop = parseFloat(signState.signaturePreviewElement.style.top);
    signState.signaturePreviewElement.style.left = `${currentLeft}px`;
    signState.signaturePreviewElement.style.top = `${currentTop}px`;
  }
}

async function renderPDFPages() {
  const preview = document.getElementById('pdf-preview-sign');
  if (!preview || !signState.pdfDoc) return;

  preview.innerHTML = '<div class="space-y-4"></div>';
  const container = preview.querySelector('div');

  // Get the container's dimensions for scale calculation
  const previewRect = preview.getBoundingClientRect();
  const maxWidth = previewRect.width - 32; // Account for padding
  const maxHeight = 650; // Max height per page

  for (let pageNum = 1; pageNum <= signState.totalPages; pageNum++) {
    const page = await signState.pdfDoc.getPage(pageNum);

    // Get original page dimensions at scale 1
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Calculate scale to fit within container while maintaining aspect ratio
    const scaleX = maxWidth / originalViewport.width;
    const scaleY = maxHeight / originalViewport.height;
    const scale = Math.min(scaleX, scaleY, 2.5); // Cap at 2.5x for quality

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.className = 'shadow-lg rounded-lg mb-4 cursor-crosshair';

    await page.render({ canvasContext: context!, viewport, canvas }).promise;

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'relative';
    pageWrapper.dataset.pageNumber = String(pageNum);
    pageWrapper.dataset.scale = String(scale);

    const pageLabel = document.createElement('div');
    pageLabel.className = 'text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium';
    pageLabel.textContent = `Page ${pageNum} of ${signState.totalPages} - Click to place signature`;

    // Add click handler to canvas for positioning signature
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'relative inline-block';
    canvasWrapper.appendChild(canvas);

    canvas.addEventListener('click', (e) => {
      if (!signState.signatureData) {
        showAlert(
          'Draw Signature First',
          'Please draw your signature before placing it on the PDF.'
        );
        return;
      }
      handleCanvasClick(e, pageNum, canvas, canvasWrapper);
    });

    pageWrapper.appendChild(pageLabel);
    pageWrapper.appendChild(canvasWrapper);
    container?.appendChild(pageWrapper);
  }
}

function handleCanvasClick(
  e: MouseEvent,
  pageNum: number,
  canvas: HTMLCanvasElement,
  canvasWrapper: HTMLElement
) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Get the scale from the canvas wrapper's dataset
  const pageWrapper = canvasWrapper.closest('[data-scale]') as HTMLElement;
  const scale = pageWrapper ? parseFloat(pageWrapper.dataset.scale || '1.5') : 1.5;

  // Store the position
  signState.signaturePosition = {
    page: pageNum,
    x: x / scale, // Adjust for scale
    y: (canvas.height - y) / scale, // Flip Y coordinate for PDF coordinate system and adjust for scale
  };

  // Remove previous preview if exists
  const existingPreview = document.querySelector('.signature-preview');
  existingPreview?.remove();

  // Create signature preview
  const preview = document.createElement('img');
  preview.src = signState.signatureData!;
  preview.className =
    'signature-preview absolute pointer-events-none border-2 border-blue-500 rounded';

  const width = signState.baseSignatureWidth * signState.signatureScale;
  const height = signState.baseSignatureHeight * signState.signatureScale;

  preview.style.left = `${x - width / 2}px`;
  preview.style.top = `${y - height / 2}px`;
  preview.style.width = `${width}px`;
  preview.style.height = `${height}px`;
  preview.style.opacity = '0.7';

  canvasWrapper.appendChild(preview);
  signState.signaturePreviewElement = preview;

  // Show instruction
  const instruction = document.createElement('div');
  instruction.className =
    'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  instruction.textContent = 'Click "Place Signature on Preview" to confirm placement';
  document.body.appendChild(instruction);
  setTimeout(() => instruction.remove(), 3000);
}

function placeSignature() {
  if (!signState.signatureData) {
    showAlert('No Signature', 'Please draw a signature first.');
    return;
  }

  if (!signState.signaturePreviewElement) {
    showAlert(
      'Position Signature',
      'Please click on the PDF to position your signature before placing it.'
    );
    return;
  }

  // Mark signature as placed
  signState.signaturePlaced = true;

  // Make the preview more opaque to show it's confirmed
  signState.signaturePreviewElement.style.opacity = '0.95';
  signState.signaturePreviewElement.style.borderColor = '#10b981'; // green border

  // Show success message
  const message = document.getElementById('signature-placed-message');
  if (message) {
    message.classList.remove('hidden');
  }

  // Show a toast notification
  const toast = document.createElement('div');
  toast.className =
    'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  toast.textContent = 'Signature placed! Use "Save Signed PDF" to download.';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function setupSignatureCanvas() {
  const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  signState.signatureCanvas = canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let lastX = 0;
  let lastY = 0;

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    signState.isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    } else {
      lastX = e.touches[0].clientX - rect.left;
      lastY = e.touches[0].clientY - rect.top;
    }
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!signState.isDrawing) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let currentX, currentY;

    if (e instanceof MouseEvent) {
      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
    } else {
      currentX = e.touches[0].clientX - rect.left;
      currentY = e.touches[0].clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastX = currentX;
    lastY = currentY;
  };

  const stopDrawing = () => {
    if (signState.isDrawing) {
      signState.signatureData = canvas.toDataURL('image/png');
    }
    signState.isDrawing = false;
  };

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);
}

function clearSignature() {
  if (!signState.signatureCanvas) return;

  const ctx = signState.signatureCanvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, signState.signatureCanvas.width, signState.signatureCanvas.height);
  }
  signState.signatureData = null;
}

export async function applyAndSaveSignatures() {
  if (!signState.signatureData) {
    showAlert('No Signature', 'Please draw a signature first.');
    return;
  }

  if (!state.pdfDoc) {
    showAlert('Error', 'PDF document not loaded.');
    return;
  }

  if (!signState.signaturePlaced) {
    showAlert(
      'Place Signature First',
      'Please draw your signature, position it on the PDF, and click "Place Signature on Preview" before saving.'
    );
    return;
  }

  try {
    showLoader('Saving signed PDF...');

    const pdfDoc = state.pdfDoc;

    // Embed the signature image
    const signatureImage = await pdfDoc.embedPng(signState.signatureData);

    // Add signature to the selected page at the selected position
    const pages = pdfDoc.getPages();
    const targetPage = pages[signState.signaturePosition.page - 1];

    // Use the stored position and scaled dimensions
    const width = signState.baseSignatureWidth * signState.signatureScale;
    const height = signState.baseSignatureHeight * signState.signatureScale;

    targetPage.drawImage(signatureImage, {
      x: signState.signaturePosition.x - width / 2,
      y: signState.signaturePosition.y - height / 2,
      width: width,
      height: height,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signed_${state.files[0].name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    hideLoader();
    showAlert('Success', 'Signed PDF downloaded successfully!');

    // Clear signature preview and reset state
    signState.signaturePreviewElement?.remove();
    signState.signaturePreviewElement = null;
    signState.signaturePlaced = false;

    // Hide success message
    const message = document.getElementById('signature-placed-message');
    if (message) {
      message.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error saving signed PDF:', error);
    hideLoader();
    showAlert('Error', 'Failed to save signed PDF.');
  }
}
