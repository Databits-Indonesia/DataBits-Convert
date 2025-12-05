import { showLoader, hideLoader, showAlert } from '../ui';
import { downloadFile, getPDFDocument } from '../utils/helpers';
import { state } from '../state';
import JSZip from 'jszip';

import { PDFDocument as PDFLibDocument } from 'pdf-lib';

async function renderPagePreviews(arrayBuffer: ArrayBuffer) {
  const container = document.querySelector('#extract-pages-preview > div');
  if (!container) return;

  container.innerHTML = '';

  try {
    const pdf = await getPDFDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context!, viewport, canvas }).promise;

      const wrapper = document.createElement('div');
      wrapper.className = 'page-thumbnail relative';
      wrapper.dataset.pageNumber = String(pageNum);

      const innerDiv = document.createElement('div');
      innerDiv.className = 'relative border-2 border-gray-600 rounded-lg p-2 transition-colors';

      const img = document.createElement('img');
      img.src = canvas.toDataURL();
      img.className = 'rounded-md w-full h-auto';

      const pageLabel = document.createElement('div');
      pageLabel.className =
        'absolute top-1 left-1 bg-gray-800 text-white text-xs px-2 py-1 rounded-md font-semibold';
      pageLabel.textContent = String(pageNum);

      innerDiv.append(img, pageLabel);

      const p = document.createElement('p');
      p.className = 'text-center text-xs mt-1 text-gray-300';
      p.textContent = `Page ${pageNum}`;

      wrapper.append(innerDiv, p);
      container.appendChild(wrapper);
    }
  } catch (error) {
    console.error('Error rendering page previews:', error);
  }
}

export async function setupExtractPagesTool() {
  // Show the extract pages tool container
  document.getElementById('extract-pages-tool-container')?.classList.remove('hidden');

  // Load the PDF document into state if not already loaded
  if (!state.pdfDoc && state.files.length > 0) {
    try {
      const { showLoader, hideLoader } = await import('../ui');
      const { readFileAsArrayBuffer } = await import('../utils/helpers');
      const { setPdfDoc } = await import('../state');

      showLoader('Loading PDF...');
      const file = state.files[0];
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);

      // Also render page previews
      await renderPagePreviews(arrayBuffer);

      hideLoader();
    } catch (error) {
      const { hideLoader, showAlert } = await import('../ui');
      hideLoader();
      showAlert('Error', 'Failed to load PDF document.');
      console.error('Error loading PDF:', error);
      return;
    }
  } else if (state.pdfDoc) {
    // PDF already loaded, just render previews
    try {
      const { readFileAsArrayBuffer } = await import('../utils/helpers');
      const file = state.files[0];
      const arrayBuffer = await readFileAsArrayBuffer(file);
      await renderPagePreviews(arrayBuffer);
    } catch (error) {
      console.error('Error rendering previews:', error);
    }
  }

  const input = document.getElementById('pages-to-extract') as HTMLInputElement;
  if (!input) return;

  const updateHighlights = () => {
    const val = input.value;
    const pagesToExtract = new Set<number>();
    const totalPages = state.pdfDoc?.getPageCount() || 0;

    const parts = val.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pagesToExtract.add(i);
          }
        }
      } else {
        const num = Number(trimmed);
        if (!isNaN(num) && num >= 1 && num <= totalPages) pagesToExtract.add(num);
      }
    }

    const thumbnails = document.querySelectorAll('#extract-pages-preview .page-thumbnail');
    thumbnails.forEach((thumb) => {
      const pageNum = parseInt((thumb as HTMLElement).dataset.pageNumber || '0');
      const innerContainer = thumb.querySelector('div.relative');

      if (pagesToExtract.has(pageNum)) {
        innerContainer?.classList.add('border-green-500');
        innerContainer?.classList.remove('border-gray-600');
      } else {
        innerContainer?.classList.remove('border-green-500');
        innerContainer?.classList.add('border-gray-600');
      }
    });
  };

  input.addEventListener('input', updateHighlights);
  updateHighlights();
}

export async function extractPages() {
  // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
  const pageInput = document.getElementById('pages-to-extract').value;
  if (!pageInput.trim()) {
    showAlert('Invalid Input', 'Please enter page numbers to extract.');
    return;
  }
  showLoader('Extracting pages...');
  try {
    const totalPages = state.pdfDoc.getPageCount();
    const indicesToExtract = new Set();
    const ranges = pageInput.split(',');

    for (const range of ranges) {
      const trimmedRange = range.trim();
      if (trimmedRange.includes('-')) {
        const [start, end] = trimmedRange.split('-').map(Number);
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) continue;
        for (let i = start; i <= end; i++) indicesToExtract.add(i - 1);
      } else {
        const pageNum = Number(trimmedRange);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) continue;
        indicesToExtract.add(pageNum - 1);
      }
    }

    if (indicesToExtract.size === 0) {
      showAlert('Invalid Input', 'No valid pages selected for extraction.');
      hideLoader();
      return;
    }

    const zip = new JSZip();
    // @ts-expect-error TS(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
    const sortedIndices = Array.from(indicesToExtract).sort((a, b) => a - b);

    for (const index of sortedIndices) {
      const newPdf = await PDFLibDocument.create();
      const [copiedPage] = await newPdf.copyPages(state.pdfDoc, [index as number]);
      newPdf.addPage(copiedPage);
      const newPdfBytes = await newPdf.save();
      // @ts-expect-error TS(2365) FIXME: Operator '+' cannot be applied to types 'unknown' ... Remove this comment to see the full error message
      zip.file(`page-${index + 1}.pdf`, newPdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, 'extracted-pages.zip');
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Could not extract pages.');
  } finally {
    hideLoader();
  }
}
