import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Main function to convert CSV files to PDF
 */
export async function csvToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select CSV files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.csv,text/csv';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one CSV file.', 'info');
      return;
    }

    // Validate CSV files
    const csvFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      showAlert('Invalid Files', 'Please select CSV files only.', 'error');
      return;
    }

    if (csvFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${csvFiles.length} of ${selectedFiles.length} files were CSV files.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...csvFiles);
  }

  showLoader('Converting CSV to PDF...');

  try {
    console.log('[CSV2PDF] Starting conversion...');
    console.log('[CSV2PDF] Number of files:', files.length);

    if (files.length === 1) {
      // Single file conversion
      const originalFile = files[0];
      console.log('[CSV2PDF] Converting single file:', originalFile.name);

      const text = await originalFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      const pdf = new jsPDF({
        orientation: rows[0].length > 5 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(originalFile.name, 14, 15);

      // Add table
      autoTable(pdf, {
        head: [rows[0]],
        body: rows.slice(1),
        startY: 25,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 25, left: 14, right: 14 },
      });

      const pdfBlob = pdf.output('blob');
      const fileName = originalFile.name.replace(/\.csv$/i, '') + '.pdf';
      downloadFile(pdfBlob, fileName);

      console.log('[CSV2PDF] File downloaded:', fileName);

      showAlert(
        'Conversion Complete',
        `Successfully converted ${originalFile.name} to PDF.`,
        'success'
      );
    } else {
      // Multiple files conversion - create a ZIP
      console.log('[CSV2PDF] Converting multiple files:', files.length);
      showLoader('Preparing conversion...');

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        showLoader(`Converting ${i + 1}/${files.length}: ${file.name}...`);
        console.log(`[CSV2PDF] Converting file ${i + 1}/${files.length}:`, file.name);

        try {
          const text = await file.text();
          const rows = parseCSV(text);

          if (rows.length === 0) {
            console.warn(`[CSV2PDF] Skipping empty file: ${file.name}`);
            continue;
          }

          const pdf = new jsPDF({
            orientation: rows[0].length > 5 ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          // Add title
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(file.name, 14, 15);

          // Add table
          autoTable(pdf, {
            head: [rows[0]],
            body: rows.slice(1),
            startY: 25,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 66, 66], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 25, left: 14, right: 14 },
          });

          const pdfBlob = pdf.output('blob');
          console.log(`[CSV2PDF] Converted ${file.name}, PDF size:`, pdfBlob.size);

          const baseName = file.name.replace(/\.csv$/i, '');
          const pdfBuffer = await pdfBlob.arrayBuffer();
          zip.file(`${baseName}.pdf`, pdfBuffer);
        } catch (e) {
          console.error(`[CSV2PDF] Error converting ${file.name}:`, e);
        }
      }

      console.log('[CSV2PDF] Generating ZIP file...');
      showLoader('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('[CSV2PDF] ZIP size:', zipBlob.size);

      downloadFile(zipBlob, 'csv-converted.zip');

      showAlert(
        'Conversion Complete',
        `Successfully converted ${files.length} CSV file(s) to PDF.`,
        'success'
      );
    }
  } catch (e: any) {
    console.error('[CSV2PDF] ERROR:', e);
    showAlert('Error', `An error occurred during conversion. Error: ${e.message}`);
  } finally {
    hideLoader();
  }
}

/**
 * Simple CSV parser
 */
function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter((line) => line.trim());
  const rows: string[][] = [];

  for (const line of lines) {
    // Simple CSV parsing (handles basic quoted fields)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}
