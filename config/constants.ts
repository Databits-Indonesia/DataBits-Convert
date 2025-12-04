/**
 * Application Constants
 * Centralized configuration for the application
 */

import { InputOption, Tool } from '../types';

export const APP_CONFIG = {
  name: 'DataBits Convert',
  version: '1.0.0',
  description: 'Online converter for your documents',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/heic', 'image/tiff'],
  supportedPdfFormat: 'application/pdf',
} as const;

export const INPUT_OPTIONS: InputOption[] = [
  { id: 'gdrive', label: 'Google Drive', icon: 'add_to_drive' },
  { id: 'onedrive', label: 'OneDrive', icon: 'cloud_upload' },
  { id: 'dropbox', label: 'Dropbox', icon: 'inventory_2' },
  { id: 'url', label: 'URL', icon: 'link' },
] as const;

export const POPULAR_TOOLS: Tool[] = [
  { id: 'merge', name: 'Merge PDF', icon: 'call_merge', description: 'Combine multiple PDFs into one file.' },
  { id: 'split', name: 'Split PDF', icon: 'call_split', description: 'Extract a range of pages into a new PDF.' },
  { id: 'compress', name: 'Compress PDF', icon: 'compress', description: 'Reduce the file size of your PDF.' },
  { id: 'edit', name: 'PDF Editor', icon: 'edit', description: 'Annotate, highlight, and add comments.' },
  { id: 'image-to-pdf', name: 'Image to PDF', icon: 'image', description: 'Convert images to PDF.' },
  { id: 'sign', name: 'Sign PDF', icon: 'draw', description: 'Add your signature to a PDF.' },
  { id: 'crop', name: 'Crop PDF', icon: 'crop', description: 'Trim the margins of your PDF pages.' },
  { id: 'extract', name: 'Extract Pages', icon: 'file_upload', description: 'Save specific pages as new files.' },
  { id: 'organize', name: 'Organize PDF', icon: 'library_books', description: 'Sort, reorder, and delete pages.' },
  { id: 'delete', name: 'Delete Pages', icon: 'delete', description: 'Remove unwanted pages.' },
] as const;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds ${APP_CONFIG.maxFileSize / 1024 / 1024}MB limit`,
  UNSUPPORTED_FORMAT: 'Unsupported file format',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  OAUTH_NOT_CONFIGURED: 'OAuth is not configured for this provider',
  INVALID_URL: 'Invalid URL provided',
  FETCH_FAILED: 'Failed to fetch file from URL',
  CORS_ERROR: 'CORS restrictions prevent loading from this domain',
} as const;

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  CONVERSION_COMPLETE: 'Conversion completed',
  DOWNLOAD_READY: 'Your file is ready to download',
} as const;
