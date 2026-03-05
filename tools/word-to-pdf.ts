// NOTE: This is a work in progress and does not work correctly as of yet
import { showLoader, hideLoader, showAlert } from '../ui';
import { readFileAsArrayBuffer } from '../utils/helpers';
import { state } from '../state';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function wordToPdf() {
  const file = state.files[0];
  if (!file) {
    showAlert('No File', 'Please upload a .docx file first.');
    return;
  }

  showLoader('Preparing preview...');

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    // Get references to our modal elements from index.html
    let previewModal = document.getElementById('preview-modal');
    let previewContent = document.getElementById('preview-content');
    let downloadBtn = document.getElementById('preview-download-btn');
    let closeBtn = document.getElementById('preview-close-btn');

    // Create modal if it doesn't exist
    if (!previewModal) {
      previewModal = document.createElement('div');
      previewModal.id = 'preview-modal';
      previewModal.className =
        'hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center';

      const modalContent = document.createElement('div');
      modalContent.className = 'bg-white rounded-lg shadow-lg w-11/12 h-5/6 flex flex-col';

      const header = document.createElement('div');
      header.className = 'flex justify-between items-center p-4 border-b';
      header.innerHTML = '<h2 class="text-xl font-bold">Preview</h2>';

      previewContent = document.createElement('div');
      previewContent.id = 'preview-content';
      previewContent.className = 'flex-1 overflow-auto p-4';

      const footer = document.createElement('div');
      footer.className = 'flex justify-end gap-2 p-4 border-t';

      downloadBtn = document.createElement('button');
      downloadBtn.id = 'preview-download-btn';
      downloadBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
      downloadBtn.textContent = 'Download PDF';

      closeBtn = document.createElement('button');
      closeBtn.id = 'preview-close-btn';
      closeBtn.className = 'px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500';
      closeBtn.textContent = 'Close';

      footer.appendChild(downloadBtn);
      footer.appendChild(closeBtn);

      modalContent.appendChild(header);
      modalContent.appendChild(previewContent);
      modalContent.appendChild(footer);
      previewModal.appendChild(modalContent);
      document.body.appendChild(previewModal);
    }

    const styledHtml = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Calibri', 'Arial', sans-serif; }
                #preview-content { 
                    font-family: 'Calibri', 'Arial', sans-serif; 
                    font-size: 12pt; 
                    line-height: 1.5; 
                    color: #000; 
                    padding: 20mm;
                    width: 210mm;
                    page-break-after: always;
                }
                #preview-content h1, #preview-content h2, #preview-content h3 { 
                    margin-top: 12pt; 
                    margin-bottom: 6pt; 
                    font-weight: bold;
                }
                #preview-content p { 
                    margin-bottom: 12pt; 
                    text-align: justify;
                }
                #preview-content table { 
                    border-collapse: collapse; 
                    width: 100%; 
                    margin-bottom: 12pt;
                }
                #preview-content td, #preview-content th { 
                    border: 1px solid #000; 
                    text-align: left; 
                    padding: 6pt;
                    vertical-align: top;
                }
                #preview-content th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                #preview-content img { 
                    max-width: 100%; 
                    height: auto;
                    margin: 12pt 0;
                    display: block;
                }
                #preview-content a { 
                    color: #0563c1; 
                    text-decoration: underline;
                }
                #preview-content ul, #preview-content ol {
                    margin-left: 24pt;
                    margin-bottom: 12pt;
                }
                #preview-content li {
                    margin-bottom: 6pt;
                }
            </style>
            ${html}
        `;
    previewContent.innerHTML = styledHtml;

    const marginDiv = document.createElement('div');
    marginDiv.style.height = '100px';
    previewContent.appendChild(marginDiv);

    const images = previewContent.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        // @ts-expect-error TS(2794) FIXME: Expected 1 arguments, but got 0. Did you forget to... Remove this comment to see the full error message
        if (img.complete) resolve();
        else img.onload = resolve;
      });
    });
    await Promise.all(imagePromises);

    previewModal.classList.remove('hidden');
    hideLoader();

    const downloadHandler = async () => {
      showLoader('Generating High-Quality PDF...');

      try {
        // Create a temporary container for accurate rendering
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm'; // A4 width
        tempContainer.style.fontSize = '14px';
        tempContainer.innerHTML = previewContent.innerHTML;
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
          scale: 3, // Higher quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: tempContainer.scrollHeight,
        });

        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calculate aspect ratio and dimensions
        const ratio = canvasHeight / canvasWidth;
        let imgWidth = pageWidth;
        let imgHeight = imgWidth * ratio;

        let position = 0;

        // Add first page
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Add additional pages if needed
        while (imgHeight > pageHeight * position + pageHeight) {
          position++;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, -imgHeight + pageHeight * position, imgWidth, imgHeight);
        }

        const outputFileName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
        doc.save(outputFileName);
        hideLoader();
      } catch (e) {
        console.error('PDF generation error:', e);
        hideLoader();
        showAlert('PDF Error', `Failed to generate PDF: ${e.message}`);
      }
    };

    const closeHandler = () => {
      previewModal.classList.add('hidden');
      previewContent.innerHTML = '';
      downloadBtn.removeEventListener('click', downloadHandler);
      closeBtn.removeEventListener('click', closeHandler);
    };

    downloadBtn.addEventListener('click', downloadHandler);
    closeBtn.addEventListener('click', closeHandler);
  } catch (e) {
    console.error(e);
    hideLoader();
    showAlert(
      'Preview Error',
      `Could not generate a preview. The file may be corrupt or contain unsupported features. Error: ${e.message}`
    );
  }
}

export async function setupWordToPdfTool() {
  // Show the word-to-pdf container
  const container = document.getElementById('word-to-pdf-container');
  if (container) {
    container.classList.remove('hidden');
  }
}
