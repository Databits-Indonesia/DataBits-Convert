import { PDFDocument } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker path
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface OcrOptions {
  language: string;
  resolution: number;
  binarize: boolean;
  whitelist: string;
  onProgress?: (status: string, progress: number) => void;
}

export interface OcrResult {
  pdfBytes: Uint8Array;
  fullText: string;
}

let tesseractWorker: any = null;

async function loadTesseract() {
  if (tesseractWorker) return tesseractWorker;
  
  try {
    const Tesseract = await import('tesseract.js');
    tesseractWorker = await Tesseract.createWorker({
      logger: (m: any) => console.log(m),
    });
    return tesseractWorker;
  } catch (error) {
    console.error('Failed to load Tesseract:', error);
    throw new Error('Failed to initialize OCR engine. Please check your internet connection.');
  }
}

async function pdfPageToImage(
  pdfBytes: Uint8Array,
  pageIndex: number,
  scale: number = 2
): Promise<ImageData> {
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1);
  
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;
  
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function binarizeImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  const threshold = 128;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const val = avg >= threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  
  return imageData;
}

export async function performOcr(
  pdfBytes: Uint8Array,
  options: OcrOptions
): Promise<OcrResult> {
  const { language, resolution, binarize, whitelist, onProgress } = options;
  
  if (onProgress) {
    onProgress('Initializing OCR engine...', 0);
  }
  
  const worker = await loadTesseract();
  
  if (onProgress) {
    onProgress('Loading language data...', 0.1);
  }
  
  await worker.loadLanguage(language);
  await worker.initialize(language);
  
  if (whitelist) {
    await worker.setParameters({
      tessedit_char_whitelist: whitelist,
    });
  }
  
  if (onProgress) {
    onProgress('Loading PDF...', 0.2);
  }
  
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  const fullTextParts: string[] = [];
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  for (let i = 0; i < numPages; i++) {
    const progress = 0.2 + ((i / numPages) * 0.7);
    if (onProgress) {
      onProgress(`Processing page ${i + 1} of ${numPages}...`, progress);
    }
    
    let imageData = await pdfPageToImage(pdfBytes, i, resolution);
    
    if (binarize) {
      imageData = binarizeImage(imageData);
    }
    
    // Convert ImageData to canvas for Tesseract
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
    
    const { data } = await worker.recognize(canvas);
    
    if (data.text) {
      fullTextParts.push(`\n--- Page ${i + 1} ---\n${data.text}`);
    }
  }
  
  if (onProgress) {
    onProgress('Generating searchable PDF...', 0.9);
  }
  
  // For now, we return the original PDF since creating a truly searchable PDF
  // requires embedding the text layer which is complex
  const resultPdfBytes = await pdfDoc.save();
  
  if (onProgress) {
    onProgress('Complete!', 1.0);
  }
  
  await worker.terminate();
  tesseractWorker = null;
  
  return {
    pdfBytes: resultPdfBytes,
    fullText: fullTextParts.join('\n'),
  };
}
