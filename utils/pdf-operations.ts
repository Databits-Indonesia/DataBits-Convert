import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function deletePdfPages(
  pdfBytes: Uint8Array,
  pagesToDelete: Set<number>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  
  // Delete pages in reverse order to avoid index shifting
  const sortedPages = Array.from(pagesToDelete).sort((a, b) => b - a);
  for (const pageIndex of sortedPages) {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      pdfDoc.removePage(pageIndex);
    }
  }
  
  return pdfDoc.save();
}

export function parsePageRange(range: string, totalPages: number): number[] {
  const pages: number[] = [];
  
  if (!range || range === 'all') {
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  const parts = range.split(',').map(p => p.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(end, totalPages); i++) {
          pages.push(i - 1); // Convert to 0-based index
        }
      }
    } else {
      const pageNum = parseInt(part.trim(), 10);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
        pages.push(pageNum - 1); // Convert to 0-based index
      }
    }
  }
  
  return [...new Set(pages)].sort((a, b) => a - b);
}

interface TextWatermarkOptions {
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  pageIndices: number[];
}

export async function addTextWatermark(
  pdfBytes: Uint8Array,
  options: TextWatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const pageIndex of options.pageIndices) {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Calculate actual position (x, y are 0-1 normalized)
      const centerX = options.x * width;
      const centerY = options.y * height;
      
      const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
      const textHeight = options.fontSize;
      
      // For rotated text, we need to offset from center accounting for rotation
      // pdf-lib rotates around the x,y point, so we offset before rotation
      const offsetX = -textWidth / 2;
      const offsetY = -textHeight / 2;
      
      // Apply rotation to the offset
      const rotRad = (options.rotation * Math.PI) / 180;
      const cosRot = Math.cos(rotRad);
      const sinRot = Math.sin(rotRad);
      
      const rotatedOffsetX = offsetX * cosRot - offsetY * sinRot;
      const rotatedOffsetY = offsetX * sinRot + offsetY * cosRot;
      
      const actualX = centerX + rotatedOffsetX;
      const actualY = centerY + rotatedOffsetY;

      page.drawText(options.text, {
        x: actualX,
        y: actualY,
        size: options.fontSize,
        font,
        color: rgb(options.color.r, options.color.g, options.color.b),
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }

  return pdfDoc.save();
}

interface ImageWatermarkOptions {
  imageBytes: Uint8Array;
  imageType: 'png' | 'jpg';
  scale: number;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  pageIndices: number[];
}

export async function addImageWatermark(
  pdfBytes: Uint8Array,
  options: ImageWatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  let embeddedImage;
  if (options.imageType === 'png') {
    embeddedImage = await pdfDoc.embedPng(options.imageBytes);
  } else {
    embeddedImage = await pdfDoc.embedJpg(options.imageBytes);
  }

  const imageDims = embeddedImage.scale(options.scale);

  for (const pageIndex of options.pageIndices) {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Calculate actual position (x, y are 0-1 normalized)
      const actualX = options.x * width - imageDims.width / 2;
      const actualY = options.y * height - imageDims.height / 2;

      page.drawImage(embeddedImage, {
        x: actualX,
        y: actualY,
        width: imageDims.width,
        height: imageDims.height,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }

  return pdfDoc.save();
}
