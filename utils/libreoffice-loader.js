import { BrowserConverter, createWasmPaths } from '@matbee/libreoffice-converter/browser';

const LIBREOFFICE_VERSION = '2.5.0';

// Try multiple CDN URLs (fallback support)
const CDN_URLS = [
  `https://cdn.jsdelivr.net/npm/@matbee/libreoffice-converter@${LIBREOFFICE_VERSION}/wasm/`,
  `https://unpkg.com/@matbee/libreoffice-converter@${LIBREOFFICE_VERSION}/wasm/`,
];

let WASM_BASE_URL = CDN_URLS[0];
let wasmPaths = createWasmPaths(WASM_BASE_URL);

let currentProgressListener = null;
let initialized = false;
let initializationPromise = null;

let converter = new BrowserConverter({
  ...wasmPaths,
  onProgress: (progress) => {
    if (!currentProgressListener) return;

    currentProgressListener({
      percent: normalizePercent(progress),
      message: progress.message || humanizePhase(progress.phase),
      phase: progress.phase,
    });
  },
});

function normalizePercent(progress) {
  if (typeof progress.percent === 'number') {
    return Math.max(0, Math.min(100, Math.round(progress.percent)));
  }

  switch (progress.phase) {
    case 'starting':
      return 5;
    case 'download-wasm':
      return 20;
    case 'download-data':
      return 45;
    case 'compile':
      return 70;
    case 'filesystem':
      return 85;
    case 'lok-init':
    case 'initializing':
      return 95;
    case 'ready':
    case 'complete':
      return 100;
    default:
      return 0;
  }
}

function humanizePhase(phase) {
  switch (phase) {
    case 'starting':
      return 'Starting LibreOffice engine...';
    case 'download-wasm':
      return 'Downloading LibreOffice runtime...';
    case 'download-data':
      return 'Downloading LibreOffice data...';
    case 'compile':
      return 'Compiling WebAssembly module...';
    case 'filesystem':
      return 'Preparing virtual filesystem...';
    case 'lok-init':
    case 'initializing':
      return 'Initializing LibreOffice...';
    case 'ready':
    case 'complete':
      return 'LibreOffice ready.';
    default:
      return 'Loading LibreOffice...';
  }
}

async function initialize(onProgress) {
  if (initialized) {
    onProgress?.({ percent: 100, message: 'LibreOffice ready.', phase: 'ready' });
    return;
  }

  currentProgressListener = onProgress ?? null;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      let lastError;
      
      // Try each CDN URL in sequence
      for (let cdnIndex = 0; cdnIndex < CDN_URLS.length; cdnIndex++) {
        try {
          const cdnUrl = CDN_URLS[cdnIndex];
          WASM_BASE_URL = cdnUrl;
          
          // Create new converter instance with the current CDN URL
          const newWasmPaths = createWasmPaths(cdnUrl);
          converter = new BrowserConverter({
            ...newWasmPaths,
            onProgress: (progress) => {
              if (!currentProgressListener) return;

              currentProgressListener({
                percent: normalizePercent(progress),
                message: progress.message || humanizePhase(progress.phase),
                phase: progress.phase,
              });
            },
          });
          
          onProgress?.({ 
            percent: 5, 
            message: `Initializing LibreOffice from CDN ${cdnIndex + 1}/${CDN_URLS.length}...`, 
            phase: 'starting' 
          });
          
          console.log(`[LibreOffice] Attempting to initialize from: ${cdnUrl}`);
          await converter.initialize();
          initialized = true;
          console.log(`[LibreOffice] Successfully initialized from: ${cdnUrl}`);
          return;
        } catch (error) {
          lastError = error;
          console.warn(`[LibreOffice] Failed to initialize from ${CDN_URLS[cdnIndex]}:`, error.message);
          
          // If this wasn't the last CDN, continue to next
          if (cdnIndex < CDN_URLS.length - 1) {
            continue;
          }
        }
      }
      
      // All CDNs failed
      const errorMsg = `Failed to load LibreOffice from all available CDNs (${CDN_URLS.join(', ')}). Last error: ${lastError?.message || 'Unknown error'}. 
      
Please check:
1. Your internet connection is working
2. That cdn.jsdelivr.net and unpkg.com are accessible from your location
3. Your firewall/proxy isn't blocking CDN access
4. Check browser console (F12) for detailed error information`;
      
      throw new Error(errorMsg);
    })()
      .then(() => {
        initialized = true;
      })
      .catch((error) => {
        initialized = false;
        throw error;
      })
      .finally(() => {
        initializationPromise = null;
      });
  }

  try {
    await initializationPromise;
    onProgress?.({ percent: 100, message: 'LibreOffice ready.', phase: 'ready' });
  } catch (error) {
    throw error;
  }
}

async function convertToPdf(file) {
  if (!initialized) {
    await initialize();
  }

  const result = await converter.convertFile(file, { outputFormat: 'pdf' });
  return new Blob([result.data], {
    type: result.mimeType || 'application/pdf',
  });
}

const singleton = {
  initialize,
  convertToPdf,
  isInitialized: () => initialized,
};

export function getLibreOfficeConverter() {
  return singleton;
}
