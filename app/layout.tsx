import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'DataBits Convert',
  description: 'PDF conversion and manipulation tools',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css"
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark font-display text-gray-700 dark:text-gray-300 antialiased selection:bg-primary selection:text-white">
        <div id="root">{children}</div>
        <Analytics />
        <Script type="module" strategy="beforeInteractive">
          {`
            import EmbedPDF from 'https://snippet.embedpdf.com/embedpdf.js';
            window.EmbedPDF = EmbedPDF;
          `}
        </Script>
        <Script type="importmap" strategy="beforeInteractive">
          {`
            {
              "imports": {
                "react/": "https://aistudiocdn.com/react@^19.2.0/",
                "react": "https://aistudiocdn.com/react@^19.2.0",
                "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
                "pdfjs-dist/": "https://aistudiocdn.com/pdfjs-dist@^5.4.449/",
                "pdfjs-dist": "https://aistudiocdn.com/pdfjs-dist@^5.4.449",
                "jszip": "https://aistudiocdn.com/jszip@^3.10.1",
                "pdf-lib": "https://aistudiocdn.com/pdf-lib@^1.17.1",
                "tesseract.js": "https://aistudiocdn.com/tesseract.js@^6.0.1",
                "lucide": "https://aistudiocdn.com/lucide@^0.555.0",
                "heic2any": "https://aistudiocdn.com/heic2any@^0.0.4",
                "utif": "https://aistudiocdn.com/utif@^3.1.0",
                "sortablejs": "https://aistudiocdn.com/sortablejs@^1.15.6",
                "cropperjs": "https://aistudiocdn.com/cropperjs@^2.1.0",
                "vitest": "https://aistudiocdn.com/vitest@^4.0.15",
                "tiff": "https://aistudiocdn.com/tiff@^7.1.2",
                "@neslinesli93/qpdf-wasm": "https://aistudiocdn.com/@neslinesli93/qpdf-wasm@^0.3.0"
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}
