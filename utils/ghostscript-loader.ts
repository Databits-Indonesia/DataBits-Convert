import { WasmProvider } from './wasm-provider';

export type PdfALevel = 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b';

export async function convertFileToPdfA(
  file: File,
  level: PdfALevel,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  if (!WasmProvider.isConfigured('ghostscript')) {
    throw new Error('Ghostscript is not configured. Please configure it in Advanced Settings.');
  }

  const gsUrl = WasmProvider.getUrl('ghostscript')!;

  // Load Ghostscript WASM
  const gsModule = await import(/* webpackIgnore: true */ `${gsUrl}gs.js`);
  const GhostscriptWASM = gsModule.GhostscriptWASM;

  if (!GhostscriptWASM) {
    throw new Error('Failed to load Ghostscript WASM module');
  }

  const gs = new GhostscriptWASM(gsUrl);

  if (gs.init) {
    await gs.init();
  }

  onProgress?.('Converting to PDF/A...');

  const arrayBuffer = await file.arrayBuffer();

  // Map PDF/A level to Ghostscript profile
  const profileMap: Record<PdfALevel, string> = {
    'PDF/A-1b': 'pdfa1b',
    'PDF/A-2b': 'pdfa2b',
    'PDF/A-3b': 'pdfa3b',
  };

  const profile = profileMap[level];

  if (gs.convertToPDFA) {
    const resultBuffer = await gs.convertToPDFA(arrayBuffer, profile);
    return new Blob([resultBuffer], { type: 'application/pdf' });
  } else {
    throw new Error('Ghostscript convertToPDFA method not available');
  }
}

export async function convertFileToOutlines(
  file: File,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  if (!WasmProvider.isConfigured('ghostscript')) {
    throw new Error('Ghostscript is not configured. Please configure it in Advanced Settings.');
  }

  const gsUrl = WasmProvider.getUrl('ghostscript')!;

  // Load Ghostscript WASM
  const gsModule = await import(/* webpackIgnore: true */ `${gsUrl}gs.js`);
  const GhostscriptWASM = gsModule.GhostscriptWASM;

  if (!GhostscriptWASM) {
    throw new Error('Failed to load Ghostscript WASM module');
  }

  const gs = new GhostscriptWASM(gsUrl);

  if (gs.init) {
    await gs.init();
  }

  onProgress?.('Converting fonts to outlines...');

  const arrayBuffer = await file.arrayBuffer();

  if (gs.fontToOutline) {
    const resultBuffer = await gs.fontToOutline(arrayBuffer);
    return new Blob([resultBuffer], { type: 'application/pdf' });
  } else {
    throw new Error('Ghostscript fontToOutline method not available');
  }
}