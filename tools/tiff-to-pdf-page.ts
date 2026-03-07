import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { decode } from 'tiff';

/**
 * Convert TIFF to PNG using tiff.js decoder and canvas
 */
async function tiffToPng(file: File): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const tiffImages = decode(arrayBuffer);
      
      if (!tiffImages || tiffImages.length === 0) {
        reject(new Error('No images found in TIFF file'));
        return;
      }

      // Use the first image in the TIFF
      const tiffImage = tiffImages[0];
      const canvas = document.createElement('canvas');
      canvas.width = tiffImage.width;
      canvas.height = tiffImage.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Create ImageData from TIFF data
      const imageData = ctx.createImageData(tiffImage.width, tiffImage.height);
      imageData.data.set(tiffImage.data);
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    } catch (e) {
      reject(e);
    }
  });
}

export async function tiffToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select TIFF files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.tiff,.tif,image/tiff';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one TIFF file.', 'info');
      return;
    }

    // Validate TIFF files
    const tiffFiles = Array.from(selectedFiles).filter(
      (file) => 
        file.type === 'image/tiff' ||
        file.type === 'image/tif' ||
        file.name.toLowerCase().endsWith('.tiff') ||
        file.name.toLowerCase().endsWith('.tif')
    );

    if (tiffFiles.length === 0) {
      showAlert('Invalid Files', 'Please select TIFF image files only.', 'error');
      return;
    }

    if (tiffFiles.length < selectedFiles.length) {
      showAlert('Invalid Files', `Only ${tiffFiles.length} of ${selectedFiles.length} files were TIFF images.`, 'warning');
    }

    // Process the valid files
    files.length = 0;
    files.push(...tiffFiles);
  }

  showLoader('Converting TIFF images to PDF...');

  try {
    const pdfDoc = await PDFLibDocument.create();

    for (const file of files) {
      try {
        // Convert TIFF to PNG
        const pngBlob = await tiffToPng(file);
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
      } catch (e) {
        console.error(`Failed to process ${file.name}:`, e);
        showAlert('Error', `Failed to process ${file.name}. Skipping...`, 'warning');
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('No valid TIFF images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'tiffs-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${files.length} TIFF image(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from TIFF images.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
