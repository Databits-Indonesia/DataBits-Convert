import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import heic2any from 'heic2any';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function heicToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select HEIC files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.heic,.heif,image/heic,image/heif';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one HEIC/HEIF file.', 'info');
      return;
    }

    // Validate HEIC/HEIF files
    const heicFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif') ||
        file.type === 'image/heic' ||
        file.type === 'image/heif'
    );

    if (heicFiles.length === 0) {
      showAlert('Invalid Files', 'Please select HEIC/HEIF image files only.', 'error');
      return;
    }

    if (heicFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${heicFiles.length} of ${selectedFiles.length} files were HEIC/HEIF images.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...heicFiles);
  }

  showLoader('Converting HEIC images to PDF...');

  try {
    const pdfDoc = await PDFLibDocument.create();

    for (const file of files) {
      try {
        // Convert HEIC to PNG using heic2any
        const conversionResult = await heic2any({
          blob: file,
          toType: 'image/png',
          quality: 0.92,
        });

        const pngBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;

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
      throw new Error('No valid HEIC images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'heics-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${files.length} HEIC image(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from HEIC images.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
