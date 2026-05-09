import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToJson() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to JSON...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const includeMetadata =
      (document.getElementById('pdf-to-json-metadata') as HTMLInputElement)?.checked || false;
    const formatOption =
      (document.getElementById('pdf-to-json-format') as HTMLSelectElement)?.value || 'structured';

    const jsonData: any = {
      document: {
        title: file.name,
        pageCount: pdf.numPages,
      },
      pages: [],
    };

    // Add metadata if requested
    if (includeMetadata) {
      const metadata = await pdf.getMetadata();
      jsonData.document.metadata = {
        info: metadata.info,
        metadata: metadata.metadata,
      };
    }

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Processing page ${i} of ${pdf.numPages}...`);

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      const pageData: any = {
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
      };

      if (formatOption === 'structured') {
        // Structured format with items
        pageData.items = textContent.items.map((item: any) => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
          fontName: item.fontName,
        }));
      } else if (formatOption === 'simple') {
        // Simple format - just text
        pageData.text = textContent.items.map((item: any) => item.str).join(' ');
      } else {
        // Full format - complete text content with all properties
        pageData.textContent = textContent.items.map((item: any) => ({
          str: item.str,
          dir: item.dir,
          width: item.width,
          height: item.height,
          transform: item.transform,
          fontName: item.fontName,
          hasEOL: item.hasEOL,
        }));
      }

      jsonData.pages.push(pageData);
    }

    showLoader('Creating JSON file...');
    const indent = (document.getElementById('pdf-to-json-indent') as HTMLInputElement)?.checked
      ? 2
      : 0;
    const jsonString = JSON.stringify(jsonData, null, indent);
    const fileName = file.name.replace(/\.pdf$/i, '.json');
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

    downloadFile(blob, fileName);

    hideLoader();
    showAlert('Success', 'PDF converted to JSON successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2JSON] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during conversion. ${error.message}`);
  }
}
