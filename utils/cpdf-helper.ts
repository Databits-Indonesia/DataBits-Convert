import { WasmProvider } from './wasm-provider';

declare global {
  interface Window {
    cpdf?: unknown;
  }
}

let cpdfLoaderPromise: Promise<unknown> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isCpdfAvailable(): boolean {
  if (!isBrowser()) return false;
  return WasmProvider.isConfigured('cpdf');
}

export async function getCpdf(): Promise<unknown> {
  if (!isBrowser()) {
    throw new Error('CPDF is only available in browser environments');
  }

  if (window.cpdf) return window.cpdf;

  if (!isCpdfAvailable()) {
    throw new Error('CPDF provider is not configured');
  }

  if (cpdfLoaderPromise) return cpdfLoaderPromise;

  const baseUrl = WasmProvider.getUrl('cpdf');
  if (!baseUrl) {
    throw new Error('CPDF URL is missing');
  }

  cpdfLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-cpdf-loader="true"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', () => {
        if (window.cpdf) resolve(window.cpdf);
        else reject(new Error('CPDF loaded but global object is missing'));
      });
      existing.addEventListener('error', () => {
        reject(new Error('Failed to load CPDF script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.dataset.cpdfLoader = 'true';
    script.src = `${baseUrl}coherentpdf.browser.min.js`;
    script.async = true;

    script.onload = () => {
      if (window.cpdf) resolve(window.cpdf);
      else reject(new Error('CPDF loaded but global object is missing'));
    };

    script.onerror = () => {
      reject(new Error('Failed to load CPDF script'));
    };

    document.head.appendChild(script);
  });

  return cpdfLoaderPromise;
}
