import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer, getPDFDocument } from '../utils/helpers';
import { getFiles } from '../state';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToJpg() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to JPG...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await getPDFDocument({ data: arrayBuffer }).promise;
    const zip = new JSZip();

    const qualityInput = document.getElementById('pdf-to-jpg-quality') as HTMLInputElement;
    const quality = qualityInput ? parseFloat(qualityInput.value) : 0.9;

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Converting page ${i} of ${pdf.numPages}...`);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        canvas,
        viewport: viewport,
      }).promise;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );

      if (blob) {
        zip.file(`page_${i}.jpg`, blob);
      }
    }

    showLoader('Creating ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const fileName = file.name.replace(/\.pdf$/i, '_images.zip');
    downloadFile(zipBlob, fileName);

    hideLoader();
    showAlert('Success', 'PDF converted to JPG images successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2JPG] Error:', error);
    hideLoader();
    showAlert(
      'Error',
      `An error occurred during conversion. ${error.message || 'Please try again.'}`
    );
  }
}

export function setupPdfToJpgTool() {
  const convertBtn = document.getElementById('pdf-to-jpg-convert-btn');
  const qualitySlider = document.getElementById('pdf-to-jpg-quality') as HTMLInputElement;
  const qualityValue = document.getElementById('pdf-to-jpg-quality-value');

  if (qualitySlider && qualityValue) {
    qualitySlider.addEventListener('input', () => {
      qualityValue.textContent = `${Math.round(parseFloat(qualitySlider.value) * 100)}%`;
    });
  }

  if (convertBtn) {
    convertBtn.onclick = () => pdfToJpg();
  }
}
