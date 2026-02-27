import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

interface TextLine {
  text: string;
  fontSize: number;
  isLikelyHeading: boolean;
}

async function extractStructuredTextFromPDF(file: File): Promise<TextLine[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: TextLine[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group items by Y position (same line)
      const itemsByLine: Map<number, any[]> = new Map();

      textContent.items.forEach((item: any) => {
        if (!item.str || item.str.trim().length === 0) return;

        const y = Math.round(item.transform[5]); // Round Y position
        if (!itemsByLine.has(y)) {
          itemsByLine.set(y, []);
        }
        itemsByLine.get(y)!.push(item);
      });

      // Convert grouped items to lines
      const sortedYPositions = Array.from(itemsByLine.keys()).sort((a, b) => b - a);

      for (const y of sortedYPositions) {
        const items = itemsByLine.get(y)!;

        // Sort items by X position (left to right)
        items.sort((a, b) => a.transform[4] - b.transform[4]);

        // Combine text with proper spacing
        let lineText = '';
        items.forEach((item, idx) => {
          if (idx > 0) {
            const prevItem = items[idx - 1];
            const gap = item.transform[4] - (prevItem.transform[4] + prevItem.width);
            if (gap > 2) lineText += ' '; // Add space if gap exists
          }
          lineText += item.str;
        });

        // Detect headings (font size > 14 or short lines with larger text)
        const avgFontSize = items.reduce((sum, item) => sum + item.height, 0) / items.length;
        const isShortLine = lineText.trim().length < 100;
        const isLargeFont = avgFontSize > 14;
        const isLikelyHeading = (isLargeFont && isShortLine) || avgFontSize > 18;

        allLines.push({
          text: lineText.trim(),
          fontSize: avgFontSize,
          isLikelyHeading,
        });
      }

      // Add page break between pages (except last page)
      if (pageNum < pdf.numPages) {
        allLines.push({
          text: '',
          fontSize: 0,
          isLikelyHeading: false,
        });
      }
    } catch (error) {
      console.warn(`Failed to process page ${pageNum}:`, error);
    }
  }

  return allLines;
}

async function convertPdfToDocx(file: File): Promise<Blob> {
  showLoader(`Extracting text from ${file.name}...`);
  const lines = await extractStructuredTextFromPDF(file);

  showLoader(`Creating Word document...`);

  // Group lines into paragraphs
  const paragraphs: Paragraph[] = [];
  let currentParagraphLines: string[] = [];
  let lastFontSize = 12;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNewPage = line.text === ''; // Page break

    if (isNewPage) {
      // Finalize current paragraph
      if (currentParagraphLines.length > 0) {
        const paragraphText = currentParagraphLines.join(' ').trim();
        if (paragraphText) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraphText,
                  size: 24, // 12pt
                }),
              ],
              spacing: {
                after: 200,
              },
            })
          );
        }
        currentParagraphLines = [];
      }
    } else if (line.isLikelyHeading) {
      // Finalize current paragraph
      if (currentParagraphLines.length > 0) {
        const paragraphText = currentParagraphLines.join(' ').trim();
        if (paragraphText) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraphText,
                  size: 24, // 12pt
                }),
              ],
              spacing: {
                after: 200,
              },
            })
          );
        }
        currentParagraphLines = [];
      }

      // Add heading
      const headingSize = Math.min(Math.round(line.fontSize * 2), 48); // Cap at 24pt
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.text,
              size: headingSize,
              bold: true,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 240,
            after: 120,
          },
        })
      );
    } else {
      currentParagraphLines.push(line.text);
    }

    lastFontSize = line.fontSize;
  }

  // Finalize last paragraph
  if (currentParagraphLines.length > 0) {
    const paragraphText = currentParagraphLines.join(' ').trim();
    if (paragraphText) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraphText,
              size: 24, // 12pt
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children:
          paragraphs.length > 0
            ? paragraphs
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'No text content found in PDF.',
                      size: 24,
                    }),
                  ],
                }),
              ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export async function pdfToWord() {
  try {
    const files = getFiles();

    if (files.length === 0) {
      showAlert('No Files', 'Please select at least one PDF file.');
      return;
    }

    if (files.length === 1) {
      const file = files[0];
      showLoader(`Converting ${file.name}...`);

      const docxBlob = await convertPdfToDocx(file);
      const outName = file.name.replace(/\.pdf$/i, '') + '.docx';

      downloadFile(docxBlob, outName);
      hideLoader();

      showAlert(
        'Conversion Complete',
        `Successfully converted ${file.name} to Word document.`,
        'success'
      );
    } else {
      showLoader('Converting multiple PDFs...');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        showLoader(`Converting ${i + 1}/${files.length}: ${file.name}...`);

        const docxBlob = await convertPdfToDocx(file);
        const baseName = file.name.replace(/\.pdf$/i, '');
        const arrayBuffer = await docxBlob.arrayBuffer();
        zip.file(`${baseName}.docx`, arrayBuffer);
      }

      showLoader('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      downloadFile(zipBlob, 'converted-documents.zip');
      hideLoader();

      showAlert(
        'Conversion Complete',
        `Successfully converted ${files.length} PDF(s) to Word documents.`,
        'success'
      );
    }
  } catch (e: any) {
    hideLoader();
    showAlert('Error', `An error occurred during conversion. Error: ${e.message}`);
  }
}

export async function setupPdfToWordTool() {
  const container = document.getElementById('pdf-to-word-container');
  if (!container) return;

  container.classList.remove('hidden');

  const convertBtn = document.getElementById('convert-pdf-to-word-btn');
  if (convertBtn) {
    convertBtn.onclick = () => pdfToWord();
  }
}
