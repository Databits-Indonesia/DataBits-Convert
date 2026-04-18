import { PDFDocument } from 'pdf-lib';

export async function loadPdfDocument(pdfBytes: Uint8Array | ArrayBuffer): Promise<PDFDocument> {
  const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  return PDFDocument.load(bytes);
}
