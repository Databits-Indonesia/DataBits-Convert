import { WasmProvider } from './wasm-provider';

let cachedGhostscript: any = null;
let loadPromise: Promise<any> | null = null;

export async function loadGhostscript(): Promise<any> {
  if (cachedGhostscript) {
    return cachedGhostscript;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    if (!WasmProvider.isConfigured('ghostscript')) {
      throw new Error('Ghostscript is not configured. Please configure it in Advanced Settings.');
    }

    const gsUrl = WasmProvider.getUrl('ghostscript')!;

    try {
      const gsModule = await import(/* webpackIgnore: true */ `${gsUrl}gs.js`);
      const GhostscriptWASM = gsModule.GhostscriptWASM;

      if (!GhostscriptWASM) {
        throw new Error('Ghostscript module did not export expected GhostscriptWASM class.');
      }

      cachedGhostscript = new GhostscriptWASM(gsUrl);

      if (cachedGhostscript.init) {
        await cachedGhostscript.init();
      }

      console.log('[Ghostscript Loader] Successfully loaded from CDN');
      return cachedGhostscript;
    } catch (error: any) {
      loadPromise = null;
      throw new Error(`Failed to load Ghostscript from CDN: ${error.message}`);
    }
  })();

  return loadPromise;
}

export function isGhostscriptAvailable(): boolean {
  return WasmProvider.isConfigured('ghostscript');
}

export function clearGhostscriptCache(): void {
  cachedGhostscript = null;
  loadPromise = null;
}