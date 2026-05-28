export * from './add-stamps';
export * from './bmp-to-pdf';
export * from './bookmark-pdf';
export * from './compress';
export * from './cropper';
export * from './delete-pages';
// export * from './digital-sign-pdf';
export * from './duplicate-organize';
export * from './edit-pdf';
export * from './email-to-pdf';
export * from './extract-pages';
// export * from './form-creator';
export * from './image-to-pdf';
// export * from './json-to-pdf';
export * from './md-to-pdf';
export * from './merge';
export * from './organize';
export * from './pdf-multi-tool';
// export * from './pdf-to-json';
export * from './pdf-to-markdown';
export { pdfToDocx as pdfToWord, setupPdfToDocxTool as setupPdfToWordTool } from './pdf-to-docx';
export * from './powerpoint-to-pdf';
// export * from './redact';
export * from './repair-pdf';
export * from './scan-to-pdf';
export * from './shortcuts';
export * from './sign-pdf';
export * from './split';
// export * from './table-of-contents';
export * from './validate-signature-pdf';
export * from './word-to-pdf-page';
export * from './rotate-pdf-page';
export { applyRotations } from './rotate-pdf-page';
export * from './reverse-pages-page';
export { reversePages } from './reverse-pages-page';
export * from './duplicate-organize';
export {
  processAndSave as duplicateProcessAndSave,
  setupDuplicateTool,
} from './duplicate-organize';
export * from './divide-pages-page';
export { setupDivideTool } from './divide-pages-page';
export * from './add-blank-page-page';
export { setupAddBlankPageTool } from './add-blank-page-page';
export * from './remove-blank-pages-page';
export { setupRemoveBlankPagesTool } from './remove-blank-pages-page';
export * from './page-numbers-page';
export { setupPageNumbersTool } from './page-numbers-page';
export * from './fix-page-size-page';
export { setupFixPageSizeTool } from './fix-page-size-page';
export { setupScannerEffectPage } from './scanner-effect-page';
export * from './n-up-pdf-page';
export { setupNUpTool } from './n-up-pdf-page';
export * from './png-to-pdf-page';
export { pngToPdf } from './png-to-pdf-page';
export * from './webp-to-pdf-page';
export { webpToPdf } from './webp-to-pdf-page';
export * from './heic-to-pdf-page';
export { heicToPdf } from './heic-to-pdf-page';
export * from './svg-to-pdf-page';
export { svgToPdf } from './svg-to-pdf-page';
export * from './tiff-to-pdf-page';
export { tiffToPdf } from './tiff-to-pdf-page';
export * from './txt-to-pdf-page';
export { txtToPdf } from './txt-to-pdf-page';
export * from './csv-to-pdf-page';
export { csvToPdf } from './csv-to-pdf-page';
export * from './json-to-pdf';
export { jsonToPdf } from './json-to-pdf';
export * from './md-to-pdf';
export { mdToPdf } from './md-to-pdf';
export * from './excel-to-pdf-page';
export { excelToPdf } from './excel-to-pdf-page';
export * from './excel-to-csv-page';
export { excelToCsv } from './excel-to-csv-page';
export * from './epub-to-pdf-page';
export { epubToPdf } from './epub-to-pdf-page';
export * from './pdf-to-jpg-page';
export { pdfToJpg, setupPdfToJpgTool } from './pdf-to-jpg-page';
export * from './pdf-to-png-page';
export { pdfToPng, setupPdfToPngTool } from './pdf-to-png-page';
export { pdfToBmp } from './pdf-to-bmp-page';
export { pdfToWebp } from './pdf-to-webp-page';
export { pdfToSvg } from './pdf-to-svg-page';
export { pdfToTiff } from './pdf-to-tiff-page';
export { pdfToText } from './pdf-to-text-page';
export { pdfToExcel } from './pdf-to-excel-page';
export { pdfToCsv } from './pdf-to-csv-page';
export { pdfToJson } from './pdf-to-json';
export { pdfToMarkdown } from './pdf-to-markdown';
export { pdfToZip } from './pdf-to-zip-page';
export { validateSignaturePdf } from './validate-signature-pdf';
export { addStampsToPdf } from './add-stamps';
export { addWatermarkToPdf } from './add-watermark-page';
export { addAttachmentsToPdf } from './add-attachments-page';
export { extractAttachmentsFromPdf } from './extract-attachments-page';
export { listAttachmentsFromPdf, removeAttachmentsFromPdf } from './edit-attachments-page';
export { addHeaderFooterToPdf } from './header-footer-page';
export { changeBackgroundColorOfPdf } from './background-color-page';
export { changeTextColorOfPdf } from './text-color-page';
export { invertColorsOfPdf } from './invert-colors-page';
export { adjustColorsOfPdf } from './adjust-colors-page';
export { convertPdfToGreyscale } from './pdf-to-greyscale-page';
export { posterizePdf, type PosterizeOptions } from './posterize-page';
export { rotateCustomAngle } from './rotate-custom-page';
export { rasterizePdf, type RasterizeOptions } from './rasterize-pdf-page';
export { flattenPdf } from './flatten-pdf-page';
export { linearizePdf } from './linearize-pdf-page';
export { sanitizePdfDocument, type SanitizeOptions } from './sanitize-pdf-page';
export { encryptPdfDocument, setupEncryptPdfPage, type EncryptOptions } from './encrypt-pdf-page';
export { decryptPdfDocument, setupDecryptPdfPage, type DecryptOptions } from './decrypt-pdf-page';
export {
  changePermissionsPdf,
  setupChangePermissionsPage,
  type ChangePermissionsOptions,
} from './change-permissions-page';
export {
  removeMetadataPdf,
  setupRemoveMetadataPage,
  type RemoveMetadataOptions,
} from './remove-metadata-page';
export {
  editMetadataPdf,
  getMetadataPdf,
  setupEditMetadataPage,
  type EditMetadataOptions,
} from './edit-metadata-page';
export {
  viewMetadataPdf,
  displayMetadataInUI,
  setupViewMetadataPage,
  type ViewMetadataResult,
} from './view-metadata-page';
export {
  removeRestrictionsPdf,
  setupRemoveRestrictionsPage,
  type RemoveRestrictionsOptions,
} from './remove-restrictions-page';
export {
  removeAnnotationsPdf,
  setupRemoveAnnotationsPage,
  type RemoveAnnotationsOptions,
} from './remove-annotations-page';
export {
  extractImagesPdf,
  downloadImagesAsZip,
  setupExtractImagesPage,
  displayExtractedImages,
  type ExtractedImage,
  type ExtractImagesOptions,
} from './extract-images-page';
export { extractTables, setupExtractTablesPage } from './extract-tables-page';
export { setupOcrTool } from './ocr-pdf-page';
export { setupPrepareForAiPage } from './prepare-pdf-for-ai-page';
export { setupDeskewPage } from './deskew-pdf-page';
export { setupRepairPage } from './repair-pdf-page';
export { setupBookletPage } from './pdf-booklet-page';
export { setupBatesNumberingPage } from './bates-numbering-page';
// Note: digital-sign-pdf-page.ts uses DOMContentLoaded and is not exported as a function
