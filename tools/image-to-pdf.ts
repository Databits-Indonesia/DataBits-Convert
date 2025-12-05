import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { state } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function imageToPdf() {
  // If no files in state, prompt user to select image files
  if (state.files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const files = await filePromise;
    if (!files || files.length === 0) {
      showAlert('No Files', 'Please select at least one image file.', 'info');
      return;
    }

    // Add files to state
    state.files = Array.from(files);
  }

  showLoader('Converting images to PDF...');

  try {
    const pdfDoc = await PDFLibDocument.create();

    for (const file of state.files) {
      try {
        // Create an image bitmap from the file
        const imageBitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0);

        // Convert to JPEG for better compression
        const jpegBlob = await new Promise<Blob>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.9)
        );
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

        // Embed the image in the PDF
        const image = await pdfDoc.embedJpg(jpegBytes);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });

        imageBitmap.close();
      } catch (e) {
        console.warn(`Failed to process ${file.name}:`, e);
        // Try PNG fallback
        try {
          const imageBitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          canvas.width = imageBitmap.width;
          canvas.height = imageBitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0);

          const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, 'image/png'));
          const pngBytes = await pngBlob.arrayBuffer();
          const pngImage = await pdfDoc.embedPng(pngBytes);
          const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
          page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: pngImage.width,
            height: pngImage.height,
          });
          imageBitmap.close();
        } catch (e2) {
          console.error(`Failed to process ${file.name} with both JPEG and PNG:`, e2);
        }
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('No valid images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'images-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${state.files.length} image(s) to PDF!`);
  } catch (e) {
    console.error(e);
    showAlert('Error', e.message || 'Failed to create PDF from images.');
  } finally {
    hideLoader();
  }
}
