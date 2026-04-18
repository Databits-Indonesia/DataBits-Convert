import { showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';
import { showWasmRequiredDialog } from '../utils/wasm-provider';

export interface RemoveRestrictionsOptions {
  password?: string;
}

export async function removeRestrictionsPdf(
  file: File,
  options: RemoveRestrictionsOptions = {}
): Promise<Blob> {
  const { password } = options;

  try {
    if (!isPyMuPDFAvailable()) {
      showWasmRequiredDialog('pymupdf', () => {
        window.location.reload();
      });
      throw new Error(
        'PyMuPDF is required for removing PDF restrictions. Please configure it in Advanced Settings.'
      );
    }

    const pyMuPDF = await loadPyMuPDF();

    // Open the PDF document
    const doc = await pyMuPDF.open(file);

    // If the document is encrypted, authenticate with password
    if (doc.isEncrypted) {
      if (!password) {
        doc.close();
        throw new Error(
          'This PDF is password-protected. Please enter the password to remove restrictions.'
        );
      }

      const authenticated = doc.authenticate(password);
      if (!authenticated) {
        doc.close();
        throw new Error('Invalid password. Please check your password and try again.');
      }
    }

    // Save the document without encryption/restrictions
    // By saving without encryption parameters, all restrictions are removed
    const resultBlob = await doc.saveAsBlob({
      garbage: 4,
      deflate: true,
      clean: true,
    });

    // Close the document
    doc.close();

    return resultBlob;
  } catch (error: any) {
    console.error('Remove restrictions error:', error);
    throw error;
  }
}

export function setupRemoveRestrictionsPage() {
  const container = document.getElementById('remove-restrictions-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>Remove PDF Restrictions</strong>
          <p>Remove editing, printing, and copying restrictions from your PDF files. Requires PyMuPDF to be configured in Advanced Settings.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="unlock"></i> Remove Restrictions</h3>
        
        <div class="form-group">
          <label for="restrictions-password">Password (if required)</label>
          <input type="password" id="restrictions-password" placeholder="Enter owner or user password">
          <small>Required only if the PDF is password-protected</small>
        </div>
        
        <div class="alert alert-warning mt-4">
          <i data-lucide="alert-triangle"></i>
          <div>
            <p class="text-sm"><strong>Note:</strong> This will remove all security restrictions including:</p>
            <ul class="text-sm mt-2 ml-4 space-y-1">
              <li>• Printing restrictions</li>
              <li>• Content copying restrictions</li>
              <li>• Editing restrictions</li>
              <li>• Annotation restrictions</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button id="remove-restrictions-btn" class="btn btn-primary">
          <i data-lucide="unlock"></i>
          Remove Restrictions
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
