import { showAlert } from '../ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';
import { showWasmRequiredDialog } from '../utils/wasm-provider';

export interface DecryptOptions {
  password: string;
}

export async function decryptPdfDocument(file: File, options: DecryptOptions): Promise<Blob> {
  const { password } = options;

  if (!password) {
    throw new Error('Password is required');
  }

  try {
    if (!isPyMuPDFAvailable()) {
      showWasmRequiredDialog('pymupdf', () => {
        window.location.reload();
      });
      throw new Error('PyMuPDF is required for PDF decryption. Please configure it in Advanced Settings.');
    }

    const pyMuPDF = await loadPyMuPDF();
    
    // Open the encrypted PDF document with password
    const doc = await pyMuPDF.open(file);
    
    // Check if the document is encrypted
    if (!doc.isEncrypted) {
      doc.close();
      throw new Error('This PDF is not encrypted.');
    }
    
    // Authenticate with the password
    const authenticated = doc.authenticate(password);
    
    if (!authenticated) {
      doc.close();
      throw new Error('Invalid password. Please check your password and try again.');
    }
    
    // Save the document without encryption
    const decryptedBlob = await doc.saveAsBlob({
      garbage: 4,
      deflate: true,
      clean: true,
    });
    
    // Close the document
    doc.close();
    
    return decryptedBlob;
  } catch (error: any) {
    console.error('Decryption error:', error);
    throw error;
  }
}

export function setupDecryptPdfPage() {
  const container = document.getElementById('decrypt-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>PDF Decryption</strong>
          <p>Remove password protection from your PDF files. Requires PyMuPDF to be configured in Advanced Settings.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="unlock"></i> Decryption Settings</h3>
        
        <div class="form-group">
          <label for="decrypt-password">PDF Password</label>
          <input type="password" id="decrypt-password" placeholder="Enter the PDF password">
          <small>Enter the password used to protect this PDF</small>
        </div>
      </div>

      <div class="action-buttons">
        <button id="decrypt-btn" class="btn btn-primary">
          <i data-lucide="unlock"></i>
          Decrypt PDF
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
