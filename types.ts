export interface InputOption {
  id: string;
  label: string;
  icon: string;
}

export interface FileState {
  file: File | null;
  name: string;
  size: number;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  popular?: boolean;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface AddWatermarkState {
  file: File | null;
  pdfDoc: any | null;
  pdfBytes: Uint8Array | null;
  previewCanvas: HTMLCanvasElement | null;
  watermarkX: number;
  watermarkY: number;
}

export interface PageWatermarkConfig {
  type: 'text' | 'image';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  opacityText: number;
  angleText: number;
  imageDataUrl: string | null;
  imageFile: File | null;
  imageScale: number;
  opacityImage: number;
  angleImage: number;
}

export interface AlternateMergeState {
  files: File[];
  pdfBytes: Map<string, ArrayBuffer>;
  pdfDocs: Map<string, any>;
}

export interface FileEntry {
  file: File;
  pageCount: number;
}

export type Position =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right';

export interface StylePreset {
  template: string;
  padding: number;
}

export interface ChangePermissionsState {
  file: File | null;
}

export interface LinearizePdfState {
  files: File[];
}

export interface CombineSinglePageState {
  file: File | null;
  pdfDoc: any | null;
}

export interface CompareState {
  pdfDoc1: any | null;
  pdfDoc2: any | null;
  file1?: File | null;
  file2?: File | null;
  currentPage: number;
  viewMode: string;
  isSyncScroll: boolean;
}

export interface CropperState {
  file: File | null;
  pdfDoc: any | null;
  currentPageNum: number;
  cropper: any | null;
  originalPdfBytes: Uint8Array | null;
  pageCrops: Record<number, any>;
}

export interface DecryptPdfState {
  files: File[];
}

export interface DeletePagesState {
  file: File | null;
  pdfDoc: any | null;
  pdfJsDoc: any | null;
  totalPages: number;
  pagesToDelete: Set<number>;
}

export interface EditMetadataState {
  file: File | null;
}

export interface EncryptPdfState {
  file: File | null;
}

export interface OcrState {
  file: File | null;
  searchablePdfBytes: Uint8Array | null;
}

export interface BBox {
  x0: number; // left
  y0: number; // top (in hOCR coordinate system, origin at top-left)
  x1: number; // right
  y1: number; // bottom
}

export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export interface Baseline {
  slope: number;
  intercept: number;
}

export interface OcrLine {
  bbox: BBox;
  baseline: Baseline;
  textangle: number;
  words: OcrWord[];
  direction: 'ltr' | 'rtl';
  injectWordBreaks: boolean;
}

export interface OcrPage {
  width: number;
  height: number;
  dpi: number;
  lines: OcrLine[];
}

export interface WordTransform {
  x: number;
  y: number;
  fontSize: number;
  horizontalScale: number;
  rotation: number;
}

export interface PageDimensionsState {
  file: File | null;
  pdfDoc: any | null;
}

export interface PosterizeState {
  file: File | null;
  pdfDoc: any | null;
  pdfJsDoc: any | null;
  pdfBytes: Uint8Array | null;
  pageSnapshots: { [pageNum: number]: ImageData };
  currentPage: number;
}

export interface RemoveRestrictionsState {
  file: File | null;
}

export interface SanitizePdfState {
  file: File | null;
  pdfDoc: any | null;
}

export interface SignatureInfo {
  name: string;
  reason: string;
  location: string;
  contactInfo: string;
}

export interface VisibleSignatureOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number | string;
  text?: string;
  image?: string;
  enabled?: boolean;
  imageData?: ArrayBuffer | string;
  imageType?: string;
  textColor?: string;
  textSize?: number;
}

export interface DigitalSignState {
  file: File | null;
  pdfDoc: any | null;
  certificateFile: File | null;
  signatureInfo: SignatureInfo;
  visibleSignature: VisibleSignatureOptions | null;
  pdfFile: File | null;
  pdfBytes: Uint8Array | null;
  certFile: File | null;
  certData: any | null;
  sigImageData: ArrayBuffer | string | null;
  sigImageType: string | null;
}

export interface SignatureValidationResult {
  valid: boolean;
  isValid?: boolean;
  isExpired?: boolean;
  isTrusted?: boolean;
  isSelfSigned?: boolean;
  signerName?: string;
  signerOrg?: string;
  signerEmail?: string;
  issuer?: string;
  issuerOrg?: string;
  signatureDate?: string | Date;
  validFrom?: string | Date;
  validTo?: string | Date;
  reason?: string;
  location?: string;
  coverageStatus?: 'full' | 'partial' | 'none';
  serialNumber?: string;
  algorithms?: {
    digest: string;
    signature: string;
  };
  errorMessage?: string;
  errors?: string[];
}

export interface ValidateSignatureState {
  file: File | null;
  pdfDoc: any | null;
  validationResult: SignatureValidationResult | null;
  pdfFile: File | null;
  pdfBytes: Uint8Array | null;
  results: SignatureValidationResult[];
  trustedCertFile: File | null;
  trustedCert: any | null; // forge certificate object
}

export interface ViewMetadataState {
  file: File | null;
}

export interface ExtractImagesState {
  file: File | null;
  extractedImages: any[];
}

export interface EmailAttachment {
  filename: string;
  content: Uint8Array;
  contentType: string;
  size?: number;
  contentId?: string;
}

export interface ParsedEmail {
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: Date | string | null;
  rawDateString?: string;
  body?: string;
  htmlBody?: string;
  textBody?: string;
  attachments: EmailAttachment[];
}

export interface EmailRenderOptions {
  includeAttachments?: boolean;
  attachmentHandling?: 'list' | 'embed' | 'ignore';
  includeCcBcc?: boolean;
  pageSize?: string;
}

import type { PDFName, PDFObject } from 'pdf-lib';

export interface PDFDictLike {
  keys(): PDFName[];
  values(): PDFObject[];
  entries(): [PDFName, PDFObject][];
  set(key: PDFName, value: PDFObject): void;
  get(key: PDFName, preservePDFNull?: boolean): PDFObject | undefined;
  has(key: PDFName): boolean;
  delete(key: PDFName): boolean;
  lookup(key: PDFName): PDFObject | undefined;
  asArray?(): PDFObject[];
}

export interface WindowWithCoherentPdf {
  coherentpdf?: unknown;
}

export interface WindowWithLucide {
  lucide?: {
    createIcons(): void;
  };
}

export interface WindowWithI18next {
  i18next?: {
    t(key: string): string;
  };
}

export interface GlobalScopeWithGhostscript {
  loadGS?: (config: { baseUrl: string }) => Promise<GhostscriptDynamicInstance>;
  GhostscriptWASM?: new (url: string) => GhostscriptDynamicInstance;
}

export interface GhostscriptDynamicInstance {
  convertToPDFA?(pdfBuffer: ArrayBuffer, profile: string): Promise<ArrayBuffer>;
  fontToOutline?(pdfBuffer: ArrayBuffer): Promise<ArrayBuffer>;
  init?(): Promise<void>;
}

export interface PyMuPDFCompressOptions {
  images: {
    enabled: boolean;
    quality: number;
    dpiTarget: number;
    dpiThreshold: number;
    convertToGray: boolean;
  };
  scrub: {
    metadata: boolean;
    thumbnails: boolean;
    xmlMetadata?: boolean;
  };
  subsetFonts: boolean;
  save: {
    garbage: 4;
    deflate: boolean;
    clean: boolean;
    useObjstms: boolean;
  };
}

export interface PyMuPDFExtractTextOptions {
  format?: string;
  pages?: number[];
}

export interface PyMuPDFRasterizeOptions {
  dpi?: number;
  format?: string;
  pages?: number[];
  grayscale?: boolean;
  quality?: number;
}

export interface PyMuPDFDocument {
  pageCount: number;
  pages: (() => PyMuPDFPage[]) & PyMuPDFPage[];
  needsPass: boolean;
  isEncrypted: boolean;
  authenticate(password: string): boolean;
  getPage(index: number): PyMuPDFPage;
  save(): Uint8Array;
  close(): void;
  getLayerConfig?(): unknown[];
  addLayer?(name: string): { number: number; xref: number };
  setLayerConfig?(layers: unknown[]): void;
  setLayerVisibility?(xref: number, visible: boolean): void;
  deleteOCG?(xref: number): void;
  addOCGWithParent?(name: string, parentXref: number): { number: number; xref: number };
  addOCG?(name: string): { number: number; xref: number };
  applyRedactions?(): void;
  searchFor?(text: string, pageNum: number): unknown[];
}

export interface PyMuPDFPage {
  getText(format?: string): string;
  getImages(): Array<{ data: Uint8Array; ext: string; xref: number }>;
  extractTables?(): unknown[];
  findTables(): Array<{
    rows: (string | null)[][];
    markdown: string;
    rowCount: number;
    colCount: number;
  }>;
  extractImage(xref: number): { data: Uint8Array; ext: string } | null;
  toSvg?(): string;
  toPixmap?(options?: { dpi?: number }): {
    toBlob(format: string, quality?: number): Blob;
  };
  addRedactAnnot?(rect: unknown): void;
  searchFor(text: string): unknown[];
  addRedaction(rect: unknown, text: string, fill: unknown): void;
  applyRedactions(): void;
}

export interface PyMuPDFTextToPdfOptions {
  fontSize?: number;
  pageSize?: string;
  fontName?: string;
  textColor?: string;
  margins?: number;
}

export interface PyMuPDFDeskewOptions {
  threshold?: number;
  dpi?: number;
}

export interface PyMuPDFInstance {
  load(): Promise<void>;
  compressPdf(
    file: Blob,
    options: PyMuPDFCompressOptions
  ): Promise<{ blob: Blob; compressedSize: number; usedFallback?: boolean }>;
  convertToPdf(file: Blob | File, ext: string | { filetype: string }): Promise<Blob>;
  extractText(file: Blob, options?: PyMuPDFExtractTextOptions): Promise<string>;
  extractImages(file: Blob): Promise<Array<{ data: Uint8Array; ext: string }>>;
  extractTables(file: Blob): Promise<unknown[]>;
  toSvg(file: Blob, pageNum: number): Promise<string>;
  renderPageToImage(file: Blob, pageNum: number, scale: number): Promise<Blob>;
  getPageCount(file: Blob): Promise<number>;
  rasterizePdf(file: Blob | File, options: PyMuPDFRasterizeOptions): Promise<Blob>;
  open(file: Blob | File, password?: string): Promise<PyMuPDFDocument>;
  textToPdf(text: string, options?: PyMuPDFTextToPdfOptions): Promise<Blob>;
  pdfToDocx(file: Blob | File): Promise<Blob>;
  pdfToMarkdown(file: Blob | File, options?: { includeImages?: boolean }): Promise<string>;
  pdfToText(file: Blob | File): Promise<string>;
  deskewPdf(
    file: Blob,
    options?: PyMuPDFDeskewOptions
  ): Promise<{
    pdf: Blob;
    result: {
      totalPages: number;
      correctedPages: number;
      angles: number[];
      corrected: boolean[];
    };
  }>;
  imageToPdf(file: File, options?: { imageType?: string }): Promise<Blob>;
  imagesToPdf(files: File[]): Promise<Blob>;
  htmlToPdf(html: string, options: unknown): Promise<Blob>;
  pdfToLlamaIndex(file: File): Promise<unknown>;
}

export type { QpdfInstance as QpdfWasmInstance } from '@neslinesli93/qpdf-wasm';

export interface QpdfInstanceExtended {
  callMain: (args: string[]) => number;
  FS: EmscriptenFSExtended;
}

export interface EmscriptenFSExtended {
  mkdir: (path: string) => void;
  mount: (
    type: unknown,
    opts: { blobs: { name: string; data: Blob }[] },
    mountPoint: string
  ) => void;
  unmount: (mountPoint: string) => void;
  writeFile: (path: string, data: Uint8Array | string, opts?: { encoding?: string }) => void;
  readFile: (path: string, opts?: { encoding?: string }) => Uint8Array;
  unlink: (path: string) => void;
  analyzePath: (path: string) => { exists: boolean };
}

export interface CpdfInstance {
  setSlow: () => void;
  fromMemory: (data: Uint8Array, userpw: string) => unknown;
  isEncrypted: (pdf: unknown) => boolean;
  decryptPdf: (pdf: unknown, password: string) => void;
  decryptPdfOwner: (pdf: unknown, password: string) => void;
  toMemory: (pdf: unknown, linearize: boolean, makeId: boolean) => Uint8Array;
  deletePdf: (pdf: unknown) => void;
  startGetBookmarkInfo: (pdf: unknown) => void;
  numberBookmarks: () => number;
  getBookmarkLevel: (index: number) => number;
  getBookmarkPage: (pdf: unknown, index: number) => number;
  endGetBookmarkInfo: () => void;
  parsePagespec: (pdf: unknown, pagespec: string) => unknown;
  removePageLabels: (pdf: unknown) => void;
  all: (pdf: unknown) => unknown;
  addPageLabels: (
    pdf: unknown,
    style: unknown,
    prefix: string,
    offset: number,
    range: unknown,
    progress: boolean
  ) => void;
  decimalArabic: number;
  lowercaseRoman: number;
  uppercaseRoman: number;
  lowercaseLetters: number;
  uppercaseLetters: number;
  noLabelPrefixOnly?: number;
}

export interface ScannerEffectState {
  file: File | null;
}

export interface ScanSettings {
  grayscale: boolean;
  border: boolean;
  rotate: number;
  rotateVariance: number;
  brightness: number;
  contrast: number;
  blur: number;
  noise: number;
  yellowish: number;
  resolution: number;
}
