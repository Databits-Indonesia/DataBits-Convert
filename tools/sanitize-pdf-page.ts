import { showAlert } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import { SanitizePdfState } from '@/types';
import { PDFDocument } from 'pdf-lib';

const pageState: SanitizePdfState = {
  file: null,
  pdfDoc: null,
};

function resetState() {
  pageState.file = null;
  pageState.pdfDoc = null;

  const fileDisplayArea = document.getElementById('file-display-area');
  if (fileDisplayArea) fileDisplayArea.innerHTML = '';

  const toolOptions = document.getElementById('tool-options');
  if (toolOptions) toolOptions.classList.add('hidden');

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}

async function updateUI() {
  const fileDisplayArea = document.getElementById('file-display-area');
  const toolOptions = document.getElementById('tool-options');

  if (!fileDisplayArea) return;

  fileDisplayArea.innerHTML = '';

  if (pageState.file) {
    const fileDiv = document.createElement('div');
    fileDiv.className =
      'flex items-center justify-between bg-gray-700 p-3 rounded-lg text-sm';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'flex flex-col overflow-hidden';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'truncate font-medium text-gray-200 text-sm mb-1';
    nameSpan.textContent = pageState.file.name;

    const metaSpan = document.createElement('div');
    metaSpan.className = 'text-xs text-gray-400';
    metaSpan.textContent = formatBytes(pageState.file.size);

    infoContainer.append(nameSpan, metaSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'ml-4 text-red-400 hover:text-red-300 flex-shrink-0';
    removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
    removeBtn.onclick = function () {
      resetState();
    };

    fileDiv.append(infoContainer, removeBtn);
    fileDisplayArea.appendChild(fileDiv);
    createIcons({ icons });

    if (toolOptions) toolOptions.classList.remove('hidden');
  } else {
    if (toolOptions) toolOptions.classList.add('hidden');
  }
}

async function handleFileSelect(files: FileList | null) {
  if (files && files.length > 0) {
    const file = files[0];
    if (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      pageState.file = file;
      updateUI();
    }
  }
}

export interface SanitizeOptions {
  flattenForms?: boolean;
  removeMetadata?: boolean;
  removeAnnotations?: boolean;
  removeJavascript?: boolean;
  removeEmbeddedFiles?: boolean;
  removeLayers?: boolean;
  removeLinks?: boolean;
  removeStructureTree?: boolean;
  removeMarkInfo?: boolean;
  removeFonts?: boolean;
}

export async function sanitizePdfDocument(
  pdfBytes: Uint8Array,
  options: SanitizeOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Remove metadata
  if (options.removeMetadata) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
  }

  // Remove JavaScript
  if (options.removeJavascript) {
    const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
    if (catalog) {
      catalog.delete('Names');
      catalog.delete('OpenAction');
      catalog.delete('AA');
    }
  }

  // Remove annotations
  if (options.removeAnnotations) {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const pageDict = page.node;
      pageDict.delete('Annots');
    }
  }

  // Flatten forms
  if (options.flattenForms) {
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      if (fields.length > 0) {
        form.flatten();
      }
    } catch (e) {
      // Form might not exist
    }
  }

  const sanitizedBytes = await pdfDoc.save();
  return sanitizedBytes;
}

async function runSanitize() {
  if (!pageState.file) {
    showAlert('Error', 'No PDF document loaded.');
    return;
  }

  const loaderModal = document.getElementById('loader-modal');
  const loaderText = document.getElementById('loader-text');
  if (loaderModal) loaderModal.classList.remove('hidden');
  if (loaderText) loaderText.textContent = 'Sanitizing PDF...';

  try {
    const options: SanitizeOptions = {
      flattenForms: (
        document.getElementById('flatten-forms') as HTMLInputElement
      )?.checked || false,
      removeMetadata: (
        document.getElementById('remove-metadata') as HTMLInputElement
      )?.checked || false,
      removeAnnotations: (
        document.getElementById('remove-annotations') as HTMLInputElement
      )?.checked || false,
      removeJavascript: (
        document.getElementById('remove-javascript') as HTMLInputElement
      )?.checked || false,
      removeEmbeddedFiles: (
        document.getElementById('remove-embedded-files') as HTMLInputElement
      )?.checked || false,
      removeLayers: (
        document.getElementById('remove-layers') as HTMLInputElement
      )?.checked || false,
      removeLinks: (document.getElementById('remove-links') as HTMLInputElement)
        ?.checked || false,
      removeStructureTree: (
        document.getElementById('remove-structure-tree') as HTMLInputElement
      )?.checked || false,
      removeMarkInfo: (
        document.getElementById('remove-markinfo') as HTMLInputElement
      )?.checked || false,
      removeFonts: (document.getElementById('remove-fonts') as HTMLInputElement)
        ?.checked || false,
    };

    const hasAnyOption = Object.values(options).some(Boolean);
    if (!hasAnyOption) {
      showAlert(
        'No Changes',
        'Please select at least one sanitization option.'
      );
      if (loaderModal) loaderModal.classList.add('hidden');
      return;
    }

    const arrayBuffer = await pageState.file.arrayBuffer();
    const result = await sanitizePdfDocument(new Uint8Array(arrayBuffer), options);

    downloadFile(
      new Blob([result], { type: 'application/pdf' }),
      'sanitized.pdf'
    );
    showAlert(
      'Success',
      'PDF has been sanitized and downloaded.',
      'success',
      () => {
        resetState();
      }
    );
  } catch (e: any) {
    console.error('Sanitization Error:', e);
    showAlert('Error', `An error occurred during sanitization: ${e.message}`);
  } finally {
    if (loaderModal) loaderModal.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById('process-btn');
  const backBtn = document.getElementById('back-to-tools');

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      window.location.href = (process.env.BASE_URL || '/');
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
    processBtn.addEventListener('click', runSanitize);
  }
});
