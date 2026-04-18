import { showAlert } from '../components/ui';
import { downloadFile, formatBytes } from '../utils/helpers';
import { icons, createIcons } from 'lucide';
import { loadPyMuPDF, isPyMuPDFAvailable } from '../utils/pymupdf-loader';
import { showWasmRequiredDialog } from '../utils/wasm-provider';

export interface ChangePermissionsOptions {
  currentPassword?: string;
  newUserPassword?: string;
  newOwnerPassword?: string;
  permissions?: {
    print: boolean;
    modify: boolean;
    copy: boolean;
    annotate: boolean;
  };
}

export async function changePermissionsPdf(
  file: File,
  options: ChangePermissionsOptions
): Promise<Blob> {
  const { currentPassword, newUserPassword, newOwnerPassword, permissions } = options;

  try {
    if (!isPyMuPDFAvailable()) {
      showWasmRequiredDialog('pymupdf', () => {
        window.location.reload();
      });
      throw new Error(
        'PyMuPDF is required for changing PDF permissions. Please configure it in Advanced Settings.'
      );
    }

    const pyMuPDF = await loadPyMuPDF();

    // Open the PDF document
    const doc = await pyMuPDF.open(file);

    // If the document is encrypted, authenticate with current password
    if (doc.isEncrypted) {
      if (!currentPassword) {
        doc.close();
        throw new Error('This PDF is password-protected. Please enter the current password.');
      }

      const authenticated = doc.authenticate(currentPassword);
      if (!authenticated) {
        doc.close();
        throw new Error('Invalid current password. Please check your password and try again.');
      }
    }

    // Prepare save options
    const saveOptions: any = {
      garbage: 4,
      deflate: true,
      clean: true,
    };

    // If new passwords are provided, add encryption
    if (newUserPassword || newOwnerPassword) {
      saveOptions.encryption = {
        userPassword: newUserPassword || '',
        ownerPassword: newOwnerPassword || newUserPassword || '',
      };

      // Add permissions if specified
      if (permissions) {
        saveOptions.encryption.permissions = {
          print: permissions.print,
          modify: permissions.modify,
          copy: permissions.copy,
          annotate: permissions.annotate,
        };
      }
    }
    // If no new passwords, the document will be saved without encryption

    // Save the document
    const resultBlob = await doc.saveAsBlob(saveOptions);

    // Close the document
    doc.close();

    return resultBlob;
  } catch (error: any) {
    console.error('Change permissions error:', error);
    throw error;
  }
}

export function setupChangePermissionsPage() {
  const container = document.getElementById('change-permissions-container');
  if (!container) return;

  container.innerHTML = `
    <div class="tool-content">
      <div class="alert alert-info">
        <i data-lucide="info"></i>
        <div>
          <strong>Change PDF Permissions</strong>
          <p>Modify security settings and access permissions for your PDF. Requires PyMuPDF to be configured in Advanced Settings.</p>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="shield-check"></i> Security Settings</h3>
        
        <div class="form-group">
          <label for="permissions-current-password">Current Password (if encrypted)</label>
          <input type="password" id="permissions-current-password" placeholder="Enter current password">
          <small>Required only if the PDF is already password-protected</small>
        </div>

        <div class="form-group">
          <label for="permissions-user-password">New User Password</label>
          <input type="password" id="permissions-user-password" placeholder="Enter new user password (optional)">
          <small>Password required to open the PDF. Leave blank to remove encryption.</small>
        </div>

        <div class="form-group">
          <label for="permissions-owner-password">New Owner Password</label>
          <input type="password" id="permissions-owner-password" placeholder="Enter new owner password (optional)">
          <small>Different password for managing restrictions. Defaults to user password if not set.</small>
        </div>
      </div>

      <div class="settings-panel">
        <h3><i data-lucide="lock"></i> Document Permissions</h3>
        <p class="text-sm text-gray-600 mb-4">Set what users can do with this PDF (requires owner password)</p>
        
        <div class="space-y-3">
          <label class="checkbox-label">
            <input type="checkbox" id="permissions-allow-print" checked>
            <span>Allow Printing</span>
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" id="permissions-allow-modify" checked>
            <span>Allow Modifications</span>
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" id="permissions-allow-copy" checked>
            <span>Allow Content Copying</span>
          </label>
          
          <label class="checkbox-label">
            <input type="checkbox" id="permissions-allow-annotate" checked>
            <span>Allow Annotations</span>
          </label>
        </div>
      </div>

      <div class="action-buttons">
        <button id="change-permissions-btn" class="btn btn-primary">
          <i data-lucide="shield-check"></i>
          Update Permissions
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
