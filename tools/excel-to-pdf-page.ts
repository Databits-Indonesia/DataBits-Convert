import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { state } from '../state';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Excel to PDF conversion tool
 * Converts Excel files (.xlsx, .xls) to PDF format
 */
export async function excelToPdf() {
  try {
    // Get files from state
    const filesToConvert = state.files;
    
    if (!filesToConvert || filesToConvert.length === 0) {
      showAlert('No Files', 'Please upload Excel files first.');
      return;
    }

    // Validate files
    for (const file of filesToConvert) {
      if (!file.name.match(/\.(xlsx|xls|xlsm|xlsb)$/i)) {
        showAlert('Invalid File', `${file.name} is not a valid Excel file.`);
        return;
      }
    }

    showLoader('Converting Excel to PDF...');

    if (filesToConvert.length === 1) {
      // Single file conversion
      const file = filesToConvert[0];
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      let isFirstSheet = true;

      // Convert each sheet
      for (const sheetName of workbook.SheetNames) {
        if (!isFirstSheet) {
          pdf.addPage();
        }
        isFirstSheet = false;

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) continue;

        // Add sheet title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246); // Blue color
        pdf.text('[XLS]', 14, 15);
        pdf.setTextColor(0, 0, 0);
        pdf.text(sheetName, 30, 15);

        // Add table
        const headers = jsonData[0] || [];
        const body = jsonData.slice(1);

        autoTable(pdf, {
          head: [headers],
          body: body,
          startY: 22,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { top: 22, left: 14, right: 14 },
        });
      }

      // Download PDF
      const pdfBlob = pdf.output('blob');
      const pdfFileName = file.name.replace(/\.(xlsx|xls|xlsm|xlsb)$/i, '.pdf');
      downloadFile(pdfBlob, pdfFileName);

      hideLoader();
      showAlert(
        'Success',
        'Excel file successfully converted to PDF.',
        'success'
      );
    } else {
      // Multiple files conversion - create ZIP
      const zip = new JSZip();

      for (const file of filesToConvert) {
        showLoader(`Converting ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        let isFirstSheet = true;

        // Convert each sheet
        for (const sheetName of workbook.SheetNames) {
          if (!isFirstSheet) {
            pdf.addPage();
          }
          isFirstSheet = false;

          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length === 0) continue;

          // Add sheet title
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(59, 130, 246); // Blue color
          pdf.text('[XLS]', 14, 15);
          pdf.setTextColor(0, 0, 0);
          pdf.text(sheetName, 30, 15);

          // Add table
          const headers = jsonData[0] || [];
          const body = jsonData.slice(1);

          (pdf as any).autoTable({
            head: [headers],
            body: body,
            startY: 22,
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: 22, left: 14, right: 14 },
          });
        }

        // Add to ZIP
        const pdfBlob = pdf.output('blob');
        const pdfFileName = file.name.replace(/\.(xlsx|xls|xlsm|xlsb)$/i, '.pdf');
        zip.file(pdfFileName, pdfBlob);
      }

      // Download ZIP
      showLoader('Creating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'excel-converted.zip');

      hideLoader();
      showAlert(
        'Success',
        `Successfully converted ${filesToConvert.length} Excel file(s) to PDF.`,
        'success'
      );
    }
  } catch (e: any) {
    console.error('[Excel2PDF] ERROR:', e);
    showAlert('Error', `An error occurred during conversion. Error: ${e.message}`);
  } finally {
    hideLoader();
  }
}
