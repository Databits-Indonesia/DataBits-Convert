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

export function addFile(file: File): { success: boolean; message?: string } {
  // Check if file already exists by comparing name and size
  const isDuplicate = state.files.some(
    (existingFile) => existingFile.name === file.name && existingFile.size === file.size
  );

  if (isDuplicate) {
    return {
      success: false,
      message: `File "${file.name}" has already been added.`,
    };
  }

  state.files.push(file);
  return { success: true };
}

export function addFiles(files: File[]): { added: File[]; duplicates: File[] } {
  const added: File[] = [];
  const duplicates: File[] = [];

  for (const file of files) {
    const isDuplicate = state.files.some(
      (existingFile) => existingFile.name === file.name && existingFile.size === file.size
    );

    if (isDuplicate) {
      duplicates.push(file);
    } else {
      state.files.push(file);
      added.push(file);
    }
  }

  return { added, duplicates };
}

export function removeFile(index: number): boolean {
  if (index >= 0 && index < state.files.length) {
    state.files.splice(index, 1);
    return true;
  }
  return false;
}

export function clearFiles() {
  state.files = [];
}

export function isFileInState(file: File): boolean {
  return state.files.some(
    (existingFile) => existingFile.name === file.name && existingFile.size === file.size
  );
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
