import { createWorker } from 'tesseract.js';

interface TesseractProgress {
  status: string;
  progress: number;
}

export async function createConfiguredTesseractWorker(
  language: string,
  _workerCount = 1,
  onProgress?: (progress: TesseractProgress) => void
) {
  return createWorker(language, 1, {
    logger: (message: { status?: string; progress?: number }) => {
      if (!onProgress) return;
      onProgress({
        status: message.status || 'working',
        progress: message.progress ?? 0,
      });
    },
  });
}
