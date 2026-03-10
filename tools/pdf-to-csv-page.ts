import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Helper function to convert rows to CSV format
function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = cell ?? '';
          // Escape cells containing commas, quotes, or newlines
          if (
            cellStr.includes(',') ||
            cellStr.includes('"') ||
            cellStr.includes('\n')
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    )
    .join('\n');
}

export async function pdfToCsv() {
  const files = getFiles();
  
  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to CSV...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const includePageNumbers = (document.getElementById('pdf-to-csv-page-numbers') as HTMLInputElement)?.checked || false;
    const separator = (document.getElementById('pdf-to-csv-separator') as HTMLSelectElement)?.value || 'comma';
    
    const rows: string[][] = [];
    
    // Add header if page numbers are included
    if (includePageNumbers) {
      rows.push(['Page', 'Content']);
    }

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Processing page ${i} of ${pdf.numPages}...`);
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items
      const textItems = textContent.items.map((item: any) => item.str);
      const pageText = textItems.join(' ');
      
      if (includePageNumbers) {
        rows.push([`${i}`, pageText]);
      } else {
        // Try to structure the text into columns (simple heuristic)
        const chunks: string[] = [];
        let currentChunk = '';
        
        textItems.forEach((text: string, idx: number) => {
          if (text.trim()) {
            currentChunk += (currentChunk ? ' ' : '') + text;
            // Create new chunk after certain length or at natural breaks
            if (currentChunk.length > 50 || idx % 10 === 9) {
              chunks.push(currentChunk);
              currentChunk = '';
            }
          }
        });
        
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        if (chunks.length > 0) {
          rows.push(chunks);
        } else {
          rows.push([pageText]);
        }
      }
    }

    showLoader('Creating CSV file...');
    let csvContent: string;
    
    // Use different separator if specified
    if (separator === 'semicolon') {
      csvContent = rows.map(row => row.map(cell => {
        const cellStr = cell ?? '';
        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';')).join('\n');
    } else if (separator === 'tab') {
      csvContent = rows.map(row => row.join('\t')).join('\n');
    } else {
      csvContent = rowsToCsv(rows);
    }
    
    const fileName = file.name.replace(/\.pdf$/i, '.csv');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    downloadFile(blob, fileName);
    
    hideLoader();
    showAlert('Success', 'PDF converted to CSV successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2CSV] Error:', error);
    hideLoader();
    showAlert(
      'Error',
      `An error occurred during conversion. ${error.message}`
    );
  }
}
