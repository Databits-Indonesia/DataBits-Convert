import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Helper function to convert canvas to SVG (embeds PNG as data URI)
function canvasToSvg(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`;
  return svgContent;
}

export async function pdfToSvg() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to SVG...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const zip = new JSZip();

    const dpiInput = document.getElementById('pdf-to-svg-dpi') as HTMLSelectElement;
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

      // Convert canvas to SVG
      const svgContent = canvasToSvg(canvas);
      zip.file(`page_${i}.svg`, svgContent);
    }

    showLoader('Creating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const fileName = file.name.replace(/\.pdf$/i, '_images.zip');

    downloadFile(zipBlob, fileName);

    hideLoader();
    showAlert('Success', 'PDF converted to SVG images successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2SVG] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during conversion. ${error.message}`);
  }
}
