import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

export async function epubToPdf() {
  const files = getFiles();
  
  if (files.length === 0) {
    showAlert('No Files', 'Please select at least one EPUB file.');
    return;
  }

  try {
    showLoader('Converting EPUB to PDF...');

    // Import EPub.js library
    const ePub = (await import('epubjs')).default;

    if (files.length === 1) {
      // Single file conversion
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse EPUB
      const book = ePub(arrayBuffer);
      await book.ready;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let firstPage = true;

      // Get all sections
      const spine = await book.loaded.spine;
      
      for (const item of spine.items) {
        const doc = await book.load(item.href);
        const content = doc.body ? doc.body.textContent : '';
        
        if (content) {
          if (!firstPage) {
            pdf.addPage();
          }
          firstPage = false;

          // Add content to PDF with word wrap
          const lines = pdf.splitTextToSize(content, 180);
          pdf.text(lines, 15, 20);
        }
      }

      const pdfBlob = pdf.output('blob');
      const fileName = file.name.replace(/\.epub$/i, '.pdf');
      downloadFile(pdfBlob, fileName);

      hideLoader();
      showAlert('Success', `${file.name} converted successfully!`, 'success');
    } else {
      // Multiple files - create ZIP
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        showLoader(`Converting ${i + 1}/${files.length}: ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);
        await book.ready;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        let firstPage = true;
        const spine = await book.loaded.spine;

        for (const item of spine.items) {
          const doc = await book.load(item.href);
          const content = doc.body ? doc.body.textContent : '';
          
          if (content) {
            if (!firstPage) {
              pdf.addPage();
            }
            firstPage = false;

            const lines = pdf.splitTextToSize(content, 180);
            pdf.text(lines, 15, 20);
          }
        }

        const pdfBlob = pdf.output('blob');
        const pdfBuffer = await pdfBlob.arrayBuffer();
        const fileName = file.name.replace(/\.epub$/i, '.pdf');
        zip.file(fileName, pdfBuffer);
      }

      showLoader('Creating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'epub-converted.zip');

      hideLoader();
      showAlert('Success', `${files.length} EPUB files converted successfully!`, 'success');
    }
  } catch (error: any) {
    console.error('[EPUB2PDF] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during conversion. ${error.message}`);
  }
}
