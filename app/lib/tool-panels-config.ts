export interface SimpleToolPanelConfig {
  containerId: string;
  title: string;
  description: string;
  actionLabel: string;
}

export const qualitySimplePanels: SimpleToolPanelConfig[] = [
  {
    containerId: 'deskew-container',
    title: 'Deskew PDF',
    description: 'Automatically straighten skewed pages',
    actionLabel: 'Deskew PDF',
  },
  {
    containerId: 'repair-container',
    title: 'Repair PDF',
    description: 'Fix corrupted PDF files',
    actionLabel: 'Repair PDF',
  },
  {
    containerId: 'fix-page-size-container',
    title: 'Fix Page Size',
    description: 'Standardize page dimensions',
    actionLabel: 'Fix Page Size',
  },
  {
    containerId: 'scanner-effect-container',
    title: 'Scanner Effect',
    description: 'Apply scanner-like appearance to PDF',
    actionLabel: 'Apply Scanner Effect',
  },
  {
    containerId: 'scan-to-pdf-container',
    title: 'Scan to PDF',
    description: 'Convert scanned images to PDF',
    actionLabel: 'Create PDF from Scans',
  },
];

export const layoutSimplePanels: SimpleToolPanelConfig[] = [
  {
    containerId: 'booklet-container',
    title: 'Create Booklet',
    description: 'Arrange pages for booklet printing',
    actionLabel: 'Create Booklet',
  },
  {
    containerId: 'table-of-contents-container',
    title: 'Table of Contents',
    description: 'Generate table of contents',
    actionLabel: 'Generate TOC',
  },
  {
    containerId: 'bookmark-container',
    title: 'Manage Bookmarks',
    description: 'Add and organize PDF bookmarks',
    actionLabel: 'Manage Bookmarks',
  },
  {
    containerId: 'layers-container',
    title: 'Manage Layers',
    description: 'Manage PDF layers (Optional Content)',
    actionLabel: 'Manage Layers',
  },
  {
    containerId: 'font-to-outline-container',
    title: 'Convert Fonts to Outlines',
    description: 'Convert text to vector outlines',
    actionLabel: 'Convert Fonts',
  },
];

export const advancedSimplePanels: SimpleToolPanelConfig[] = [
  {
    containerId: 'form-creator-container',
    title: 'Form Creator',
    description: 'Create fillable PDF forms',
    actionLabel: 'Create Form',
  },
  {
    containerId: 'form-filler-container',
    title: 'Form Filler',
    description: 'Fill PDF forms',
    actionLabel: 'Fill Form',
  },
];

export type ConversionBasicActionKey =
  | 'jpgToPdf'
  | 'pngToPdf'
  | 'bmpToPdf'
  | 'webpToPdf'
  | 'heicToPdf'
  | 'svgToPdf'
  | 'tiffToPdf'
  | 'emailToPdf'
  | 'txtToPdf'
  | 'csvToPdf'
  | 'jsonToPdf'
  | 'mdToPdf'
  | 'excelToPdf'
  | 'excelToCsv'
  | 'powerpointToPdf'
  | 'epubToPdf';

export interface ConversionBasicPanelConfig {
  containerId: string;
  title: string;
  description: string;
  actionLabel: string;
  buttonId?: string;
  actionKey?: ConversionBasicActionKey;
}

export const conversionBasicPanels: ConversionBasicPanelConfig[] = [
  {
    containerId: 'jpg-to-pdf-container',
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF',
    actionLabel: 'Convert to PDF',
    buttonId: 'jpg-to-pdf-process-btn',
    actionKey: 'jpgToPdf',
  },
  {
    containerId: 'png-to-pdf-container',
    title: 'PNG to PDF',
    description: 'Convert PNG images to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'png-to-pdf-convert-btn',
    actionKey: 'pngToPdf',
  },
  {
    containerId: 'bmp-to-pdf-container',
    title: 'BMP to PDF',
    description: 'Convert BMP images to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'bmp-to-pdf-convert-btn',
    actionKey: 'bmpToPdf',
  },
  {
    containerId: 'webp-to-pdf-container',
    title: 'WebP to PDF',
    description: 'Convert WebP images to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'webp-to-pdf-convert-btn',
    actionKey: 'webpToPdf',
  },
  {
    containerId: 'heic-to-pdf-container',
    title: 'HEIC to PDF',
    description: 'Convert HEIC/HEIF images to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'heic-to-pdf-convert-btn',
    actionKey: 'heicToPdf',
  },
  {
    containerId: 'svg-to-pdf-container',
    title: 'SVG to PDF',
    description: 'Convert SVG vector graphics to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'svg-to-pdf-convert-btn',
    actionKey: 'svgToPdf',
  },
  {
    containerId: 'tiff-to-pdf-container',
    title: 'TIFF to PDF',
    description: 'Convert TIFF images to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'tiff-to-pdf-convert-btn',
    actionKey: 'tiffToPdf',
  },
  {
    containerId: 'email-to-pdf-container',
    title: 'Email to PDF',
    description: 'Convert email files (.eml, .msg) to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'email-to-pdf-convert-btn',
    actionKey: 'emailToPdf',
  },
  {
    containerId: 'txt-to-pdf-container',
    title: 'Text to PDF',
    description: 'Convert text files to PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'txt-to-pdf-convert-btn',
    actionKey: 'txtToPdf',
  },
  {
    containerId: 'csv-to-pdf-container',
    title: 'CSV to PDF',
    description: 'Convert CSV spreadsheet files to PDF tables',
    actionLabel: 'Convert to PDF',
    buttonId: 'csv-to-pdf-convert-btn',
    actionKey: 'csvToPdf',
  },
  {
    containerId: 'json-to-pdf-container',
    title: 'JSON to PDF',
    description: 'Convert JSON data files to formatted PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'json-to-pdf-convert-btn',
    actionKey: 'jsonToPdf',
  },
  {
    containerId: 'markdown-to-pdf-container',
    title: 'Markdown to PDF',
    description: 'Convert Markdown documents to formatted PDF files',
    actionLabel: 'Convert to PDF',
    buttonId: 'markdown-to-pdf-convert-btn',
    actionKey: 'mdToPdf',
  },
  {
    containerId: 'excel-to-pdf-container',
    title: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to formatted PDF documents',
    actionLabel: 'Convert to PDF',
    buttonId: 'excel-to-pdf-convert-btn',
    actionKey: 'excelToPdf',
  },
  {
    containerId: 'excel-to-csv-container',
    title: 'Excel to CSV',
    description: 'Convert Excel spreadsheets (.xlsx, .xls) to CSV format using SheetJS',
    actionLabel: 'Convert to CSV',
    buttonId: 'excel-to-csv-convert-btn',
    actionKey: 'excelToCsv',
  },
  {
    containerId: 'powerpoint-to-pdf-container',
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF',
    actionLabel: 'Convert to PDF',
    buttonId: 'powerpoint-to-pdf-process-btn',
    actionKey: 'powerpointToPdf',
  },
  {
    containerId: 'epub-to-pdf-container',
    title: 'EPUB to PDF',
    description: 'Convert EPUB ebooks to PDF',
    actionLabel: 'Convert to PDF',
    buttonId: 'epub-to-pdf-convert-btn',
    actionKey: 'epubToPdf',
  },
  {
    containerId: 'mobi-to-pdf-container',
    title: 'MOBI to PDF',
    description: 'Convert MOBI ebooks to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'cbz-to-pdf-container',
    title: 'CBZ to PDF',
    description: 'Convert CBZ comic archives to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'fb2-to-pdf-container',
    title: 'FB2 to PDF',
    description: 'Convert FB2 ebooks to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'rtf-to-pdf-container',
    title: 'RTF to PDF',
    description: 'Convert RTF documents to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'odg-to-pdf-container',
    title: 'ODG to PDF',
    description: 'Convert OpenDocument Graphics to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'odp-to-pdf-container',
    title: 'ODP to PDF',
    description: 'Convert OpenDocument Presentations to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'ods-to-pdf-container',
    title: 'ODS to PDF',
    description: 'Convert OpenDocument Spreadsheets to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'odt-to-pdf-container',
    title: 'ODT to PDF',
    description: 'Convert OpenDocument Text to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'psd-to-pdf-container',
    title: 'PSD to PDF',
    description: 'Convert Photoshop files to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'vsd-to-pdf-container',
    title: 'VSD to PDF',
    description: 'Convert Visio files to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'wpd-to-pdf-container',
    title: 'WPD to PDF',
    description: 'Convert WordPerfect documents to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'wps-to-pdf-container',
    title: 'WPS to PDF',
    description: 'Convert WPS documents to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'pub-to-pdf-container',
    title: 'Publisher to PDF',
    description: 'Convert Microsoft Publisher files to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'xml-to-pdf-container',
    title: 'XML to PDF',
    description: 'Convert XML files to PDF',
    actionLabel: 'Convert to PDF',
  },
  {
    containerId: 'xps-to-pdf-container',
    title: 'XPS to PDF',
    description: 'Convert XPS files to PDF',
    actionLabel: 'Convert to PDF',
  },
];
