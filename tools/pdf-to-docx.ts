/**
 * PDF to DOCX Converter
 *
 * Uses PyMuPDF WASM for high-quality PDF to Word conversion.
 * Preserves text, formatting, images, and layout.
 */

import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { loadPyMuPDF } from '../utils/pymupdf-loader';

const PDF_EXTENSION_REGEX = /\.pdf$/i;

function toDocxFileName(name: string): string {
  return name.replace(PDF_EXTENSION_REGEX, '') + '.docx';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

async function convertPdfToDocx(file: File): Promise<Blob> {
  const pymupdf = await loadPyMuPDF();
  const docxBlob = await pymupdf.pdfToDocx(file);
  return docxBlob;
}

export async function pdfToDocx(filesOverride?: File[]) {
  const files = filesOverride && filesOverride.length > 0 ? filesOverride : getFiles();

  if (files.length === 0) {
    showAlert('No Files', 'Please select at least one PDF file.');
    return;
  }

  const hasUnsupportedFile = files.some((file) => !PDF_EXTENSION_REGEX.test(file.name));
  if (hasUnsupportedFile) {
    showAlert('Invalid File Type', 'Please upload only PDF files.', 'error');
    return;
  }

  try {
    showLoader('Loading PDF to DOCX converter...');

    if (files.length === 1) {
      const file = files[0];
      showLoader(`Converting ${file.name}...`);

      const docxBlob = await convertPdfToDocx(file);
      downloadFile(docxBlob, toDocxFileName(file.name));

      hideLoader();
      showAlert('Conversion Complete', `Successfully converted ${file.name} to DOCX.`, 'success');
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      showLoader(`Converting ${index + 1}/${files.length}: ${file.name}...`);

      const docxBlob = await convertPdfToDocx(file);
      const docxBuffer = await docxBlob.arrayBuffer();
      zip.file(toDocxFileName(file.name), docxBuffer);
    }

    showLoader('Preparing ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    downloadFile(zipBlob, 'pdf-converted.zip');
    hideLoader();
    showAlert(
      'Conversion Complete',
      `Successfully converted ${files.length} PDF file(s) to DOCX.`,
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

export async function setupPdfToDocxTool() {
  const container = document.getElementById('pdf-to-word-container');
  if (!container) return;

  container.classList.remove('hidden');

  const convertBtn = document.getElementById('pdf-to-word-process-btn');
  if (convertBtn) {
    convertBtn.onclick = () => {
      void pdfToDocx();
    };
  }
}
