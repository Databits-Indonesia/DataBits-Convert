import { showAlert, showLoader, hideLoader } from '../components/ui';
import { downloadFile, formatBytes, hexToRgb } from '../utils/helpers';
import { PDFDocument as PDFLibDocument, rgb, PageSizes } from 'pdf-lib';
import { icons, createIcons } from 'lucide';
import { state } from '../state';

function resetState() {
  const fileDisplayArea = document.getElementById('fix-page-size-file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('fix-page-size-tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');
}

async function updateUI() {
  const fileDisplayArea = document.getElementById('fix-page-size-file-display-area');
  const toolOptions = document.getElementById('fix-page-size-tool-options');

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
    metaSpan.textContent = formatBytes(file.size);

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

    if (toolOptions) {
      toolOptions.classList.remove('hidden');
      setupButtonListeners();
    }
  } else {
    if (toolOptions) toolOptions.classList.add('hidden');
  }
}

function setupButtonListeners() {
  const processBtn = document.getElementById('fix-page-size-process-btn');
  const targetSizeSelect = document.getElementById('fix-page-size-target-size');
  const customSizeWrapper = document.getElementById('fix-page-size-custom-size-wrapper');

  // Setup custom size toggle
  if (targetSizeSelect && customSizeWrapper) {
    targetSizeSelect.addEventListener('change', function () {
      customSizeWrapper.classList.toggle(
        'hidden',
        (targetSizeSelect as HTMLSelectElement).value !== 'Custom'
      );
    });
  }

  if (processBtn) {
    processBtn.onclick = () => fixPageSize();
  }
}

async function fixPageSize() {
  if (state.files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  const targetSizeKey = (document.getElementById('fix-page-size-target-size') as HTMLSelectElement)
    .value;
  const orientation = (document.getElementById('fix-page-size-orientation') as HTMLSelectElement)
    .value;
  const scalingMode = (
    document.querySelector('input[name="fix-page-size-scaling-mode"]:checked') as HTMLInputElement
  ).value;
  const backgroundColor = hexToRgb(
    (document.getElementById('fix-page-size-background-color') as HTMLInputElement).value
  );

  showLoader('Standardizing pages...');

  try {
    let targetWidth, targetHeight;

    if (targetSizeKey === 'Custom') {
      const width = parseFloat(
        (document.getElementById('fix-page-size-custom-width') as HTMLInputElement).value
      );
      const height = parseFloat(
        (document.getElementById('fix-page-size-custom-height') as HTMLInputElement).value
      );
      const units = (document.getElementById('fix-page-size-custom-units') as HTMLSelectElement)
        .value;

      if (units === 'in') {
        targetWidth = width * 72;
        targetHeight = height * 72;
      } else {
        // mm
        targetWidth = width * (72 / 25.4);
        targetHeight = height * (72 / 25.4);
      }
    } else {
      [targetWidth, targetHeight] = PageSizes[targetSizeKey as keyof typeof PageSizes];
    }

    if (orientation === 'landscape' && targetWidth < targetHeight) {
      [targetWidth, targetHeight] = [targetHeight, targetWidth];
    } else if (orientation === 'portrait' && targetWidth > targetHeight) {
      [targetWidth, targetHeight] = [targetHeight, targetWidth];
    }

    const file = state.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const sourceDoc = await PDFLibDocument.load(arrayBuffer);
    const newDoc = await PDFLibDocument.create();

    for (const sourcePage of sourceDoc.getPages()) {
      const { width: sourceWidth, height: sourceHeight } = sourcePage.getSize();
      const embeddedPage = await newDoc.embedPage(sourcePage);

      const newPage = newDoc.addPage([targetWidth, targetHeight]);
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
        color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
      });

      const scaleX = targetWidth / sourceWidth;
      const scaleY = targetHeight / sourceHeight;
      const scale = scalingMode === 'fit' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

      const scaledWidth = sourceWidth * scale;
      const scaledHeight = sourceHeight * scale;

      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      newPage.drawPage(embeddedPage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
    }

    const newPdfBytes = await newDoc.save();
    const originalName = file.name.replace(/\.pdf$/i, '');

    downloadFile(
      new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }),
      `${originalName}_standardized.pdf`
    );
    showAlert('Success', 'Page sizes standardized successfully!', 'success', () => {
      resetState();
    });
  } catch (e) {
    console.error(e);
    showAlert('Error', 'An error occurred while standardizing pages.');
  } finally {
    hideLoader();
  }
}

export async function setupFixPageSizeTool() {
  console.log('[FixPageSize] setupFixPageSizeTool called');

  const container = document.getElementById('fix-page-size-container');
  console.log('[FixPageSize] Container element:', container);

  if (container) {
    container.classList.remove('hidden');
    console.log('[FixPageSize] Container shown');
  } else {
    console.error('[FixPageSize] Container not found!');
  }

  if (state.files.length > 0) {
    console.log('[FixPageSize] Loading PDF from files');
    await updateUI();
  }
}
