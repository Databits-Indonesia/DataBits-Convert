/**
 * Word to PDF Converter
 *
 * Uses @matbee/libreoffice-converter/browser for client-side conversion.
 * Uses the browser-compatible API that works without Node.js modules.
 *
 * Features:
 * - Browser-compatible conversion
 * - High-quality LibreOffice-based conversion
 * - Preserves formatting, images, and layout
 * - Single file and batch conversion support
 * - Automatic ZIP creation for multiple files
 */

import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import { BrowserConverter, createWasmPaths } from '@matbee/libreoffice-converter/browser';

const WORD_EXTENSION_REGEX = /\.(doc|docx)$/i;

// Use local path for WASM files
const WASM_BASE_PATH = '/libreoffice-wasm/';

// Global singleton to prevent multiple instances
let converterInstance: BrowserConverter | null = null;
let isInitializing = false;

function toPdfFileName(name: string): string {
  return name.replace(WORD_EXTENSION_REGEX, '') + '.pdf';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

async function getConverter(): Promise<BrowserConverter> {
  // Return existing instance if available
  if (converterInstance) {
    return converterInstance;
  }

  // Wait if already initializing
  while (isInitializing) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (converterInstance) {
      return converterInstance;
    }
  }

  try {
    isInitializing = true;

    const wasmPaths = createWasmPaths(WASM_BASE_PATH);
    converterInstance = new BrowserConverter({
      ...wasmPaths,
      onProgress: (progress: any) => {
        const message = progress.message || 'Loading...';
        showLoader(message);
      },
    });

    await converterInstance.initialize();

    return converterInstance;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize LibreOffice:`, error);
    converterInstance = null;

    // Provide helpful error message
    if (errorMsg.includes('SharedArrayBuffer') || errorMsg.includes('crossOriginIsolated')) {
      throw new Error(
        'Cross-Origin Isolation not enabled. Please restart the dev server to apply security headers.'
      );
    }

    throw new Error(`Failed to load LibreOffice: ${errorMsg}`);
  } finally {
    isInitializing = false;
  }
}

async function convertWordToPdf(file: File): Promise<Blob> {
  // Get or create converter instance
  const converter = await getConverter();

  // Read file as ArrayBuffer
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const uint8Array = new Uint8Array(arrayBuffer);

  // Convert using BrowserConverter
  const result = await converter.convertFile(file, { outputFormat: 'pdf' });

  // Convert result to Blob
  const pdfBlob = new Blob([result.data], { type: 'application/pdf' });
  return pdfBlob;
}

export async function wordToPdf(filesOverride?: File[]) {
  const files = filesOverride && filesOverride.length > 0 ? filesOverride : getFiles();

  if (files.length === 0) {
    showAlert('No Files', 'Please select at least one Word file.');
    return;
  }

  const hasUnsupportedFile = files.some((file) => !WORD_EXTENSION_REGEX.test(file.name));
  if (hasUnsupportedFile) {
    showAlert('Invalid File Type', 'Please upload only .doc or .docx files.', 'error');
    return;
  }

  try {
    if (files.length === 1) {
      const file = files[0];
      showLoader(`Converting ${file.name}...`);

      const pdfBlob = await convertWordToPdf(file);
      downloadFile(pdfBlob, toPdfFileName(file.name));

      hideLoader();
      showAlert('Conversion Complete', `Successfully converted ${file.name} to PDF.`, 'success');
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      showLoader(`Converting ${index + 1}/${files.length}: ${file.name}...`);

      const pdfBlob = await convertWordToPdf(file);
      const pdfBuffer = await pdfBlob.arrayBuffer();
      zip.file(toPdfFileName(file.name), pdfBuffer);
    }

    showLoader('Preparing ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    downloadFile(zipBlob, 'word-converted.zip');
    hideLoader();
    showAlert(
      'Conversion Complete',
      `Successfully converted ${files.length} Word file(s) to PDF.`,
      'success'
    );
  } catch (error) {
    hideLoader();
    showAlert(
      'Error',
      `An error occurred during conversion. Error: ${getErrorMessage(error)}`,
      'error'
    );
  }
}

export async function setupWordToPdfTool() {
  const container = document.getElementById('word-to-pdf-container');
  if (!container) return;

  container.classList.remove('hidden');

  const convertBtn = document.getElementById('word-to-pdf-process-btn');
  if (convertBtn) {
    convertBtn.onclick = () => {
      void wordToPdf();
    };
  }
}
