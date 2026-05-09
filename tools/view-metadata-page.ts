import { showAlert } from '../components/ui';
import { formatBytes } from '../utils/helpers';
import { createIcons, icons } from 'lucide';
import { PDFDocument as PDFLibDocument, PDFName } from 'pdf-lib';

export interface ViewMetadataResult {
  basicInfo: Record<string, string>;
  customFields: Record<string, string>;
  documentInfo: {
    pageCount: number;
    fileSize: number;
    pdfVersion?: string;
  };
}

function parsePdfDate(date: Date | undefined): string {
  if (!date) return 'Not set';
  try {
    return date.toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

export async function viewMetadataPdf(file: File): Promise<ViewMetadataResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLibDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });

    const basicInfo: Record<string, string> = {
      Title: pdfDoc.getTitle() || 'Not set',
      Author: pdfDoc.getAuthor() || 'Not set',
      Subject: pdfDoc.getSubject() || 'Not set',
      Keywords: pdfDoc.getKeywords() || 'Not set',
      Creator: pdfDoc.getCreator() || 'Not set',
      Producer: pdfDoc.getProducer() || 'Not set',
      'Creation Date': parsePdfDate(pdfDoc.getCreationDate()),
      'Modification Date': parsePdfDate(pdfDoc.getModificationDate()),
    };

    const customFields: Record<string, string> = {};

    // Extract custom fields
    try {
      // @ts-expect-error getInfoDict is private but accessible at runtime
      const infoDict = pdfDoc.getInfoDict();
      const standardKeys = new Set([
        'Title',
        'Author',
        'Subject',
        'Keywords',
        'Creator',
        'Producer',
        'CreationDate',
        'ModDate',
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

          if (displayValue) {
            customFields[key] = displayValue;
          }
        }
      });
    } catch (e) {
      console.warn('Could not read custom metadata fields:', e);
    }

    const documentInfo = {
      pageCount: pdfDoc.getPageCount(),
      fileSize: file.size,
    };

    return {
      basicInfo,
      customFields,
      documentInfo,
    };
  } catch (error: any) {
    console.error('View metadata error:', error);
    throw error;
  }
}

export function setupViewMetadataPage() {
  const container = document.getElementById('view-metadata-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>View PDF Metadata</strong>
          <p>View all document properties and information from your PDF files.</p>
        </div>
      </div>

      <div id="metadata-result" class="settings-panel hidden">
        <h3><i data-lucide="file-text"></i> Document Information</h3>
        <div id="metadata-basic" class="space-y-2"></div>
      </div>

      <div id="metadata-custom" class="settings-panel hidden">
        <h3><i data-lucide="tags"></i> Custom Fields</h3>
        <div id="metadata-custom-fields" class="space-y-2"></div>
      </div>

      <div id="metadata-document" class="settings-panel hidden">
        <h3><i data-lucide="info"></i> File Information</h3>
        <div id="metadata-document-info" class="space-y-2"></div>
      </div>

      <div id="metadata-empty" class="text-center py-8 text-gray-500">
        <i data-lucide="file-search" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
        <p>Upload a PDF to view its metadata</p>
      </div>

      <div class="action-buttons">
        <button id="view-metadata-btn" class="btn btn-primary">
          <i data-lucide="search"></i>
          View Metadata
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

export function displayMetadataInUI(result: ViewMetadataResult) {
  const metadataEmpty = document.getElementById('metadata-empty');
  const metadataResult = document.getElementById('metadata-result');
  const metadataCustom = document.getElementById('metadata-custom');
  const metadataDocument = document.getElementById('metadata-document');
  const metadataBasic = document.getElementById('metadata-basic');
  const metadataCustomFields = document.getElementById('metadata-custom-fields');
  const metadataDocumentInfo = document.getElementById('metadata-document-info');

  if (metadataEmpty) metadataEmpty.classList.add('hidden');
  if (metadataResult) metadataResult.classList.remove('hidden');

  // Display basic info
  if (metadataBasic) {
    metadataBasic.innerHTML = '';
    Object.entries(result.basicInfo).forEach(([key, value]) => {
      const row = document.createElement('div');
      row.className =
        'flex flex-col sm:flex-row py-2 border-b border-gray-200 dark:border-gray-700 last:border-0';
      row.innerHTML = `
        <div class="font-medium text-gray-700 dark:text-gray-300 sm:w-48 flex-shrink-0">${key}:</div>
        <div class="text-gray-900 dark:text-white break-all">${value}</div>
      `;
      metadataBasic.appendChild(row);
    });
  }

  // Display custom fields
  if (Object.keys(result.customFields).length > 0) {
    if (metadataCustom) metadataCustom.classList.remove('hidden');
    if (metadataCustomFields) {
      metadataCustomFields.innerHTML = '';
      Object.entries(result.customFields).forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className =
          'flex flex-col sm:flex-row py-2 border-b border-gray-200 dark:border-gray-700 last:border-0';
        row.innerHTML = `
          <div class="font-medium text-gray-700 dark:text-gray-300 sm:w-48 flex-shrink-0">${key}:</div>
          <div class="text-gray-900 dark:text-white break-all">${value}</div>
        `;
        metadataCustomFields.appendChild(row);
      });
    }
  }

  // Display document info
  if (metadataDocument) metadataDocument.classList.remove('hidden');
  if (metadataDocumentInfo) {
    metadataDocumentInfo.innerHTML = '';

    const docInfo = [
      { label: 'Page Count', value: result.documentInfo.pageCount.toString() },
      { label: 'File Size', value: formatBytes(result.documentInfo.fileSize) },
    ];

    if (result.documentInfo.pdfVersion) {
      docInfo.push({ label: 'PDF Version', value: result.documentInfo.pdfVersion });
    }

    docInfo.forEach(({ label, value }) => {
      const row = document.createElement('div');
      row.className =
        'flex flex-col sm:flex-row py-2 border-b border-gray-200 dark:border-gray-700 last:border-0';
      row.innerHTML = `
        <div class="font-medium text-gray-700 dark:text-gray-300 sm:w-48 flex-shrink-0">${label}:</div>
        <div class="text-gray-900 dark:text-white break-all">${value}</div>
      `;
      metadataDocumentInfo.appendChild(row);
    });
  }

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
