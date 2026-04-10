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

export interface PageDimensionsState {
  file: File | null;
  pdfDoc: any | null;
}

export interface PosterizeState {
  file: File | null;
  pdfDoc: any | null;
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
  signerName?: string;
  signDate?: string;
  reason?: string;
  location?: string;
  errors?: string[];
}

export interface ValidateSignatureState {
  file: File | null;
  pdfDoc: any | null;
  validationResult: SignatureValidationResult | null;
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
