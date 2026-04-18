import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

/**
 * Convert SVG to PNG using canvas
 */
async function svgToPng(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };

      // Create blob URL from SVG text
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export async function svgToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select SVG files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.svg,image/svg+xml';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one SVG file.', 'info');
      return;
    }

    // Validate SVG files
    const svgFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
    );

    if (svgFiles.length === 0) {
      showAlert('Invalid Files', 'Please select SVG image files only.', 'error');
      return;
    }

    if (svgFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${svgFiles.length} of ${selectedFiles.length} files were SVG images.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...svgFiles);
  }

  showLoader('Converting SVG images to PDF...');

  try {
    const pdfDoc = await PDFLibDocument.create();

    for (const file of files) {
      try {
        // Convert SVG to PNG
        const pngBlob = await svgToPng(file);
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
      throw new Error('No valid SVG images could be processed. Please check your files.');
    }

    const pdfBytes = await pdfDoc.save();
    downloadFile(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      'svgs-to-pdf.pdf'
    );

    showAlert('Success', `Successfully converted ${files.length} SVG image(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from SVG images.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
