/**
 * Global State Management
 * Manages files and PDF document state across the application
 */

import { PDFDocument } from 'pdf-lib';

interface AppState {
  files: File[];
  pdfDoc: PDFDocument | null;
}

export const state: AppState = {
  files: [],
  pdfDoc: null,
};

export function setFiles(files: File[]) {
  state.files = files;
}

export function getFiles() {
  return state.files;
}

export function setPdfDoc(doc: PDFDocument | null) {
  state.pdfDoc = doc;
}

export function getPdfDoc() {
  return state.pdfDoc;
}

export function clearState() {
  state.files = [];
  state.pdfDoc = null;
}
