import jsPDF from 'jspdf';

export interface XmlToPdfOptions {
  onProgress?: (percent: number, message: string) => void;
}

/**
 * Convert XML file to PDF
 */
export async function convertXmlToPdf(file: File, options: XmlToPdfOptions = {}): Promise<Blob> {
  const { onProgress } = options;

  onProgress?.(0, 'Reading XML file...');

  // Read the XML file as text
  const xmlText = await file.text();

  onProgress?.(25, 'Parsing XML...');

  // For now, we'll treat XML as plain text and convert to PDF
  // In a real implementation, you might want to parse the XML and format it nicely
  const doc = new jsPDF();

  onProgress?.(50, 'Converting to PDF...');

  // Split text into lines and add to PDF
  const lines = xmlText.split('\n');
  let y = 20;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we need a new page
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    // Add line to PDF (with some basic formatting)
    doc.setFontSize(10);
    doc.text(line, 20, y);
    y += 6;

    // Update progress
    if (i % 100 === 0) {
      onProgress?.(50 + (i / lines.length) * 40, 'Converting to PDF...');
    }
  }

  onProgress?.(90, 'Finalizing PDF...');

  // Return PDF as blob
  const pdfBlob = doc.output('blob');

  onProgress?.(100, 'Conversion complete');

  return pdfBlob;
}
