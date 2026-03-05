/**
 * Helper Utilities
 * Common functions for file handling, PDF operations, and downloads
 */

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Common page sizes in points (72 dpi)
const STANDARD_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
  A3: { width: 841.89, height: 1190.55 },
  A5: { width: 419.53, height: 595.28 },
};

/**
 * Read a file as an ArrayBuffer
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get a PDF.js document from array buffer
 */
export function getPDFDocument(options: { data: ArrayBuffer | Uint8Array }) {
  return pdfjsLib.getDocument({
    ...options,
    // Ensure OpenJPEG wasm is resolvable in PDF.js v5+
    wasmUrl: '/pdfjs-viewer/wasm/',
  });
}

/**
 * Download a blob as a file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Convert page size to a standard name if it matches known sizes (within tolerance)
 */
export function getStandardPageName(width: number, height: number): string {
  const tolerance = 1; // points
  for (const [name, size] of Object.entries(STANDARD_SIZES)) {
    const matchesNormal =
      Math.abs(width - size.width) < tolerance && Math.abs(height - size.height) < tolerance;
    const matchesRotated =
      Math.abs(width - size.height) < tolerance && Math.abs(height - size.width) < tolerance;
    if (matchesNormal || matchesRotated) {
      return name;
    }
  }
  return 'Custom';
}

/**
 * Convert points to another unit (in, mm, px, pt)
 */
export function convertPoints(points: number, unit: 'in' | 'mm' | 'px' | 'pt') {
  switch (unit) {
    case 'in':
      return (points / 72).toFixed(2);
    case 'mm':
      return ((points / 72) * 25.4).toFixed(2);
    case 'px':
      return (points * (96 / 72)).toFixed(2); // assuming 96 DPI
    default:
      return points.toFixed(2);
  }
}

/**
 * Hex to RGB (0-1 range) converter
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Parse page range strings like "1-3,5" into zero-based page indices
 */
export function parsePageRanges(rangeString: string, totalPages: number): number[] {
  if (!rangeString || rangeString.trim() === '') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeString.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    if (trimmedPart.includes('-')) {
      const [startStr, endStr] = trimmedPart.split('-');
      const start = Number(startStr);
      const end = Number(endStr);
      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 1 ||
        end > totalPages ||
        start > end
      ) {
        continue;
      }
      for (let i = start; i <= end; i++) {
        indices.add(i - 1);
      }
    } else {
      const pageNum = Number(trimmedPart);
      if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
        continue;
      }
      indices.add(pageNum - 1);
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Create a PDF document from pages
 */
export async function createPdfFromPages(
  pageIndices: number[],
  sourcePdf: PDFDocument
): Promise<PDFDocument> {
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  return newPdf;
}

let qpdfInitPromise: Promise<any> | null = null;

export async function initializeQpdf(): Promise<any> {
  if (qpdfInitPromise) {
    return qpdfInitPromise;
  }

  qpdfInitPromise = (async () => {
    const qpdfModule: any = await import('@neslinesli93/qpdf-wasm');
    const factory = qpdfModule?.default ?? qpdfModule?.QPDF ?? qpdfModule;

    if (typeof factory === 'function') {
      return await factory();
    }

    return factory;
  })();

  return qpdfInitPromise;
}

/**
 * Escape HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Basic HTML sanitization for email content
 * Removes potentially dangerous tags and attributes
 */
export function sanitizeEmailHtml(html: string): string {
  // Remove script tags and content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove iframe, object, embed, form tags
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ''
  );
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button|textarea)\b[^>]*\/?>/gi,
    ''
  );

  // Remove style tags but keep style attributes for safe presentation
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove potentially dangerous protocols in href/src
  sanitized = sanitized.replace(
    /\s*(href|src|data)\s*=\s*["']?\s*(javascript|data|vbscript):/gi,
    ' $1="javascript:void(0)"'
  );

  return sanitized;
}

/**
 * Parse and format raw date strings from emails (RFC 2822 format)
 */
export function formatRawDate(rawDate: string): string {
  try {
    const date = new Date(rawDate);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch (e) {
    // If parsing fails, return the raw string escaped
  }
  return escapeHtml(rawDate);
}
