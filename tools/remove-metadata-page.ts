import { showAlert } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { PDFDocument, PDFName } from 'pdf-lib';
import { icons, createIcons } from 'lucide';

export interface RemoveMetadataOptions {
  removeDocumentInfo?: boolean;
  removeXmpMetadata?: boolean;
  removePieceInfo?: boolean;
  removeDocumentIds?: boolean;
}

function removeMetadataFromDoc(pdfDoc: PDFDocument, options: RemoveMetadataOptions = {}) {
  const {
    removeDocumentInfo = true,
    removeXmpMetadata = true,
    removePieceInfo = true,
    removeDocumentIds = true
  } = options;

  if (removeDocumentInfo) {
    const infoDict = (pdfDoc as any).getInfoDict();
    const allKeys = infoDict.keys();
    allKeys.forEach((key: any) => {
      infoDict.delete(key);
    });

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
  }

  if (removeXmpMetadata) {
    try {
      const catalogDict = (pdfDoc.catalog as any).dict;
      if (catalogDict.has(PDFName.of('Metadata'))) {
        catalogDict.delete(PDFName.of('Metadata'));
      }
    } catch (e: any) {
      console.warn('Could not remove XMP metadata:', e.message);
    }
  }

  if (removeDocumentIds) {
    try {
      const context = pdfDoc.context;
      if ((context as any).trailerInfo) {
        delete (context as any).trailerInfo.ID;
      }
    } catch (e: any) {
      console.warn('Could not remove document IDs:', e.message);
    }
  }

  if (removePieceInfo) {
    try {
      const catalogDict = (pdfDoc.catalog as any).dict;
      if (catalogDict.has(PDFName.of('PieceInfo'))) {
        catalogDict.delete(PDFName.of('PieceInfo'));
      }
    } catch (e: any) {
      console.warn('Could not remove PieceInfo:', e.message);
    }
  }
}

export async function removeMetadataPdf(file: File, options: RemoveMetadataOptions = {}): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    removeMetadataFromDoc(pdfDoc, options);

    const newPdfBytes = await pdfDoc.save();
    return new Blob([newPdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error: any) {
    console.error('Remove metadata error:', error);
    throw error;
  }
}

export function setupRemoveMetadataPage() {
  const container = document.getElementById('remove-metadata-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>Remove PDF Metadata</strong>
          <p>Remove all metadata and hidden information from your PDF files.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="file-text"></i> Metadata Removal Options</h3>
        
        <div class="space-y-3">
          <label class="checkbox-label">
            <input type="checkbox" id="remove-document-info" checked>
            <span>Remove Document Information</span>
          </label>
          <small class="text-sm text-gray-600 ml-6 block -mt-1">Title, Author, Subject, Keywords, Creator, Producer</small>
          
          <label class="checkbox-label">
            <input type="checkbox" id="remove-xmp-metadata" checked>
            <span>Remove XMP Metadata</span>
          </label>
          <small class="text-sm text-gray-600 ml-6 block -mt-1">Extended metadata streams and custom properties</small>
          
          <label class="checkbox-label">
            <input type="checkbox" id="remove-piece-info" checked>
            <span>Remove Private Application Data</span>
          </label>
          <small class="text-sm text-gray-600 ml-6 block -mt-1">PieceInfo and application-specific data</small>
          
          <label class="checkbox-label">
            <input type="checkbox" id="remove-document-ids" checked>
            <span>Remove Document IDs</span>
          </label>
          <small class="text-sm text-gray-600 ml-6 block -mt-1">Unique identifiers for tracking</small>
        </div>
        
        <div class="alert alert-warning mt-4">
          <i data-lucide="alert-triangle"></i>
          <p class="text-sm">This will permanently remove selected metadata from the PDF. This action cannot be undone.</p>
        </div>
      </div>

      <div class="action-buttons">
        <button id="remove-metadata-btn" class="btn btn-primary">
          <i data-lucide="eraser"></i>
          Remove Metadata
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
