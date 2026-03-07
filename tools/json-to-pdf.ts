import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import jsPDF from 'jspdf';

/**
 * Main function to convert JSON files to PDF
 */
export async function jsonToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select JSON files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json,application/json';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one JSON file.', 'info');
      return;
    }

    // Validate JSON files
    const jsonFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
    );

    if (jsonFiles.length === 0) {
      showAlert('Invalid Files', 'Please select JSON files only.', 'error');
      return;
    }

    if (jsonFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${jsonFiles.length} of ${selectedFiles.length} files were JSON files.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...jsonFiles);
  }

  showLoader('Converting JSON to PDF...');

  try {
    console.log('[JSON2PDF] Starting conversion...');
    console.log('[JSON2PDF] Number of files:', files.length);

    if (files.length === 1) {
      // Single file conversion
      const originalFile = files[0];
      console.log('[JSON2PDF] Converting single file:', originalFile.name);

      const text = await originalFile.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(originalFile.name, 14, 15);

      // Format and add JSON content
      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      
      const formattedJson = JSON.stringify(jsonData, null, 2);
      const lines = formattedJson.split('\n');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const maxWidth = pageWidth - (margin * 2);
      const lineHeight = 5;
      let y = 25;

      for (const line of lines) {
        // Split long lines to fit page width
        const wrappedLines = pdf.splitTextToSize(line, maxWidth);
        
        for (const wrappedLine of wrappedLines) {
          // Check if we need a new page
          if (y + lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          
          pdf.text(wrappedLine, margin, y);
          y += lineHeight;
        }
      }

      const pdfBlob = pdf.output('blob');
      const fileName = originalFile.name.replace(/\.json$/i, '') + '.pdf';
      downloadFile(pdfBlob, fileName);

      console.log('[JSON2PDF] File downloaded:', fileName);

      showAlert(
        'Conversion Complete',
        `Successfully converted ${originalFile.name} to PDF.`,
        'success'
      );
    } else {
      // Multiple files conversion - create a ZIP
      console.log('[JSON2PDF] Converting multiple files:', files.length);
      showLoader('Preparing conversion...');

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        showLoader(`Converting ${i + 1}/${files.length}: ${file.name}...`);
        console.log(`[JSON2PDF] Converting file ${i + 1}/${files.length}:`, file.name);

        try {
          const text = await file.text();
          let jsonData;
          
          try {
            jsonData = JSON.parse(text);
          } catch (e) {
            console.warn(`[JSON2PDF] Skipping invalid JSON file: ${file.name}`);
            continue;
          }

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          // Add title
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(file.name, 14, 15);

          // Format and add JSON content
          pdf.setFontSize(10);
          pdf.setFont('courier', 'normal');
          
          const formattedJson = JSON.stringify(jsonData, null, 2);
          const lines = formattedJson.split('\n');
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 14;
          const maxWidth = pageWidth - (margin * 2);
          const lineHeight = 5;
          let y = 25;

          for (const line of lines) {
            // Split long lines to fit page width
            const wrappedLines = pdf.splitTextToSize(line, maxWidth);
            
            for (const wrappedLine of wrappedLines) {
              // Check if we need a new page
              if (y + lineHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
              }
              
              pdf.text(wrappedLine, margin, y);
              y += lineHeight;
            }
          }

          const pdfBlob = pdf.output('blob');
          console.log(`[JSON2PDF] Converted ${file.name}, PDF size:`, pdfBlob.size);

          const baseName = file.name.replace(/\.json$/i, '');
          const pdfBuffer = await pdfBlob.arrayBuffer();
          zip.file(`${baseName}.pdf`, pdfBuffer);
        } catch (e) {
          console.error(`[JSON2PDF] Error converting ${file.name}:`, e);
        }
      }

      console.log('[JSON2PDF] Generating ZIP file...');
      showLoader('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('[JSON2PDF] ZIP size:', zipBlob.size);

      downloadFile(zipBlob, 'json-converted.zip');

      showAlert(
        'Conversion Complete',
        `Successfully converted ${files.length} JSON file(s) to PDF.`,
        'success'
      );
    }
  } catch (e: any) {
    console.error('[JSON2PDF] ERROR:', e);
    showAlert('Error', `An error occurred during conversion. Error: ${e.message}`);
  } finally {
    hideLoader();
  }
}
