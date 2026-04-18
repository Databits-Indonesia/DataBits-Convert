import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToBmp() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to BMP...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const zip = new JSZip();

    const dpiInput = document.getElementById('pdf-to-bmp-dpi') as HTMLSelectElement;
    const dpi = dpiInput ? parseFloat(dpiInput.value) : 150;
    const scale = dpi / 72;

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Converting page ${i} of ${pdf.numPages}...`);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/bmp');
      });

      if (blob) {
        zip.file(`page_${i}.bmp`, blob);
      }
    }

    showLoader('Creating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const fileName = file.name.replace(/\.pdf$/i, '_images.zip');

    downloadFile(zipBlob, fileName);

    hideLoader();
    showAlert('Success', 'PDF converted to BMP images successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2BMP] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during conversion. ${error.message}`);
  }
}
