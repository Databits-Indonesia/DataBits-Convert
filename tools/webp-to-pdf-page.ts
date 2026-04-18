import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function webpToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select WebP files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/webp,.webp';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one WebP file.', 'info');
      return;
    }

    // Validate WebP files
    const webpFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')
    );

    if (webpFiles.length === 0) {
      showAlert('Invalid Files', 'Please select WebP image files only.', 'error');
      return;
    }

    if (webpFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${webpFiles.length} of ${selectedFiles.length} files were WebP images.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...webpFiles);
  }

  showLoader('Converting WebP images to PDF...');

  try {
    const pdfDoc = await PDFLibDocument.create();

    for (const file of files) {
      try {
        // Create an image bitmap from the file
        const imageBitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(imageBitmap, 0, 0);

        // Convert to PNG for PDF embedding
        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create PNG blob'));
          }, 'image/png');
        });

        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

        // Embed the PNG image in the PDF
        const image = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });

        imageBitmap.close();
      } catch (e) {
        console.error(`Failed to process ${file.name}:`, e);
        showAlert('Error', `Failed to process ${file.name}. Skipping...`, 'warning');
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('No valid WebP images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'webps-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${files.length} WebP image(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from WebP images.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
