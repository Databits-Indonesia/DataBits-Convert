import { showAlert } from '../ui';
import { downloadFile } from '../utils/helpers';
import { PDFDocument, PDFName } from 'pdf-lib';
import { createIcons, icons } from 'lucide';

export interface RemoveAnnotationsOptions {
  removeComments?: boolean;
  removeHighlights?: boolean;
  removeAllAnnotations?: boolean;
}

export async function removeAnnotationsPdf(file: File, options: RemoveAnnotationsOptions = {}): Promise<Blob> {
  const {
    removeAllAnnotations = true
  } = options;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false
    });

    const pages = pdfDoc.getPages();
    let annotationsRemoved = 0;

    // Remove all annotations from all pages
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      try {
        const annotRefs = page.node.Annots()?.asArray() || [];
        if (annotRefs.length > 0) {
          annotationsRemoved += annotRefs.length;
          page.node.delete(PDFName.of('Annots'));
        }
      } catch (e) {
        console.warn(`Could not remove annotations from page ${i + 1}:`, e);
      }
    }

    if (annotationsRemoved === 0) {
      throw new Error('No annotations found in this PDF.');
    }

    const newPdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' });
  } catch (error: any) {
    console.error('Remove annotations error:', error);
    throw error;
  }
}

export function setupRemoveAnnotationsPage() {
  const container = document.getElementById('remove-annotations-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>Remove PDF Annotations</strong>
          <p>Remove all annotations, comments, highlights, and markups from your PDF files.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="message-square-x"></i> What Will Be Removed</h3>
        
        <div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>This tool will remove all types of annotations including:</p>
          <ul class="ml-6 space-y-1">
            <li>• Text comments and notes</li>
            <li>• Highlights and underlines</li>
            <li>• Stamps and signatures</li>
            <li>• Drawing markups (lines, shapes, freehand)</li>
            <li>• Sticky notes and callouts</li>
            <li>• All other annotation types</li>
          </ul>
        </div>
        
        <div class="alert alert-warning mt-4">
          <i data-lucide="alert-triangle"></i>
          <div>
            <p class="text-sm"><strong>Warning:</strong> This action cannot be undone. All annotations will be permanently removed from the PDF.</p>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button id="remove-annotations-btn" class="btn btn-primary">
          <i data-lucide="eraser"></i>
          Remove All Annotations
        </button>
      </div>
    </div>
  `;

  createIcons({
    icons,
    nameAttr: 'data-lucide',
    attrs: {
      'stroke-width': 2,
      width: 20,
      height: 20,
    },
  });
}
