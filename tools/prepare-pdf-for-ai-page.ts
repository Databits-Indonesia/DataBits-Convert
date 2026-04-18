import { showLoader, hideLoader, showAlert } from '../components/ui';
import { downloadFile } from '../utils/helpers';
import { state } from '../state';
import { loadPyMuPDF } from '../utils/pymupdf-loader';
import type { PyMuPDFInstance } from '@/types';
import { batchDecryptIfNeeded } from '../utils/password-prompt';
import { deduplicateFileName } from '../utils/deduplicate-filename';

let isPrepareForAiSetup = false;

function getPrepareForAiElement(id: string): HTMLElement | null {
  const direct = document.getElementById(id);
  if (direct) return direct;

  const container = document.getElementById('prepare-for-ai-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as HTMLElement | null;
}

function setProcessButtonLoading(isLoading: boolean) {
  const processBtn = getPrepareForAiElement(
    'prepare-for-ai-process-btn'
  ) as HTMLButtonElement | null;
  if (!processBtn) return;

  const idleLabel = processBtn.dataset.idleLabel || processBtn.textContent || 'Prepare for AI';
  processBtn.dataset.idleLabel = idleLabel;
  processBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Preparing...' : idleLabel;
}

async function extractForAI() {
  try {
    if (state.files.length === 0) {
      showAlert('No Files', 'Please upload at least one PDF file first.');
      return;
    }

    setProcessButtonLoading(true);
    showLoader('Loading engine...');

    const pymupdf = await loadPyMuPDF();

    hideLoader();
    state.files = await batchDecryptIfNeeded(state.files);
    showLoader('Extracting...');

    const total = state.files.length;
    let completed = 0;
    let failed = 0;

    if (total === 1) {
      const file = state.files[0];
      showLoader(`Extracting ${file.name} for AI...`);

      const llamaDocs = await (pymupdf as PyMuPDFInstance).pdfToLlamaIndex(file);
      const outName = file.name.replace(/\.pdf$/i, '') + '_llm.json';
      const jsonContent = JSON.stringify(llamaDocs, null, 2);
      downloadFile(new Blob([jsonContent], { type: 'application/json' }), outName);

      hideLoader();
      showAlert('Extraction Complete', 'Successfully extracted PDF for AI/LLM use.', 'success');
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (let fi = 0; fi < state.files.length; fi++) {
      try {
        const file = state.files[fi];
        showLoader(`Extracting ${file.name} for AI (${fi + 1}/${total})...`);

        const llamaDocs = await (pymupdf as PyMuPDFInstance).pdfToLlamaIndex(file);
        const outName = file.name.replace(/\.pdf$/i, '') + '_llm.json';
        const jsonContent = JSON.stringify(llamaDocs, null, 2);
        const zipEntryName = deduplicateFileName(outName, usedNames);
        zip.file(zipEntryName, jsonContent);

        completed++;
      } catch (error) {
        console.error(`Failed to extract ${state.files[fi].name}:`, error);
        failed++;
      }
    }

    showLoader('Creating ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, 'pdf-for-ai.zip');

    hideLoader();

    if (failed === 0) {
      showAlert(
        'Extraction Complete',
        `Successfully extracted ${completed} PDF(s) for AI/LLM use.`,
        'success'
      );
    } else {
      showAlert(
        'Extraction Partial',
        `Extracted ${completed} PDF(s), failed ${failed}.`,
        'warning'
      );
    }
  } catch (e: unknown) {
    hideLoader();
    showAlert(
      'Error',
      `An error occurred during extraction. Error: ${e instanceof Error ? e.message : String(e)}`
    );
  } finally {
    setProcessButtonLoading(false);
  }
}

export function setupPrepareForAiPage() {
  if (isPrepareForAiSetup) return;
  isPrepareForAiSetup = true;

  const container = document.getElementById('prepare-for-ai-container');
  if (container) {
    container.classList.remove('hidden');
  }

  const backBtn = getPrepareForAiElement('back-to-tools');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = process.env.BASE_URL || '/';
    });
  }

  const processBtn = getPrepareForAiElement('prepare-for-ai-process-btn');
  if (processBtn) {
    processBtn.addEventListener('click', () => {
      void extractForAI();
    });
  }
}
