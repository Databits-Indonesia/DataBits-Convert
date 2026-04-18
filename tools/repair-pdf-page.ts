import { repairPdf } from './repair-pdf';
import { state } from '../state';

let isRepairSetup = false;

function getRepairElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const direct = document.getElementById(id) as T | null;
  if (direct) return direct;

  const container = document.getElementById('repair-container');
  if (!container) return null;

  return container.querySelector(`#${id}`) as T | null;
}

function setProcessButtonLoading(isLoading: boolean) {
  const processBtn = getRepairElement<HTMLButtonElement>('repair-process-btn');
  if (!processBtn) return;

  const idleLabel = processBtn.dataset.idleLabel || processBtn.textContent || 'Repair PDF';
  processBtn.dataset.idleLabel = idleLabel;
  processBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Repairing...' : idleLabel;
}

function updateRepairButtonState() {
  const processBtn = getRepairElement<HTMLButtonElement>('repair-process-btn');
  if (!processBtn) return;
  processBtn.disabled = state.files.length === 0;
}

export function setupRepairPage() {
  const container = document.getElementById('repair-container');
  if (container) {
    container.classList.remove('hidden');
  }

  updateRepairButtonState();

  if (isRepairSetup) return;
  isRepairSetup = true;

  const processBtn = getRepairElement<HTMLButtonElement>('repair-process-btn');
  if (!processBtn) return;

  processBtn.addEventListener('click', async () => {
    if (state.files.length === 0) {
      processBtn.disabled = true;
      return;
    }

    setProcessButtonLoading(true);
    try {
      await repairPdf();
    } finally {
      setProcessButtonLoading(false);
      updateRepairButtonState();
    }
  });
}
