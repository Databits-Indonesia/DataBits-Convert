import { showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { PDFDocument } from 'pdf-lib';
import { createIcons, icons } from 'lucide';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';
import { showWasmRequiredDialog } from '../utils/wasm-provider';

export interface EncryptOptions {
  userPassword: string;
  ownerPassword?: string;
  addRestrictions?: boolean;
}

export async function encryptPdfDocument(file: File, options: EncryptOptions): Promise<Blob> {
  const { userPassword, ownerPassword, addRestrictions = false } = options;

  if (!userPassword) {
    throw new Error('User password is required');
  }

  try {
    if (!isPyMuPDFAvailable()) {
      showWasmRequiredDialog('pymupdf', () => {
        window.location.reload();
      });
      throw new Error(
        'PyMuPDF is required for PDF encryption. Please configure it in Advanced Settings.'
      );
    }

    const pyMuPDF = await loadPyMuPDF();

    // Open the PDF document
    const doc = await pyMuPDF.open(file);

    // Prepare encryption options
    const encryptionOptions: any = {
      userPassword: userPassword,
      ownerPassword: ownerPassword || userPassword,
    };

    // Add permissions if restrictions are enabled
    if (addRestrictions) {
      encryptionOptions.permissions = {
        print: false,
        modify: false,
        copy: false,
        annotate: false,
      };
    }

    // Save the document with encryption
    const encryptedBlob = await doc.saveAsBlob({
      encryption: encryptionOptions,
      garbage: 4,
      deflate: true,
      clean: true,
    });

    // Close the document
    doc.close();

    return encryptedBlob;
  } catch (error: any) {
    console.error('Encryption error:', error);
    throw error;
  }
}

export function setupEncryptPdfPage() {
  const container = document.getElementById('encrypt-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>PDF Encryption</strong>
          <p>Encrypt your PDF files with password protection. Requires PyMuPDF to be configured in Advanced Settings.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="shield"></i> Encryption Settings</h3>
        
        <div class="form-group">
          <label for="user-password">User Password (Required)</label>
          <input type="password" id="user-password" placeholder="Enter password to open PDF">
          <small>This password will be required to open the PDF</small>
        </div>

        <div class="form-group">
          <label for="owner-password">Owner Password (Optional)</label>
          <input type="password" id="owner-password" placeholder="Enter password for restrictions">
          <small>Different from user password, allows setting restrictions</small>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="add-restrictions">
            <span>Add Document Restrictions</span>
          </label>
          <small>Prevent printing, copying, and editing (requires owner password)</small>
        </div>
      </div>

      <div class="action-buttons">
        <button id="encrypt-btn" class="btn btn-primary">
          <i data-lucide="lock"></i>
          Encrypt PDF
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
