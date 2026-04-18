import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function pngToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select PNG files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/png,.png';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one PNG file.', 'info');
      return;
    }

    // Validate PNG files
    const pngFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
    );

    if (pngFiles.length === 0) {
      showAlert('Invalid Files', 'Please select PNG image files only.', 'error');
      return;
    }

    if (pngFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${pngFiles.length} of ${selectedFiles.length} files were PNG images.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...pngFiles);
  }

  showLoader('Converting PNG images to PDF...');

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

        // Convert to PNG
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
      throw new Error('No valid PNG images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'pngs-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${files.length} PNG image(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from PNG images.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
