import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { state } from '../state';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

/**
 * Excel to CSV conversion tool
 * Converts Excel files (.xlsx, .xls, .xlsm, .xlsb) to CSV format using SheetJS.
 *
 * Behaviour:
 * - Single file + single sheet  → downloads a single <filename>.csv
 * - Single file + multiple sheets → downloads a ZIP with one CSV per sheet
 * - Multiple files               → downloads a ZIP with one CSV per sheet per file
 */
export async function excelToCsv() {
  try {
    const filesToConvert = state.files;

    if (!filesToConvert || filesToConvert.length === 0) {
      showAlert('No Files', 'Please upload Excel files first.');
      return;
    }

    // Read the "Double Quote Wrap" option from the UI, defaulting to true
    const forceQuotes =
      typeof document !== 'undefined'
        ? (document.getElementById('excel-to-csv-double-quote') as HTMLInputElement)?.checked !==
          false
        : true;

    // Validate that every uploaded file is a recognised Excel format
    for (const file of filesToConvert) {
      if (!file.name.match(/\.(xlsx|xls|xlsm|xlsb|ods)$/i)) {
        showAlert(
          'Invalid File',
          `${file.name} is not a valid Excel file. Supported formats: .xlsx, .xls, .xlsm, .xlsb, .ods`
        );
        return;
      }
    }

    showLoader('Converting Excel to CSV...');

    if (filesToConvert.length === 1) {
      // ── Single file ──────────────────────────────────────────────────────────
      const file = filesToConvert[0];
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

      const baseName = file.name.replace(/\.(xlsx|xls|xlsm|xlsb|ods)$/i, '');

      if (workbook.SheetNames.length === 1) {
        // Single sheet → single CSV download
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet, { forceQuotes });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFile(blob, `${baseName}.csv`);

        hideLoader();
        showAlert('Success', `"${file.name}" converted to CSV successfully.`, 'success');
      } else {
        // Multiple sheets → ZIP of CSVs
        showLoader('Preparing multiple sheets...');
        const zip = new JSZip();

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const csvContent = XLSX.utils.sheet_to_csv(worksheet, { forceQuotes });
          // Sanitise sheet name for use as a filename
          const safeName = sheetName.replace(/[\\/:*?"<>|]/g, '_');
          zip.file(`${baseName}_${safeName}.csv`, csvContent);
        }

        showLoader('Creating ZIP archive...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, `${baseName}_csv.zip`);

        hideLoader();
        showAlert(
          'Success',
          `Converted ${workbook.SheetNames.length} sheets from "${file.name}" to CSV.`,
          'success'
        );
      }
    } else {
      // ── Multiple files → always a ZIP ────────────────────────────────────────
      const zip = new JSZip();

      for (let i = 0; i < filesToConvert.length; i++) {
        const file = filesToConvert[i];
        showLoader(`Converting ${i + 1}/${filesToConvert.length}: ${file.name}...`);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
          const baseName = file.name.replace(/\.(xlsx|xls|xlsm|xlsb|ods)$/i, '');

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const csvContent = XLSX.utils.sheet_to_csv(worksheet, { forceQuotes });
            const safeName = sheetName.replace(/[\\/:*?"<>|]/g, '_');

            // Use a sub-folder per Excel file when there are multiple files
            const csvFileName =
              workbook.SheetNames.length === 1
                ? `${baseName}.csv`
                : `${baseName}/${safeName}.csv`;

            zip.file(csvFileName, csvContent);
          }
        } catch (e) {
          console.error(`[Excel2CSV] Error converting ${file.name}:`, e);
        }
      }

      showLoader('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'excel-to-csv.zip');

      hideLoader();
      showAlert(
        'Success',
        `Successfully converted ${filesToConvert.length} Excel file(s) to CSV.`,
        'success'
      );
    }
  } catch (e: any) {
    console.error('[Excel2CSV] ERROR:', e);
    showAlert('Error', `An error occurred during conversion. Error: ${e.message}`);
  } finally {
    hideLoader();
  }
}
