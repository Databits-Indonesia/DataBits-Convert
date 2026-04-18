import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers';
import { getFiles } from '../state';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function pdfToMarkdown() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Converting PDF to Markdown...');

  try {
    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const includePageNumbers =
      (document.getElementById('pdf-to-markdown-page-numbers') as HTMLInputElement)?.checked ||
      false;
    const includeTitle =
      (document.getElementById('pdf-to-markdown-title') as HTMLInputElement)?.checked || false;
    const headingStyle =
      (document.getElementById('pdf-to-markdown-headings') as HTMLSelectElement)?.value || 'auto';

    let markdown = '';

    // Add document title if requested
    if (includeTitle) {
      const fileName = file.name.replace(/\.pdf$/i, '');
      markdown += `# ${fileName}\n\n`;
    }

    for (let i = 1; i <= pdf.numPages; i++) {
      showLoader(`Processing page ${i} of ${pdf.numPages}...`);

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Add page number heading if requested
      if (includePageNumbers) {
        markdown += `## Page ${i}\n\n`;
      }

      // Extract text with basic formatting
      const textItems = textContent.items as any[];
      let currentLine = '';
      let previousY = 0;
      let previousFontSize = 0;

      textItems.forEach((item, index) => {
        const text = item.str;
        const y = item.transform[5];
        const fontSize = item.height || 12;

        // Detect line breaks (when Y position changes significantly)
        const isNewLine = index > 0 && Math.abs(y - previousY) > 5;

        if (isNewLine && currentLine.trim()) {
          // Apply heading detection based on font size
          if (headingStyle === 'auto' && fontSize > previousFontSize * 1.2) {
            markdown += `### ${currentLine.trim()}\n\n`;
          } else {
            markdown += `${currentLine.trim()}\n\n`;
          }
          currentLine = '';
        }

        currentLine += text + (item.hasEOL ? '' : ' ');
        previousY = y;
        previousFontSize = fontSize;
      });

      // Add remaining text
      if (currentLine.trim()) {
        markdown += `${currentLine.trim()}\n\n`;
      }

      // Add page separator if not the last page
      if (i < pdf.numPages && !includePageNumbers) {
        markdown += '---\n\n';
      }
    }

    showLoader('Creating Markdown file...');
    const fileName = file.name.replace(/\.pdf$/i, '.md');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

    downloadFile(blob, fileName);

    hideLoader();
    showAlert('Success', 'PDF converted to Markdown successfully!', 'success');
  } catch (error: any) {
    console.error('[PDF2Markdown] Error:', error);
    hideLoader();
    showAlert('Error', `An error occurred during conversion. ${error.message}`);
  }
}
