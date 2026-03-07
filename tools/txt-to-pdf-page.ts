import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import { jsPDF } from 'jspdf';

/**
 * Main function to convert text files to PDF
 */
export async function txtToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select text files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.txt,text/plain';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one text file.', 'info');
      return;
    }

    // Validate text files
    const textFiles = Array.from(selectedFiles).filter(
      (file) => file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')
    );

    if (textFiles.length === 0) {
      showAlert('Invalid Files', 'Please select text files (.txt) only.', 'error');
      return;
    }

    if (textFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${textFiles.length} of ${selectedFiles.length} files were text files.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...textFiles);
  }

  showLoader('Converting text files to PDF...');

  try {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // PDF settings
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 7;
    const fontSize = 12;

    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'normal');

    let isFirstPage = true;

    // Combine all text files
    for (const file of files) {
      try {
        const text = await file.text();
        
        if (!text.trim()) {
          continue;
        }

        // Add separator between files if not first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Add filename as header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(file.name, margin, margin);
        
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'normal');

        // Split text into lines
        const lines = text.split('\n');
        let y = margin + 10;

        for (const line of lines) {
          // Split long lines to fit page width
          const wrappedLines = pdf.splitTextToSize(line || ' ', maxWidth);
          
          for (const wrappedLine of wrappedLines) {
            // Check if we need a new page
            if (y + lineHeight > pageHeight - margin) {
              pdf.addPage();
              y = margin;
            }
            
            pdf.text(wrappedLine, margin, y);
            y += lineHeight;
          }
        }
      } catch (e) {
        console.error(`Failed to read ${file.name}:`, e);
        showAlert('Error', `Failed to read ${file.name}. Skipping...`, 'warning');
      }
    }

    if (pdf.getNumberOfPages() === 0) {
      throw new Error('No text content found in the selected files.');
    }

    // Save the PDF
    const pdfBlob = pdf.output('blob');
    downloadFile(pdfBlob, 'text-to-pdf.pdf');

    showAlert('Success', `Successfully converted ${files.length} text file(s) to PDF!`, 'success');
  } catch (e) {
    console.error(e);
    const errorMsg = e instanceof Error ? e.message : 'Failed to create PDF from text files.';
    showAlert('Error', errorMsg, 'error');
  } finally {
    hideLoader();
  }
}
