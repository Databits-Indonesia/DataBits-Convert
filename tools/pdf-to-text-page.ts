import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToText() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Extracting text from PDF...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const includePageNumbers =
      (document.getElementById('pdf-to-text-page-numbers') as HTMLInputElement)?.checked || false;
    const separator =
      (document.getElementById('pdf-to-text-separator') as HTMLSelectElement)?.value ||
      'double-line';

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Extracting text from page ${i} of ${pdf.numPages}...`);

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract text items and join them
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      if (includePageNumbers) {
        fullText += `\n--- Page ${i} ---\n`;
      }

      fullText += pageText;

      // Add separator between pages
      if (i < pdf.numPages) {
        switch (separator) {
          case 'single-line':
            fullText += '\n';
            break;
          case 'double-line':
            fullText += '\n\n';
            break;
          case 'page-break':
            fullText += '\n\n---\n\n';
            break;
        }
      }
    }

    showLoader('Creating text file...');
    const fileName = file.name.replace(/\.pdf$/i, '.txt');
    const textBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });

    downloadFile(textBlob, fileName);

    hideLoader();
    showAlert('Success', 'Text extracted successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2Text] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during text extraction. ${error.message}`);
  }
}
