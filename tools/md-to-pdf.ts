import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { getFiles } from '../state';
import jsPDF from 'jspdf';

/**
 * Main function to convert Markdown files to PDF
 */
export async function mdToPdf() {
  const files = getFiles();

  // If no files in state, prompt user to select Markdown files
  if (files.length === 0) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.md,.markdown,text/markdown';

    const filePromise = new Promise<FileList | null>((resolve) => {
      input.onchange = () => resolve(input.files);
      input.oncancel = () => resolve(null);
    });

    input.click();

    const selectedFiles = await filePromise;
    if (!selectedFiles || selectedFiles.length === 0) {
      showAlert('No Files', 'Please select at least one Markdown file.', 'info');
      return;
    }

    // Validate Markdown files
    const mdFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.type === 'text/markdown' ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.markdown')
    );

    if (mdFiles.length === 0) {
      showAlert('Invalid Files', 'Please select Markdown files only.', 'error');
      return;
    }

    if (mdFiles.length < selectedFiles.length) {
      showAlert(
        'Invalid Files',
        `Only ${mdFiles.length} of ${selectedFiles.length} files were Markdown files.`,
        'warning'
      );
    }

    // Process the valid files
    files.length = 0;
    files.push(...mdFiles);
  }

  showLoader('Converting Markdown to PDF...');

  try {
    console.log('[MD2PDF] Starting conversion...');
    console.log('[MD2PDF] Number of files:', files.length);

    // Import marked for Markdown parsing
    const { marked } = await import('marked');

    if (files.length === 1) {
      // Single file conversion
      const originalFile = files[0];
      console.log('[MD2PDF] Converting single file:', originalFile.name);

      const text = await originalFile.text();

      if (!text.trim()) {
        throw new Error('Markdown file is empty');
      }

      // Parse markdown to HTML
      const htmlContent = await marked.parse(text);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add icon and title
      const title = originalFile.name.replace(/\.(md|markdown)$/i, '');

      // Add document icon (using text symbol)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('[MD]', 14, 15);

      // Add title (filename without extension)
      pdf.setTextColor(0, 0, 0); // Reset to black
      pdf.text(title, 34, 15);

      // Render HTML to PDF
      await renderHTMLToPDF(pdf, htmlContent, 25);

      const pdfBlob = pdf.output('blob');
      const fileName = originalFile.name.replace(/\.(md|markdown)$/i, '') + '.pdf';
      downloadFile(pdfBlob, fileName);

      console.log('[MD2PDF] File downloaded:', fileName);

      showAlert(
        'Conversion Complete',
        `Successfully converted ${originalFile.name} to PDF.`,
        'success'
      );
    } else {
      // Multiple files conversion - create a ZIP
      console.log('[MD2PDF] Converting multiple files:', files.length);
      showLoader('Preparing conversion...');

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        showLoader(`Converting ${i + 1}/${files.length}: ${file.name}...`);
        console.log(`[MD2PDF] Converting file ${i + 1}/${files.length}:`, file.name);

        try {
          const text = await file.text();

          if (!text.trim()) {
            console.warn(`[MD2PDF] Skipping empty file: ${file.name}`);
            continue;
          }

          // Parse markdown to HTML
          const htmlContent = await marked.parse(text);

          // Create PDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          // Add icon and title
          const title = file.name.replace(/\.(md|markdown)$/i, '');

          // Add document icon (using text symbol)
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(59, 130, 246); // Blue color
          pdf.text('[MD]', 14, 15);

          // Add title (filename without extension)
          pdf.setTextColor(0, 0, 0); // Reset to black
          pdf.text(title, 34, 15);

          // Render HTML to PDF
          await renderHTMLToPDF(pdf, htmlContent, 25);

          const pdfBlob = pdf.output('blob');
          console.log(`[MD2PDF] Converted ${file.name}, PDF size:`, pdfBlob.size);

          const baseName = file.name.replace(/\.(md|markdown)$/i, '');
          const pdfBuffer = await pdfBlob.arrayBuffer();
          zip.file(`${baseName}.pdf`, pdfBuffer);
        } catch (e) {
          console.error(`[MD2PDF] Error converting ${file.name}:`, e);
        }
      }

      console.log('[MD2PDF] Generating ZIP file...');
      showLoader('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('[MD2PDF] ZIP size:', zipBlob.size);

      downloadFile(zipBlob, 'markdown-converted.zip');

      showAlert(
        'Conversion Complete',
        `Successfully converted ${files.length} Markdown file(s) to PDF.`,
        'success'
      );
    }
  } catch (e: any) {
    console.error('[MD2PDF] ERROR:', e);
    showAlert('Error', `An error occurred during conversion. Error: ${e.message}`);
  } finally {
    hideLoader();
  }
}

/**
 * Render HTML content to PDF with basic formatting
 */
async function renderHTMLToPDF(pdf: jsPDF, htmlContent: string, startY: number) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = startY;

  // Process each element
  const elements = tempDiv.children;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const tagName = element.tagName.toLowerCase();

    // Check if we need a new page
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }

    switch (tagName) {
      case 'h1':
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        y += 8;
        break;
      case 'h2':
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        y += 6;
        break;
      case 'h3':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        y += 5;
        break;
      case 'h4':
      case 'h5':
      case 'h6':
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        y += 4;
        break;
      case 'p':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        break;
      case 'ul':
      case 'ol':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        // Process list items
        const listItems = element.children;
        for (let j = 0; j < listItems.length; j++) {
          const li = listItems[j];
          const bullet = tagName === 'ul' ? '•' : `${j + 1}.`;
          const text = li.textContent || '';
          const lines = pdf.splitTextToSize(`${bullet} ${text}`, maxWidth - 5);

          for (const line of lines) {
            if (y > pageHeight - 20) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin + 5, y);
            y += 5;
          }
          y += 2;
        }
        continue;
      case 'pre':
      case 'code':
        pdf.setFontSize(9);
        pdf.setFont('courier', 'normal');
        pdf.setFillColor(245, 245, 245);
        break;
      case 'blockquote':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        break;
      default:
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
    }

    // Get text content
    const text = element.textContent || '';
    if (text.trim()) {
      const lines = pdf.splitTextToSize(text, maxWidth);

      for (const line of lines) {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 5;
      }
    }

    // Reset formatting
    pdf.setTextColor(0, 0, 0);

    // Add spacing after element
    y += tagName.startsWith('h') ? 6 : 4;
  }
}
