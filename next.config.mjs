/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverExternalPackages only helps with CJS-compatible packages.
  // Browser-only libraries (pdfjs-dist, etc.) are handled by ssr:false
  // dynamic imports in the tool page, which prevents them from ever
  // being bundled or evaluated server-side.
  serverExternalPackages: [
    'node-forge',
    'mammoth',
    'docx',
    'xlsx',
  ],
  env: {
    NEXT_PUBLIC_WASM_PYMUPDF_URL: 'https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/',
    NEXT_PUBLIC_WASM_GS_URL: 'https://cdn.jsdelivr.net/npm/@bentopdf/gs-wasm/assets/',
    NEXT_PUBLIC_WASM_CPDF_URL: 'https://cdn.jsdelivr.net/npm/coherentpdf@2.5.5/dist/',
    NEXT_PUBLIC_WASM_QPDF_URL: 'https://cdn.jsdelivr.net/npm/qpdf-wasm/',
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      fs: './empty-module.js',
      path: './empty-module.js',
      crypto: './empty-module.js',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
