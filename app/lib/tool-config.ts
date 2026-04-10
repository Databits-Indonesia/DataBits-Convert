export const TOOL_CONTAINER_MAP: Record<string, string> = {
  // PDF Manipulation
  merge: 'merge-options',
  split: 'split-tool-container',
  compress: 'compress-tool-container',
  organize: 'organize-tool-container',
  delete: 'delete-pages-tool-container',
  extract: 'extract-pages-tool-container',
  crop: 'cropper-tool-container',
  rotate: 'rotate-tool-container',
  reverse: 'reverse-tool-container',
  duplicate: 'duplicate-tool-container',
  divide: 'divide-tool-container',
  'remove-blank': 'remove-blank-tool-container',
  'page-numbers': 'page-numbers-container',
  'page-dimensions': 'fix-page-size-container',
  'n-up': 'n-up-container',

  // PDF Conversions - To PDF
  'image-to-pdf': 'image-to-pdf-container',
  'word-to-pdf': 'word-to-pdf-container',
  'jpg-to-pdf': 'jpg-to-pdf-container',
  'png-to-pdf': 'png-to-pdf-container',
  'bmp-to-pdf': 'bmp-to-pdf-container',
  'webp-to-pdf': 'webp-to-pdf-container',
  'heic-to-pdf': 'heic-to-pdf-container',
  'svg-to-pdf': 'svg-to-pdf-container',
  'tiff-to-pdf': 'tiff-to-pdf-container',
  'email-to-pdf': 'email-to-pdf-container',
  'txt-to-pdf': 'txt-to-pdf-container',
  'csv-to-pdf': 'csv-to-pdf-container',
  'json-to-pdf': 'json-to-pdf-container',
  'markdown-to-pdf': 'markdown-to-pdf-container',
  'excel-to-pdf': 'excel-to-pdf-container',
  'powerpoint-to-pdf': 'powerpoint-to-pdf-container',
  'epub-to-pdf': 'epub-to-pdf-container',
  'mobi-to-pdf': 'mobi-to-pdf-container',
  'cbz-to-pdf': 'cbz-to-pdf-container',
  'fb2-to-pdf': 'fb2-to-pdf-container',
  'rtf-to-pdf': 'rtf-to-pdf-container',
  'odg-to-pdf': 'odg-to-pdf-container',
  'odp-to-pdf': 'odp-to-pdf-container',
  'ods-to-pdf': 'ods-to-pdf-container',
  'odt-to-pdf': 'odt-to-pdf-container',
  'psd-to-pdf': 'psd-to-pdf-container',
  'vsd-to-pdf': 'vsd-to-pdf-container',
  'wpd-to-pdf': 'wpd-to-pdf-container',
  'wps-to-pdf': 'wps-to-pdf-container',
  'pub-to-pdf': 'pub-to-pdf-container',
  'xml-to-pdf': 'xml-to-pdf-container',
  'xps-to-pdf': 'xps-to-pdf-container',

  // PDF Conversions - From PDF
  'pdf-to-word': 'pdf-to-word-container',
  'pdf-to-jpg': 'pdf-to-jpg-container',
  'pdf-to-png': 'pdf-to-png-container',
  'pdf-to-bmp': 'pdf-to-bmp-container',
  'pdf-to-webp': 'pdf-to-webp-container',
  'pdf-to-svg': 'pdf-to-svg-container',
  'pdf-to-tiff': 'pdf-to-tiff-container',
  'pdf-to-text': 'pdf-to-text-container',
  'pdf-to-excel': 'pdf-to-excel-container',
  'pdf-to-csv': 'pdf-to-csv-container',
  'pdf-to-json': 'pdf-to-json-container',
  'pdf-to-markdown': 'pdf-to-markdown-container',
  'pdf-to-zip': 'pdf-to-zip-container',

  // PDF Editing & Enhancement
  edit: 'edit-pdf-options',
  sign: 'signature-editor',
  'digital-sign': 'digital-sign-container',
  'validate-signature': 'validate-signature-container',
  'add-stamps': 'add-stamps-container',
  'add-watermark': 'add-watermark-container',
  'add-attachments': 'add-attachments-container',
  'extract-attachments': 'extract-attachments-container',
  'edit-attachments': 'edit-attachments-container',
  'add-blank-page': 'add-blank-page-container',
  'header-footer': 'header-footer-container',
  'background-color': 'background-color-container',
  'text-color': 'text-color-container',
  'invert-colors': 'invert-colors-container',
  'adjust-colors': 'adjust-colors-container',
  grayscale: 'grayscale-container',
  posterize: 'posterize-container',
  'rotate-custom': 'rotate-custom-container',
  rasterize: 'rasterize-container',
  flatten: 'flatten-container',
  linearize: 'linearize-container',
  sanitize: 'sanitize-container',

  // PDF Security & Metadata
  encrypt: 'encrypt-container',
  decrypt: 'decrypt-container',
  'change-permissions': 'change-permissions-container',
  'remove-metadata': 'remove-metadata-container',
  'edit-metadata': 'edit-metadata-container',
  'view-metadata': 'view-metadata-container',
  'remove-restrictions': 'remove-restrictions-container',
  'remove-annotations': 'remove-annotations-container',

  // PDF Analysis & Extraction
  'extract-images': 'extract-images-container',
  'extract-tables': 'extract-tables-container',
  ocr: 'ocr-container',
  'prepare-for-ai': 'prepare-for-ai-container',

  // PDF Quality & Repair
  deskew: 'deskew-container',
  'remove-blank-pages': 'remove-blank-pages-container',
  repair: 'repair-container',
  'fix-page-size': 'fix-page-size-container',
  'scanner-effect': 'scanner-effect-container',
  'scan-to-pdf': 'scan-to-pdf-container',

  // PDF Formatting & Layout
  booklet: 'booklet-container',
  'bates-numbering': 'bates-numbering-container',
  'table-of-contents': 'table-of-contents-container',
  bookmark: 'bookmark-container',
  layers: 'layers-container',
  'font-to-outline': 'font-to-outline-container',
  'pdf-to-pdfa': 'pdf-to-pdfa-container',
  'compare-pdfs': 'compare-pdfs-container',

  // Merge Variations
  'alternate-merge': 'alternate-merge-container',
  'combine-single-page': 'combine-single-page-container',

  // Advanced Tools
  'pdf-workflow': 'pdf-workflow-container',
  'form-creator': 'form-creator-container',
  'form-filler': 'form-filler-container',
};

export const PDF_ACCEPT = 'application/pdf,.pdf';

export const TOOL_UPLOAD_ACCEPT_MAP: Record<string, { accept: string; label: string }> = {
  'image-to-pdf': {
    accept: 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.heic,.tif,.tiff',
    label: 'image file',
  },
  'word-to-pdf': {
    accept:
      'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx',
    label: 'Word document (.doc or .docx)',
  },
  'jpg-to-pdf': { accept: 'image/jpeg,.jpg,.jpeg', label: 'JPG image (.jpg or .jpeg)' },
  'png-to-pdf': { accept: 'image/png,.png', label: 'PNG image (.png)' },
  'bmp-to-pdf': { accept: 'image/bmp,.bmp', label: 'BMP image (.bmp)' },
  'webp-to-pdf': { accept: 'image/webp,.webp', label: 'WebP image (.webp)' },
  'heic-to-pdf': { accept: 'image/heic,.heic', label: 'HEIC image (.heic)' },
  'svg-to-pdf': { accept: 'image/svg+xml,.svg', label: 'SVG file (.svg)' },
  'tiff-to-pdf': { accept: 'image/tiff,.tif,.tiff', label: 'TIFF image (.tif or .tiff)' },
  'email-to-pdf': {
    accept: 'message/rfc822,application/vnd.ms-outlook,.eml,.msg',
    label: 'email file (.eml or .msg)',
  },
  'txt-to-pdf': { accept: 'text/plain,.txt', label: 'text file (.txt)' },
  'csv-to-pdf': { accept: 'text/csv,.csv', label: 'CSV file (.csv)' },
  'json-to-pdf': { accept: 'application/json,text/json,.json', label: 'JSON file (.json)' },
  'markdown-to-pdf': {
    accept: 'text/markdown,text/plain,.md,.markdown',
    label: 'Markdown file (.md or .markdown)',
  },
  'excel-to-pdf': {
    accept:
      'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,.xlsx',
    label: 'Excel file (.xls or .xlsx)',
  },
  'powerpoint-to-pdf': {
    accept:
      'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.ppt,.pptx,.odp',
    label: 'PowerPoint file (.ppt, .pptx, or .odp)',
  },
  'epub-to-pdf': { accept: 'application/epub+zip,.epub', label: 'EPUB file (.epub)' },
  'mobi-to-pdf': {
    accept: 'application/x-mobipocket-ebook,.mobi',
    label: 'MOBI file (.mobi)',
  },
  'cbz-to-pdf': {
    accept: 'application/vnd.comicbook+zip,application/zip,.cbz',
    label: 'CBZ file (.cbz)',
  },
  'fb2-to-pdf': { accept: 'application/xml,text/xml,.fb2', label: 'FB2 file (.fb2)' },
  'rtf-to-pdf': { accept: 'application/rtf,text/rtf,.rtf', label: 'RTF file (.rtf)' },
  'odg-to-pdf': {
    accept: 'application/vnd.oasis.opendocument.graphics,.odg',
    label: 'ODG file (.odg)',
  },
  'odp-to-pdf': {
    accept: 'application/vnd.oasis.opendocument.presentation,.odp',
    label: 'ODP file (.odp)',
  },
  'ods-to-pdf': {
    accept: 'application/vnd.oasis.opendocument.spreadsheet,.ods',
    label: 'ODS file (.ods)',
  },
  'odt-to-pdf': {
    accept: 'application/vnd.oasis.opendocument.text,.odt',
    label: 'ODT file (.odt)',
  },
  'psd-to-pdf': {
    accept: 'image/vnd.adobe.photoshop,.psd',
    label: 'Photoshop file (.psd)',
  },
  'vsd-to-pdf': {
    accept: 'application/vnd.visio,.vsd,.vsdx',
    label: 'Visio file (.vsd or .vsdx)',
  },
  'wpd-to-pdf': { accept: '.wpd', label: 'WordPerfect file (.wpd)' },
  'wps-to-pdf': { accept: '.wps', label: 'WPS file (.wps)' },
  'pub-to-pdf': {
    accept: 'application/x-mspublisher,.pub',
    label: 'Publisher file (.pub)',
  },
  'xml-to-pdf': { accept: 'application/xml,text/xml,.xml', label: 'XML file (.xml)' },
  'xps-to-pdf': {
    accept: 'application/vnd.ms-xpsdocument,application/oxps,.xps',
    label: 'XPS file (.xps)',
  },
};

export function getUploadConfig(toolId: string | null): { accept: string; label: string } {
  if (!toolId) {
    return { accept: 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg', label: 'image file' };
  }

  return TOOL_UPLOAD_ACCEPT_MAP[toolId] ?? { accept: PDF_ACCEPT, label: 'PDF file (.pdf)' };
}

export function matchesAcceptRule(
  fileName: string,
  mimeType: string,
  acceptPattern: string
): boolean {
  const normalizedName = fileName.toLowerCase();
  const normalizedType = (mimeType || '').toLowerCase();
  const rules = acceptPattern
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (rules.length === 0) return true;

  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return normalizedName.endsWith(rule);
    }

    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -1);
      return normalizedType.startsWith(prefix);
    }

    return normalizedType === rule;
  });
}
