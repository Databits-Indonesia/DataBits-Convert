import { showAlert } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument, PDFName, PDFString } from 'pdf-lib';

export interface EditMetadataOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  customFields?: Record<string, string>;
}

export async function editMetadataPdf(file: File, options: EditMetadataOptions): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLibDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false
    });

    // Set standard metadata fields
    if (options.title !== undefined) pdfDoc.setTitle(options.title);
    if (options.author !== undefined) pdfDoc.setAuthor(options.author);
    if (options.subject !== undefined) pdfDoc.setSubject(options.subject);
    if (options.creator !== undefined) pdfDoc.setCreator(options.creator);
    if (options.producer !== undefined) pdfDoc.setProducer(options.producer);
    
    if (options.keywords !== undefined) {
      pdfDoc.setKeywords(options.keywords);
    }
    
    if (options.creationDate) {
      pdfDoc.setCreationDate(options.creationDate);
    }
    
    if (options.modificationDate) {
      pdfDoc.setModificationDate(options.modificationDate);
    } else {
      pdfDoc.setModificationDate(new Date());
    }

    // Handle custom fields
    if (options.customFields && Object.keys(options.customFields).length > 0) {
      // @ts-expect-error getInfoDict is private but accessible at runtime
      const infoDict = pdfDoc.getInfoDict();
      const standardKeys = new Set([
        'Title', 'Author', 'Subject', 'Keywords', 'Creator',
        'Producer', 'CreationDate', 'ModDate'
      ]);

      // Remove existing custom keys
      const allKeys = infoDict
        .keys()
        .map((key: { asString: () => string }) => key.asString().substring(1));

      allKeys.forEach((key: string) => {
        if (!standardKeys.has(key)) {
          infoDict.delete(PDFName.of(key));
        }
      });

      // Add new custom fields
      Object.entries(options.customFields).forEach(([key, value]) => {
        if (key && value) {
          infoDict.set(PDFName.of(key), PDFString.of(value));
        }
      });
    }

    const newPdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' });
  } catch (error: any) {
    console.error('Edit metadata error:', error);
    throw error;
  }
}

export async function getMetadataPdf(file: File): Promise<EditMetadataOptions> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLibDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false
    });

    const metadata: EditMetadataOptions = {
      title: pdfDoc.getTitle() || '',
      author: pdfDoc.getAuthor() || '',
      subject: pdfDoc.getSubject() || '',
      keywords: pdfDoc.getKeywords() ? [pdfDoc.getKeywords()] : [],
      creator: pdfDoc.getCreator() || '',
      producer: pdfDoc.getProducer() || '',
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
      customFields: {}
    };

    // Extract custom fields
    try {
      // @ts-expect-error getInfoDict is private but accessible at runtime
      const infoDict = pdfDoc.getInfoDict();
      const standardKeys = new Set([
        'Title', 'Author', 'Subject', 'Keywords', 'Creator',
        'Producer', 'CreationDate', 'ModDate'
      ]);

      const allKeys = infoDict
        .keys()
        .map((key: { asString: () => string }) => key.asString().substring(1));

      allKeys.forEach((key: string) => {
        if (!standardKeys.has(key)) {
          const rawValue = infoDict.lookup(PDFName.of(key));
          let displayValue = '';

          if (rawValue && typeof rawValue.decodeText === 'function') {
            displayValue = rawValue.decodeText();
          } else if (rawValue && typeof rawValue.asString === 'function') {
            displayValue = rawValue.asString();
          } else if (rawValue) {
            displayValue = String(rawValue);
          }

          if (metadata.customFields && displayValue) {
            metadata.customFields[key] = displayValue;
          }
        }
      });
    } catch (e) {
      console.warn('Could not read custom metadata fields:', e);
    }

    return metadata;
  } catch (error: any) {
    console.error('Get metadata error:', error);
    throw error;
  }
}

export function setupEditMetadataPage() {
  const container = document.getElementById('edit-metadata-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>Edit PDF Metadata</strong>
          <p>Modify document properties and custom metadata fields for your PDF files.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="edit"></i> Document Information</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label for="edit-meta-title">Title</label>
            <input type="text" id="edit-meta-title" placeholder="Document title">
          </div>
          
          <div class="form-group">
            <label for="edit-meta-author">Author</label>
            <input type="text" id="edit-meta-author" placeholder="Author name">
          </div>
          
          <div class="form-group">
            <label for="edit-meta-subject">Subject</label>
            <input type="text" id="edit-meta-subject" placeholder="Document subject">
          </div>
          
          <div class="form-group">
            <label for="edit-meta-keywords">Keywords</label>
            <input type="text" id="edit-meta-keywords" placeholder="keyword1, keyword2, keyword3">
            <small>Separate keywords with commas</small>
          </div>
          
          <div class="form-group">
            <label for="edit-meta-creator">Creator</label>
            <input type="text" id="edit-meta-creator" placeholder="Creating application">
          </div>
          
          <div class="form-group">
            <label for="edit-meta-producer">Producer</label>
            <input type="text" id="edit-meta-producer" placeholder="PDF producer">
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button id="edit-metadata-btn" class="btn btn-primary">
          <i data-lucide="save"></i>
          Update Metadata
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
