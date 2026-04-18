import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToZip() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Creating ZIP archive...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const extractionType =
      (document.getElementById('pdf-to-zip-type') as HTMLSelectElement)?.value || 'images';
    const imageFormat =
      (document.getElementById('pdf-to-zip-format') as HTMLSelectElement)?.value || 'png';
    const dpi = parseFloat(
      (document.getElementById('pdf-to-zip-dpi') as HTMLSelectElement)?.value || '150'
    );

    const zip = new JSZip();
    const scale = dpi / 72;

    if (extractionType === 'images') {
      // Extract pages as images
      for (let i = 1; i <= pdf.numPages; i++) {
        showLoader(`Extracting page ${i} of ${pdf.numPages}...`);

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

        // Convert to blob based on format
        const blob = await new Promise<Blob | null>((resolve) => {
          if (imageFormat === 'jpg') {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
          } else {
            canvas.toBlob(resolve, 'image/png');
          }
        });

        if (blob) {
          const extension = imageFormat === 'jpg' ? '.jpg' : '.png';
          zip.file(`page_${i}${extension}`, blob);
        }
      }
    } else if (extractionType === 'text') {
      // Extract pages as text files
      for (let i = 1; i <= pdf.numPages; i++) {
        showLoader(`Extracting page ${i} of ${pdf.numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        zip.file(`page_${i}.txt`, pageText);
      }
    } else {
      // Both images and text
      for (let i = 1; i <= pdf.numPages; i++) {
        showLoader(`Extracting page ${i} of ${pdf.numPages}...`);

        const page = await pdf.getPage(i);

        // Extract image
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          const blob = await new Promise<Blob | null>((resolve) => {
            if (imageFormat === 'jpg') {
              canvas.toBlob(resolve, 'image/jpeg', 0.95);
            } else {
              canvas.toBlob(resolve, 'image/png');
            }
          });

          if (blob) {
            const extension = imageFormat === 'jpg' ? '.jpg' : '.png';
            zip.file(`page_${i}${extension}`, blob);
          }
        }

        // Extract text
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        zip.file(`page_${i}.txt`, pageText);
      }
    }

    showLoader('Creating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const fileName = file.name.replace(/\.pdf$/i, '_extracted.zip');

    downloadFile(zipBlob, fileName);

    hideLoader();
    showAlert('Success', 'PDF contents extracted to ZIP successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2ZIP] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during extraction. ${error.message}`);
  }
}
