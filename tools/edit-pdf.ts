import { showLoader, hideLoader, showAlert } from '../ui';
import { state } from '../state';

// Declare global type for EmbedPDF
declare global {
  interface Window {
    EmbedPDF?: {
      init: (config: {
        type: string;
        target: HTMLElement;
        src: string;
        toolbar?: {
          download?: boolean;
          print?: boolean;
          zoom?: boolean;
          search?: boolean;
          pageNav?: boolean;
          fullscreen?: boolean;
        };
      }) => unknown;
    };
  }
}

let embedPDFInstance: unknown = null;

export async function setupEditPDFTool() {
  const optionsDiv = document.getElementById('edit-pdf-options');
  if (!optionsDiv || !state.files || state.files.length === 0) return;

  optionsDiv.classList.remove('hidden');
  await loadPDFViewer();
}

async function loadPDFViewer() {
  const viewerContainer = document.getElementById('pdf-viewer-container');
  if (!viewerContainer || !state.files || state.files.length === 0) return;

  try {
    showLoader('Loading PDF viewer...');

    const file = state.files[0];

    // Create object URL from the file
    const fileURL = URL.createObjectURL(file);

    // Clear previous viewer
    viewerContainer.innerHTML = '';

    // Create viewer div
    const viewerDiv = document.createElement('div');
    viewerDiv.id = 'pdf-viewer';
    viewerDiv.style.height = '700px';
    viewerDiv.style.width = '100%';
    viewerContainer.appendChild(viewerDiv);

    // Wait for EmbedPDF to be available
    if (!window.EmbedPDF) {
      throw new Error('EmbedPDF library is not loaded');
    }

    // Initialize EmbedPDF
    embedPDFInstance = window.EmbedPDF.init({
      type: 'container',
      target: viewerDiv,
      src: fileURL,
      toolbar: {
        download: true,
        print: true,
        zoom: true,
        search: true,
        pageNav: true,
        fullscreen: true,
      },
    });

    hideLoader();

    // Show instructions
    const instructionsDiv = document.getElementById('edit-instructions');
    if (instructionsDiv) {
      instructionsDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading PDF viewer:', error);
    hideLoader();
    showAlert(
      'Error',
      'Failed to load PDF viewer. Please make sure you have an internet connection as the viewer is loaded from a CDN.'
    );
  }
}

export function cleanupEditPDFTool() {
  // Cleanup viewer instance if needed
  if (embedPDFInstance) {
    embedPDFInstance = null;
  }

  const viewerContainer = document.getElementById('pdf-viewer-container');
  if (viewerContainer) {
    viewerContainer.innerHTML = '';
  }
}
