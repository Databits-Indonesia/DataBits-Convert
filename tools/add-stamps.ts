import { showLoader, hideLoader, showAlert } from '../components/ui';
import { getFiles } from '../state';
import { readFileAsArrayBuffer, downloadFile } from '../utils/helpers';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

type StampType = 'approved' | 'confidential' | 'draft' | 'final' | 'reviewed' | 'void' | 'custom';

interface StampOptions {
  type: StampType;
  customText?: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  pages: 'all' | 'first' | 'last' | string; // string for custom range like "1,3,5" or "1-5"
  opacity: number;
  fontSize: number;
  color: { r: number; g: number; b: number };
}

const stampTemplates: Record<
  StampType,
  { text: string; color: { r: number; g: number; b: number } }
> = {
  approved: { text: 'APPROVED', color: { r: 0.0, g: 0.5, b: 0.0 } },
  confidential: { text: 'CONFIDENTIAL', color: { r: 0.8, g: 0.0, b: 0.0 } },
  draft: { text: 'DRAFT', color: { r: 0.5, g: 0.5, b: 0.5 } },
  final: { text: 'FINAL', color: { r: 0.0, g: 0.0, b: 0.8 } },
  reviewed: { text: 'REVIEWED', color: { r: 0.4, g: 0.0, b: 0.6 } },
  void: { text: 'VOID', color: { r: 0.7, g: 0.0, b: 0.0 } },
  custom: { text: 'CUSTOM', color: { r: 0.0, g: 0.0, b: 0.0 } },
};

function parsePageRange(range: string, totalPages: number): number[] {
  const pages: number[] = [];

  if (range === 'all') {
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
  } else if (range === 'first') {
    pages.push(0);
  } else if (range === 'last') {
    pages.push(totalPages - 1);
  } else {
    // Parse custom range like "1,3,5" or "1-5"
    const parts = range.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((s) => parseInt(s.trim(), 10));
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= totalPages) {
            pages.push(i - 1); // Convert to 0-based index
          }
        }
      } else {
        const pageNum = parseInt(part.trim(), 10);
        if (pageNum > 0 && pageNum <= totalPages) {
          pages.push(pageNum - 1); // Convert to 0-based index
        }
      }
    }
  }

  return [...new Set(pages)]; // Remove duplicates
}

function getStampPosition(
  position: StampOptions['position'],
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number
): { x: number; y: number; rotation: number } {
  const margin = 50;

  switch (position) {
    case 'top-right':
      return {
        x: pageWidth - textWidth - margin,
        y: pageHeight - textHeight - margin,
        rotation: 0,
      };
    case 'top-left':
      return {
        x: margin,
        y: pageHeight - textHeight - margin,
        rotation: 0,
      };
    case 'bottom-right':
      return {
        x: pageWidth - textWidth - margin,
        y: margin,
        rotation: 0,
      };
    case 'bottom-left':
      return {
        x: margin,
        y: margin,
        rotation: 0,
      };
    case 'center':
      return {
        x: (pageWidth - textWidth) / 2,
        y: (pageHeight - textHeight) / 2,
        rotation: -45, // Diagonal for center stamps
      };
    default:
      return {
        x: pageWidth - textWidth - margin,
        y: pageHeight - textHeight - margin,
        rotation: 0,
      };
  }
}

export async function addStampsToPdf() {
  const files = getFiles();

  if (files.length === 0) {
    showAlert('No File', 'Please upload a PDF file first.');
    return;
  }

  showLoader('Adding stamps to PDF...');

  try {
    // Get stamp options from UI
    const stampTypeSelect = document.getElementById('stamp-type') as HTMLSelectElement;
    const customTextInput = document.getElementById('stamp-custom-text') as HTMLInputElement;
    const positionSelect = document.getElementById('stamp-position') as HTMLSelectElement;
    const pagesSelect = document.getElementById('stamp-pages') as HTMLSelectElement;
    const customPagesInput = document.getElementById('stamp-custom-pages') as HTMLInputElement;
    const opacityInput = document.getElementById('stamp-opacity') as HTMLInputElement;
    const fontSizeInput = document.getElementById('stamp-font-size') as HTMLInputElement;
    const colorInput = document.getElementById('stamp-color') as HTMLInputElement;

    const stampType = (stampTypeSelect?.value || 'approved') as StampType;
    const customText = customTextInput?.value || '';
    const position = (positionSelect?.value || 'top-right') as StampOptions['position'];
    const pagesValue = pagesSelect?.value || 'all';
    const customPages = customPagesInput?.value || '';
    const opacity = parseFloat(opacityInput?.value || '0.5');
    const fontSize = parseInt(fontSizeInput?.value || '36', 10);
    const colorHex = colorInput?.value || '#FF0000';

    // Parse color from hex
    const colorRgb = {
      r: parseInt(colorHex.slice(1, 3), 16) / 255,
      g: parseInt(colorHex.slice(3, 5), 16) / 255,
      b: parseInt(colorHex.slice(5, 7), 16) / 255,
    };

    const options: StampOptions = {
      type: stampType,
      customText: stampType === 'custom' ? customText : undefined,
      position,
      pages: pagesValue === 'custom' ? customPages : pagesValue,
      opacity,
      fontSize,
      color: colorRgb,
    };

    // Validate custom text
    if (stampType === 'custom' && !customText.trim()) {
      hideLoader();
      showAlert('Invalid Input', 'Please enter custom stamp text.');
      return;
    }

    // Validate custom pages
    if (pagesValue === 'custom' && !customPages.trim()) {
      hideLoader();
      showAlert('Invalid Input', 'Please enter page numbers (e.g., 1,3,5 or 1-5).');
      return;
    }

    const file = files[0];
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Load PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Get stamp text and color
    const template = stampTemplates[stampType];
    const stampText = stampType === 'custom' ? customText : template.text;
    const stampColor = stampType === 'custom' ? options.color : template.color;

    // Parse which pages to stamp
    const pagesToStamp = parsePageRange(options.pages, totalPages);

    if (pagesToStamp.length === 0) {
      hideLoader();
      showAlert('Invalid Pages', 'No valid pages found to stamp.');
      return;
    }

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add stamp to each selected page
    for (const pageIndex of pagesToStamp) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Measure text
      const textWidth = font.widthOfTextAtSize(stampText, fontSize);
      const textHeight = fontSize;

      // Get position
      const { x, y, rotation } = getStampPosition(
        options.position,
        width,
        height,
        textWidth,
        textHeight
      );

      // Draw stamp
      page.drawText(stampText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(stampColor.r, stampColor.g, stampColor.b),
        opacity: options.opacity,
        rotate: degrees(rotation),
      });
    }

    // Save stamped PDF
    const stampedPdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(stampedPdfBytes)], { type: 'application/pdf' });

    const originalName = file.name.replace(/\.pdf$/i, '');
    const stampedName = `${originalName}_stamped.pdf`;

    downloadFile(blob, stampedName);

    hideLoader();
    showAlert(
      'Success',
      `Stamp added successfully to ${pagesToStamp.length} page${pagesToStamp.length > 1 ? 's' : ''}!`,
      'success'
    );
  } catch (error: any) {
    console.error('[AddStamps] Error:', error);
    hideLoader();
    showAlert('Error', `Failed to add stamps: ${error.message}`);
  }
}
