import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToExcel() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to Excel...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const workbook = XLSX.utils.book_new();
    const oneSheetPerPage =
      (document.getElementById('pdf-to-excel-one-sheet') as HTMLInputElement)?.checked || false;

    if (oneSheetPerPage) {
      // Create one sheet per page
      for (let i = 1; i <= pdf.numPages; i++) {
        showLoader(`Processing page ${i} of ${pdf.numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items
        const textItems = textContent.items.map((item: any) => item.str);

        // Create simple rows (split by line breaks or chunks)
        const rows: string[][] = [];
        let currentRow: string[] = [];

        textItems.forEach((text: string) => {
          if (text.trim()) {
            currentRow.push(text);
            // Create new row after certain number of items or if text seems like end of line
            if (currentRow.length >= 5) {
              rows.push([...currentRow]);
              currentRow = [];
            }
          }
        });

        if (currentRow.length > 0) {
          rows.push(currentRow);
        }

        // If no structured data, put all text in one column
        if (rows.length === 0) {
          rows.push([textItems.join(' ')]);
        }

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${i}`);
      }
    } else {
      // Create single sheet with all text
      const allRows: string[][] = [['Page', 'Content']];

      for (let i = 1; i <= pdf.numPages; i++) {
        showLoader(`Processing page ${i} of ${pdf.numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items.map((item: any) => item.str).join(' ');

        allRows.push([`${i}`, pageText]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(allRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Content');
    }

    showLoader('Creating Excel file...');
    const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileName = file.name.replace(/\.pdf$/i, '.xlsx');
    const blob = new Blob([xlsxData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    downloadFile(blob, fileName);

    hideLoader();
    showAlert('Success', 'PDF converted to Excel successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2Excel] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during conversion. ${error.message}`);
  }
}
