import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer, getPDFDocument } from '../utils/helpers';
import { state } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

// --- Global State for the Cropper Tool ---
const cropperState = {
  pdfDoc: null,
  currentPageNum: 1,
  originalPdfBytes: null,
  pageCrops: {},
  canvas: null as HTMLCanvasElement | null,
  isDragging: false,
  startX: 0,
  startY: 0,
  cropRect: null as { x: number; y: number; width: number; height: number } | null,
};

/**
 * Saves the current crop data to the state object.
 */
function saveCurrentCrop() {
  if (!cropperState.cropRect || !cropperState.canvas) return;

  const rect = cropperState.cropRect;
  const canvas = cropperState.canvas;

  // Calculate percentages relative to the canvas
  const cropPercentages = {
    x: rect.x / canvas.width,
    y: rect.y / canvas.height,
    width: rect.width / canvas.width,
    height: rect.height / canvas.height,
  };

  // Only save if we have valid crop data
  if (cropPercentages.width > 0 && cropPercentages.height > 0) {
    cropperState.pageCrops[cropperState.currentPageNum] = cropPercentages;
  }
}

/**
 * Draws the crop selection rectangle on the canvas
 */
function drawCropSelection(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  if (!cropperState.cropRect) return;

  const rect = cropperState.cropRect;

  // Draw semi-transparent overlay on non-selected areas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

  // Top
  ctx.fillRect(0, 0, canvas.width, rect.y);
  // Bottom
  ctx.fillRect(0, rect.y + rect.height, canvas.width, canvas.height - rect.y - rect.height);
  // Left
  ctx.fillRect(0, rect.y, rect.x, rect.height);
  // Right
  ctx.fillRect(rect.x + rect.width, rect.y, canvas.width - rect.x - rect.width, rect.height);

  // Draw selection border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

  // Draw corner handles
  const handleSize = 12;
  ctx.fillStyle = '#3b82f6';

  // Top-left
  ctx.fillRect(rect.x - handleSize / 2, rect.y - handleSize / 2, handleSize, handleSize);
  // Top-right
  ctx.fillRect(
    rect.x + rect.width - handleSize / 2,
    rect.y - handleSize / 2,
    handleSize,
    handleSize
  );
  // Bottom-left
  ctx.fillRect(
    rect.x - handleSize / 2,
    rect.y + rect.height - handleSize / 2,
    handleSize,
    handleSize
  );
  // Bottom-right
  ctx.fillRect(
    rect.x + rect.width - handleSize / 2,
    rect.y + rect.height - handleSize / 2,
    handleSize,
    handleSize
  );
}

/**
 * Renders a PDF page to the canvas for cropping.
 * @param {number} num The page number to render.
 */
async function displayPageAsImage(num: number) {
  showLoader(`Rendering Page ${num}...`);

  try {
    const page = await cropperState.pdfDoc.getPage(num);
    const container = document.getElementById('cropper-container');

    // Get the container's dimensions
    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - 32; // Account for padding
    const maxHeight = 700; // Max height for the canvas

    // Get original page dimensions at scale 1
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Calculate scale to fit within container while maintaining aspect ratio
    const scaleX = maxWidth / originalViewport.width;
    const scaleY = maxHeight / originalViewport.height;
    const scale = Math.min(scaleX, scaleY, 3.0); // Cap at 3x for quality

    // Use the calculated scale
    const viewport = page.getViewport({ scale });

    container.innerHTML = '';

    // Create canvas with full PDF dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.cursor = 'crosshair';
    canvas.className = 'shadow-lg rounded-lg';

    cropperState.canvas = canvas;

    // Render PDF page
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Create a background canvas to store the original rendering
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.drawImage(canvas, 0, 0);

    // Restore saved crop or set default
    const savedCrop = cropperState.pageCrops[num];
    if (savedCrop) {
      cropperState.cropRect = {
        x: savedCrop.x * canvas.width,
        y: savedCrop.y * canvas.height,
        width: savedCrop.width * canvas.width,
        height: savedCrop.height * canvas.height,
      };
    } else {
      // Default crop area (80% of canvas, centered)
      const margin = 0.1;
      cropperState.cropRect = {
        x: canvas.width * margin,
        y: canvas.height * margin,
        width: canvas.width * (1 - 2 * margin),
        height: canvas.height * (1 - 2 * margin),
      };
    }

    // Redraw with crop selection
    ctx.drawImage(bgCanvas, 0, 0);
    drawCropSelection(ctx, canvas);

    // Mouse event handlers
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      cropperState.isDragging = true;
      cropperState.startX = x;
      cropperState.startY = y;
      cropperState.cropRect = { x, y, width: 0, height: 0 };
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!cropperState.isDragging) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const width = x - cropperState.startX;
      const height = y - cropperState.startY;

      cropperState.cropRect = {
        x: width < 0 ? x : cropperState.startX,
        y: height < 0 ? y : cropperState.startY,
        width: Math.abs(width),
        height: Math.abs(height),
      };

      // Redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgCanvas, 0, 0);
      drawCropSelection(ctx, canvas);
    });

    canvas.addEventListener('mouseup', () => {
      if (cropperState.isDragging) {
        cropperState.isDragging = false;
        saveCurrentCrop();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (cropperState.isDragging) {
        cropperState.isDragging = false;
        saveCurrentCrop();
      }
    });

    // Touch event handlers for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      cropperState.isDragging = true;
      cropperState.startX = x;
      cropperState.startY = y;
      cropperState.cropRect = { x, y, width: 0, height: 0 };
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!cropperState.isDragging) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      const width = x - cropperState.startX;
      const height = y - cropperState.startY;

      cropperState.cropRect = {
        x: width < 0 ? x : cropperState.startX,
        y: height < 0 ? y : cropperState.startY,
        width: Math.abs(width),
        height: Math.abs(height),
      };

      // Redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgCanvas, 0, 0);
      drawCropSelection(ctx, canvas);
    });

    canvas.addEventListener('touchend', () => {
      if (cropperState.isDragging) {
        cropperState.isDragging = false;
        saveCurrentCrop();
      }
    });

    container.appendChild(canvas);

    updatePageInfo();
    enableControls();
    hideLoader();
    showAlert('Ready', 'Click and drag to select the area to crop.');
  } catch (error) {
    console.error('Error rendering page:', error);
    showAlert('Error', 'Failed to render page.');
    hideLoader();
  }
}

/**
 * Handles page navigation.
 * @param {number} offset -1 for previous, 1 for next.
 */
async function changePage(offset: number) {
  // Save the current page's crop before changing
  saveCurrentCrop();

  const newPageNum = cropperState.currentPageNum + offset;
  if (newPageNum > 0 && newPageNum <= cropperState.pdfDoc.numPages) {
    cropperState.currentPageNum = newPageNum;
    await displayPageAsImage(cropperState.currentPageNum);
  }
}

function updatePageInfo() {
  document.getElementById('page-info').textContent =
    `Page ${cropperState.currentPageNum} of ${cropperState.pdfDoc.numPages}`;
}

function enableControls() {
  // @ts-expect-error TS(2339) FIXME: Property 'disabled' does not exist on type 'HTMLEl... Remove this comment to see the full error message
  document.getElementById('prev-page').disabled = cropperState.currentPageNum <= 1;
  // @ts-expect-error TS(2339) FIXME: Property 'disabled' does not exist on type 'HTMLEl... Remove this comment to see the full error message
  document.getElementById('next-page').disabled =
    cropperState.currentPageNum >= cropperState.pdfDoc.numPages;
  // @ts-expect-error TS(2339) FIXME: Property 'disabled' does not exist on type 'HTMLEl... Remove this comment to see the full error message
  document.getElementById('crop-button').disabled = false;
}

/**
 * Performs a non-destructive crop by updating the page's crop box.
 */
async function performMetadataCrop(
  pdfToModify: PDFLibDocument,
  cropData: Record<number, { x: number; y: number; width: number; height: number }>
) {
  for (const pageNum in cropData) {
    const pdfJsPage = await cropperState.pdfDoc.getPage(Number(pageNum));
    const viewport = pdfJsPage.getViewport({ scale: 1 });

    const crop = cropData[pageNum];

    // Man I hate doing math
    // Calculate visual crop rectangle in viewport pixels
    const cropX = viewport.width * crop.x;
    const cropY = viewport.height * crop.y;
    const cropW = viewport.width * crop.width;
    const cropH = viewport.height * crop.height;

    // Define the 4 corners of the crop rectangle in visual coordinates (Top-Left origin)
    const visualCorners = [
      { x: cropX, y: cropY }, // TL
      { x: cropX + cropW, y: cropY }, // TR
      { x: cropX + cropW, y: cropY + cropH }, // BR
      { x: cropX, y: cropY + cropH }, // BL
    ];

    // This handles rotation, media box offsets, and coordinate system flips automatically
    const pdfCorners = visualCorners.map((p) => {
      return viewport.convertToPdfPoint(p.x, p.y);
    });

    // Find the bounding box of the converted points in PDF coordinates
    // convertToPdfPoint returns [x, y] arrays
    const pdfXs = pdfCorners.map((p) => p[0]);
    const pdfYs = pdfCorners.map((p) => p[1]);

    const minX = Math.min(...pdfXs);
    const maxX = Math.max(...pdfXs);
    const minY = Math.min(...pdfYs);
    const maxY = Math.max(...pdfYs);

    // @ts-expect-error TS(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
    const page = pdfToModify.getPages()[pageNum - 1];
    page.setCropBox(minX, minY, maxX - minX, maxY - minY);
  }
}

/**
 * Performs a destructive crop by flattening the selected area to an image.
 */
async function performFlatteningCrop(
  cropData: Record<number, { x: number; y: number; width: number; height: number }>
) {
  const newPdfDoc = await PDFLibDocument.create();

  // Load the original PDF with pdf-lib to copy un-cropped pages from
  const sourcePdfDocForCopying = await PDFLibDocument.load(cropperState.originalPdfBytes, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
  });
  const totalPages = cropperState.pdfDoc.numPages;

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    showLoader(`Processing page ${pageNum} of ${totalPages}...`);

    if (cropData[pageNum]) {
      const page = await cropperState.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.5 });

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      await page.render({ canvasContext: tempCtx, viewport: viewport }).promise;

      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      const crop = cropData[pageNum];
      const finalWidth = tempCanvas.width * crop.width;
      const finalHeight = tempCanvas.height * crop.height;
      finalCanvas.width = finalWidth;
      finalCanvas.height = finalHeight;

      finalCtx.drawImage(
        tempCanvas,
        tempCanvas.width * crop.x,
        tempCanvas.height * crop.y,
        finalWidth,
        finalHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );

      const pngBytes = await new Promise((res) =>
        finalCanvas.toBlob((blob) => blob.arrayBuffer().then(res), 'image/png')
      );
      const embeddedImage = await newPdfDoc.embedPng(pngBytes as ArrayBuffer);
      const newPage = newPdfDoc.addPage([finalWidth, finalHeight]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: finalWidth,
        height: finalHeight,
      });
    } else {
      const [copiedPage] = await newPdfDoc.copyPages(sourcePdfDocForCopying, [i]);
      newPdfDoc.addPage(copiedPage);
    }
  }
  return newPdfDoc;
}

export async function setupCropperTool() {
  if (state.files.length === 0) return;

  // Show the cropper tool container
  const container = document.getElementById('cropper-tool-container');
  if (container) {
    container.classList.remove('hidden');
  }

  // Clear pageCrops on new file upload
  try {
    // Clear pageCrops on new file upload
    cropperState.pageCrops = {};

    const arrayBuffer = await readFileAsArrayBuffer(state.files[0]);
    cropperState.originalPdfBytes = arrayBuffer;
    const arrayBufferForPdfJs = (arrayBuffer as ArrayBuffer).slice(0);
    const loadingTask = getPDFDocument({ data: arrayBufferForPdfJs });

    cropperState.pdfDoc = await loadingTask.promise;
    cropperState.currentPageNum = 1;

    await displayPageAsImage(cropperState.currentPageNum);
  } catch (error) {
    console.error('Error setting up cropper tool:', error);
    showAlert('Error', 'Failed to load PDF for cropping.');
  }

  // Remove existing event listeners by cloning elements
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const cropBtn = document.getElementById('crop-button');

  if (prevBtn) {
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.replaceWith(newPrevBtn);
    newPrevBtn.addEventListener('click', () => changePage(-1));
  }

  if (nextBtn) {
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.replaceWith(newNextBtn);
    newNextBtn.addEventListener('click', () => changePage(1));
  }

  if (cropBtn) {
    const newCropBtn = cropBtn.cloneNode(true);
    cropBtn.replaceWith(newCropBtn);
    newCropBtn.addEventListener('click', async () => {
      // Get the last known crop from the active page before processing
      saveCurrentCrop();

      const isDestructive = (document.getElementById('destructive-crop-toggle') as HTMLInputElement)
        .checked;
      const isApplyToAll = (document.getElementById('apply-to-all-toggle') as HTMLInputElement)
        .checked;

      let finalCropData = {};
      if (isApplyToAll) {
        const currentCrop = cropperState.pageCrops[cropperState.currentPageNum];
        if (!currentCrop) {
          showAlert('No Crop Area', 'Please select an area to crop first.');
          return;
        }
        // Apply the active page's crop to all pages
        for (let i = 1; i <= cropperState.pdfDoc.numPages; i++) {
          finalCropData[i] = currentCrop;
        }
      } else {
        // If not applying to all, only process pages with saved crops
        finalCropData = Object.keys(cropperState.pageCrops).reduce((obj, key) => {
          obj[key] = cropperState.pageCrops[key];
          return obj;
        }, {});
      }

      if (Object.keys(finalCropData).length === 0) {
        showAlert('No Crop Area', 'Please select an area on at least one page to crop.');
        return;
      }

      showLoader('Applying crop...');

      try {
        let finalPdfBytes;

        if (isDestructive) {
          const newPdfDoc = await performFlatteningCrop(finalCropData);
          finalPdfBytes = await newPdfDoc.save();
        } else {
          const pdfToModify = await PDFLibDocument.load(cropperState.originalPdfBytes, {
            ignoreEncryption: true,
            throwOnInvalidObject: false,
          });
          await performMetadataCrop(pdfToModify, finalCropData);
          finalPdfBytes = await pdfToModify.save();
        }

        const fileName = isDestructive ? 'flattened_crop.pdf' : 'standard_crop.pdf';
        const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });

        downloadFile(blob, fileName);

        showAlert('Success', 'Crop complete! Your download has started.');
      } catch (e) {
        console.error('Crop error:', e);
        showAlert('Error', 'An error occurred during cropping: ' + (e as Error).message);
      } finally {
        hideLoader();
      }
    });
  }
}
