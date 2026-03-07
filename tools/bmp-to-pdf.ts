import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function bmpToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select BMP files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/bmp,.bmp';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one BMP file.', 'info');
      return;
    }

    // Validate BMP files
    const bmpFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'image/bmp' || file.name.toLowerCase().endsWith('.bmp')
    );

    if (bmpFiles.length === 0) {
      showAlert('Invalid Files', 'Please select BMP image files only.', 'error');
      return;
    }

    if (bmpFiles.length < selectedFiles.length) {
      showAlert('Invalid Files', `Only ${bmpFiles.length} of ${selectedFiles.length} files were BMP images.`, 'warning');
    }

    // Process the valid files
    files.length = 0;
    files.push(...bmpFiles);
  }

  showLoader('Converting BMP images to PDF...');

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
      throw new Error('No valid BMP images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'bmps-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${files.length} BMP image(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from BMP images.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
