import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import FileUploader from './components/FileUploader';
import ExtensionSelector from './components/ExtensionSelector';
import CloudFilePicker from './components/CloudFilePicker';
import { FileState } from './types';
import {
  merge,
  setupMergeTool,
  split,
  setupSplitTool,
  compress,
  setupCompressTool,
  applyAndSaveSignatures,
  setupSignTool,
  setupCropperTool,
  extractPages,
  setupExtractPagesTool,
  organize,
  setupOrganizeTool,
  deletePages,
  setupDeletePagesTool,
  imageToPdf,
  pngToPdf,
  bmpToPdf,
  webpToPdf,
  heicToPdf,
  svgToPdf,
  tiffToPdf,
  emailToPdf,
  txtToPdf,
  csvToPdf,
  jsonToPdf,
  mdToPdf,
  excelToPdf,
  epubToPdf,
  pdfToJpg,
  setupPdfToJpgTool,
  pdfToPng,
  setupPdfToPngTool,
  pdfToBmp,
  pdfToWebp,
  pdfToSvg,
  pdfToTiff,
  pdfToText,
  pdfToExcel,
  pdfToCsv,
  pdfToJson,
  pdfToMarkdown,
  pdfToZip,
  validateSignaturePdf,
  addStampsToPdf,
  addWatermarkToPdf,
  setupEditPDFTool,
  pdfToWord,
  setupPdfToWordTool,
  wordToPdf,
  setupWordToPdfTool,
  powerpointToPdf,
  setupPowerpointToPdfTool,
  setupRotateTool as setupRotateToolImpl,
  setupReverseTool as setupReverseToolImpl,
  setupDuplicateTool as setupDuplicateToolImpl,
  setupDivideTool as setupDivideToolImpl,
  setupAddBlankPageTool as setupAddBlankPageToolImpl,
  setupRemoveBlankPagesTool as setupRemoveBlankPagesToolImpl,
  setupPageNumbersTool as setupPageNumbersToolImpl,
  setupFixPageSizeTool as setupFixPageSizeToolImpl,
  setupNUpTool as setupNUpToolImpl,
} from './tools';
import { addAttachmentsToPdf } from './tools/add-attachments-page';
import { extractAttachmentsFromPdf } from './tools/extract-attachments-page';
import { listAttachmentsFromPdf, removeAttachmentsFromPdf } from './tools/edit-attachments-page';
import { addHeaderFooterToPdf } from './tools/header-footer-page';
import { changeBackgroundColorOfPdf } from './tools/background-color-page';
import { changeTextColorOfPdf } from './tools/text-color-page';
import { invertColorsOfPdf } from './tools/invert-colors-page';
import { adjustColorsOfPdf } from './tools/adjust-colors-page';
import { convertPdfToGreyscale } from './tools/pdf-to-greyscale-page';
import { posterizePdf, type PosterizeOptions } from './tools/posterize-page';
import { rotateCustomAngle } from './tools/rotate-custom-page';
import { rasterizePdf, type RasterizeOptions } from './tools/rasterize-pdf-page';
import { flattenPdf } from './tools/flatten-pdf-page';
import { linearizePdf } from './tools/linearize-pdf-page';
import { sanitizePdfDocument, type SanitizeOptions } from './tools/sanitize-pdf-page';
import { encryptPdfDocument, type EncryptOptions } from './tools/encrypt-pdf-page';
import { decryptPdfDocument, type DecryptOptions } from './tools/decrypt-pdf-page';
import { changePermissionsPdf, type ChangePermissionsOptions } from './tools/change-permissions-page';
import { removeMetadataPdf, type RemoveMetadataOptions } from './tools/remove-metadata-page';
import { editMetadataPdf, getMetadataPdf, type EditMetadataOptions } from './tools/edit-metadata-page';
import { viewMetadataPdf, displayMetadataInUI, type ViewMetadataResult } from './tools/view-metadata-page';
import { removeRestrictionsPdf, type RemoveRestrictionsOptions } from './tools/remove-restrictions-page';
import { removeAnnotationsPdf, type RemoveAnnotationsOptions } from './tools/remove-annotations-page';
import { extractImagesPdf, downloadImagesAsZip, displayExtractedImages, type ExtractedImage, type ExtractImagesOptions } from './tools/extract-images-page';
import type { AdjustColorsSettings } from './types/adjust-colors-type';
import { state, setFiles } from './state';
import { showAlert, showLoader, hideLoader } from './ui';
import {
  initiateOAuth,
  downloadGoogleDriveFile,
  downloadOneDriveFile,
  downloadDropboxFile,
} from './utils/oauth';
import { isOAuthConfigured } from './config/oauth.config';
import { INPUT_OPTIONS, POPULAR_TOOLS } from './config/constants';

interface AppProps {
  initialTool?: string;
}

const App: React.FC<AppProps> = ({ initialTool }) => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<FileState | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [isConverted, setIsConverted] = useState<boolean>(true); // Default true to show the full UI as per mockup initially
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [cloudProvider, setCloudProvider] = useState<'googleDrive' | 'oneDrive' | 'dropbox' | null>(
    null
  );
  const [cloudAccessToken, setCloudAccessToken] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showUploadForTool, setShowUploadForTool] = useState<boolean>(false);

  const TOOL_CONTAINER_MAP: Record<string, string> = {
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

  const PDF_ACCEPT = 'application/pdf,.pdf';
  const TOOL_UPLOAD_ACCEPT_MAP: Record<string, { accept: string; label: string }> = {
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

  const getUploadConfig = (toolId: string | null) => {
    if (!toolId) {
      return { accept: 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg', label: 'image file' };
    }

    return TOOL_UPLOAD_ACCEPT_MAP[toolId] ?? { accept: PDF_ACCEPT, label: 'PDF file (.pdf)' };
  };

  const matchesAcceptRule = (
    fileName: string,
    mimeType: string,
    acceptPattern: string
  ): boolean => {
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
  };

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Effect to simulate progress when conversion starts
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isConverting) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Increment by a random amount between 5 and 15
          return Math.min(prev + Math.floor(Math.random() * 15) + 5, 100);
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isConverting]);

  // Effect to handle completion
  useEffect(() => {
    if (isConverting && progress === 100) {
      const timer = setTimeout(() => {
        setIsConverting(false);
        setIsConverted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, isConverting]);

  useEffect(() => {
    if (!initialTool) return;
    const isValidTool = POPULAR_TOOLS.some((tool) => tool.id === initialTool);
    if (!isValidTool) return;
    setSelectedTool(initialTool);
    setShowUploadForTool(true);
    setIsConverted(false);
    requestAnimationFrame(() => scrollToElement('upload-section'));
  }, [initialTool]);

  // Setup attachment UI interactions
  useEffect(() => {
    const attachmentInput = document.getElementById('attachment-files-input') as HTMLInputElement;
    const attachmentFileList = document.getElementById('attachment-file-list');
    const pageRangeWrapper = document.getElementById('page-range-wrapper');
    const attachmentLevelRadios = document.querySelectorAll('input[name="attachment-level"]');

    const updateAttachmentList = () => {
      if (!attachmentInput || !attachmentFileList) return;
      
      attachmentFileList.innerHTML = '';
      const files = attachmentInput.files;

      if (files && files.length > 0) {
        Array.from(files).forEach((file) => {
          const div = document.createElement('div');
          div.className = 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md';

          const nameSpan = document.createElement('span');
          nameSpan.className = 'truncate text-sm text-gray-700 dark:text-gray-300';
          nameSpan.textContent = file.name;

          const sizeSpan = document.createElement('span');
          sizeSpan.className = 'text-xs text-gray-500 dark:text-gray-400 ml-2';
          sizeSpan.textContent = `${(file.size / 1024).toFixed(1)} KB`;

          div.append(nameSpan, sizeSpan);
          attachmentFileList.appendChild(div);
        });
      }
    };

    const handleRadioChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.value === 'page' && pageRangeWrapper) {
        pageRangeWrapper.classList.remove('hidden');
      } else if (pageRangeWrapper) {
        pageRangeWrapper.classList.add('hidden');
      }
    };

    if (attachmentInput) {
      attachmentInput.addEventListener('change', updateAttachmentList);
    }

    attachmentLevelRadios.forEach((radio) => {
      radio.addEventListener('change', handleRadioChange);
    });

    return () => {
      if (attachmentInput) {
        attachmentInput.removeEventListener('change', updateAttachmentList);
      }
      attachmentLevelRadios.forEach((radio) => {
        radio.removeEventListener('change', handleRadioChange);
      });
    };
  }, [selectedTool]);

  const handleFileSelect = async (file: FileState, allFiles?: File[]) => {
    setSelectedFile(file);
    setIsConverted(false);
    setIsConverting(false);

    // Update global state with selected file(s)
    if (allFiles && allFiles.length > 0) {
      // Multiple files (for merge tool or image-to-pdf)
      setFiles(allFiles);
    } else if (file.file) {
      // Single file
      setFiles([file.file]);
    }

    // If a tool was selected, execute it after file upload
    if (selectedTool) {
      setShowUploadForTool(false);
      await executeToolAfterUpload(selectedTool);
    }
  };

  const startConversion = () => {
    setIsConverting(true);
  };

  const handleSourceSelect = async (id: string) => {
    setSelectedSource(id);
    const uploadConfig = getUploadConfig(selectedTool);

    if (id === 'url') {
      setUrlInput('');
    } else if (id === 'gdrive' || id === 'onedrive' || id === 'dropbox') {
      const providerMap = {
        gdrive: 'googleDrive' as const,
        onedrive: 'oneDrive' as const,
        dropbox: 'dropbox' as const,
      };

      const provider = providerMap[id as keyof typeof providerMap];

      // Check if OAuth is configured
      if (!isOAuthConfigured(provider)) {
        alert(
          `${provider === 'googleDrive' ? 'Google Drive' : provider === 'oneDrive' ? 'OneDrive' : 'Dropbox'} OAuth is not configured.\n\nTo enable cloud storage import:\n1. Follow setup instructions in config/oauth.config.ts\n2. Add your OAuth credentials to .env file\n\nFalling back to local file picker...`
        );

        // Fallback to local file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = uploadConfig.accept;

        const filePromise = new Promise<File | null>((resolve) => {
          input.onchange = () => {
            const file = input.files?.[0];
            resolve(file || null);
          };
          input.oncancel = () => resolve(null);
        });

        input.click();

        const file = await filePromise;
        if (file) {
          if (!matchesAcceptRule(file.name, file.type, uploadConfig.accept)) {
            alert(`Invalid file type. Please upload a valid ${uploadConfig.label}.`);
            setSelectedSource('');
            return;
          }

          handleFileSelect({
            file: file,
            name: file.name,
            size: file.size,
          });
        }

        setSelectedSource('');
        return;
      }

      // Initiate OAuth flow
      try {
        const accessToken = await initiateOAuth(provider);
        setCloudAccessToken(accessToken);
        setCloudProvider(provider);
        setShowCloudPicker(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('OAuth error:', error);
        alert(
          `Failed to connect to ${provider === 'googleDrive' ? 'Google Drive' : provider === 'oneDrive' ? 'OneDrive' : 'Dropbox'}: ${error.message}`
        );
      }

      setSelectedSource('');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCloudFileSelect = async (cloudFile: any) => {
    try {
      setShowCloudPicker(false);
      const uploadConfig = getUploadConfig(selectedTool);

      let blob: Blob;

      if (cloudProvider === 'googleDrive') {
        blob = await downloadGoogleDriveFile(cloudFile.id, cloudAccessToken);
      } else if (cloudProvider === 'oneDrive') {
        blob = await downloadOneDriveFile(cloudFile.downloadUrl, cloudAccessToken);
      } else if (cloudProvider === 'dropbox') {
        blob = await downloadDropboxFile(cloudFile.path, cloudAccessToken);
      } else {
        throw new Error('Unknown cloud provider');
      }

      const file = new File([blob], cloudFile.name, { type: blob.type });

      if (!matchesAcceptRule(file.name, file.type, uploadConfig.accept)) {
        throw new Error(`Invalid file type. Please upload a valid ${uploadConfig.label}.`);
      }

      handleFileSelect({
        file: file,
        name: cloudFile.name,
        size: blob.size,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error downloading cloud file:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const handleToolSelect = async (id: string) => {
    // Clean up all previous tool UI containers
    Object.values(TOOL_CONTAINER_MAP).forEach((containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        container.classList.add('hidden');
      }
    });

    // For PDF tools, redirect to upload section first
    setSelectedTool(id);
    setShowUploadForTool(true);
    setIsConverted(false);
    setSelectedFile(null);

    router.push(`/tools/${id}`);

    // Scroll to upload section
    requestAnimationFrame(() => scrollToElement('upload-section'));
  };

  // Process functions for tools
  const processAddAttachments = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const attachmentInput = document.getElementById('attachment-files-input') as HTMLInputElement;
    const attachments = attachmentInput?.files;

    if (!attachments || attachments.length === 0) {
      showAlert('No Attachments', 'Please select at least one file to attach.');
      return;
    }

    const attachmentLevel = (
      document.querySelector('input[name="attachment-level"]:checked') as HTMLInputElement
    )?.value || 'document';

    let pageRange = '';
    if (attachmentLevel === 'page') {
      const pageRangeInput = document.getElementById('attachment-page-range') as HTMLInputElement;
      pageRange = pageRangeInput?.value?.trim() || '';
    }

    // Use the function from add-attachments-page.ts
    const success = await addAttachmentsToPdf(
      attachments,
      attachmentLevel as 'document' | 'page',
      pageRange
    );

    // Reset the attachment input on success
    if (success && attachmentInput) {
      attachmentInput.value = '';
      const attachmentFileList = document.getElementById('attachment-file-list');
      if (attachmentFileList) {
        attachmentFileList.innerHTML = '';
      }
    }
  };

  const processExtractAttachments = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from extract-attachments-page.ts
    await extractAttachmentsFromPdf();
  };

  const [editAttachments, setEditAttachments] = useState<Array<{name: string; index: number; page: number}>>([]);
  const [selectedAttachmentsToRemove, setSelectedAttachmentsToRemove] = useState<Set<number>>(new Set());

  const processEditAttachments = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // First, list attachments
    const attachments = await listAttachmentsFromPdf();
    setEditAttachments(attachments);
    
    return attachments;
  };

  const processRemoveAttachments = async (indicesToRemove: number[]) => {
    if (indicesToRemove.length === 0) {
      showAlert('No Changes', 'No attachments selected for removal.');
      return;
    }

    // Use the function from edit-attachments-page.ts
    const success = await removeAttachmentsFromPdf(indicesToRemove);
    
    if (success) {
      setEditAttachments([]);
      setSelectedAttachmentsToRemove(new Set());
    }
  };

  const processHeaderFooter = async (options: {
    headerLeft?: string;
    headerCenter?: string;
    headerRight?: string;
    footerLeft?: string;
    footerCenter?: string;
    footerRight?: string;
    fontSize?: number;
    fontColor?: string;
    pageRange?: string;
  }) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from header-footer-page.ts
    await addHeaderFooterToPdf(options);
  };

  const processBackgroundColor = async (colorHex: string) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from background-color-page.ts
    await changeBackgroundColorOfPdf(colorHex);
  };

  const processTextColor = async (colorHex: string) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from text-color-page.ts
    await changeTextColorOfPdf(colorHex);
  };

  const processInvertColors = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from invert-colors-page.ts
    await invertColorsOfPdf();
  };

  const processAdjustColors = async (settings: AdjustColorsSettings) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from adjust-colors-page.ts
    await adjustColorsOfPdf(settings);
  };

  const processConvertToGreyscale = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from pdf-to-greyscale-page.ts
    await convertPdfToGreyscale();
  };

  const processPosterize = async (options: PosterizeOptions) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from posterize-page.ts
    await posterizePdf(options);
  };

  const processRotateCustom = async (angle: number) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from rotate-custom-page.ts
    await rotateCustomAngle(angle);
  };

  const processRasterize = async (options: RasterizeOptions) => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from rasterize-pdf-page.ts
    await rasterizePdf(options);
  };

  const processFlatten = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from flatten-pdf-page.ts
    await flattenPdf();
  };

  const processLinearize = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    // Use the function from linearize-pdf-page.ts
    await linearizePdf(state.files);
  };

  const processSanitize = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    showLoader('Sanitizing PDF...');

    try {
      // Get options from UI
      const options: SanitizeOptions = {
        flattenForms: (document.getElementById('sanitize-flatten-forms') as HTMLInputElement)?.checked || false,
        removeMetadata: (document.getElementById('sanitize-remove-metadata') as HTMLInputElement)?.checked || false,
        removeAnnotations: (document.getElementById('sanitize-remove-annotations') as HTMLInputElement)?.checked || false,
        removeJavascript: (document.getElementById('sanitize-remove-javascript') as HTMLInputElement)?.checked || false,
      };

      const hasAnyOption = Object.values(options).some(Boolean);
      if (!hasAnyOption) {
        hideLoader();
        showAlert('No Options Selected', 'Please select at least one sanitization option.');
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const sanitizedBytes = await sanitizePdfDocument(new Uint8Array(arrayBuffer), options);

      // Download the result
      const blob = new Blob([sanitizedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanitized_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      showAlert('Success', 'PDF has been sanitized and downloaded.', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Sanitize error:', error);
      showAlert('Error', `Failed to sanitize PDF: ${error.message}`);
    }
  };

  const processEncrypt = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get passwords from UI
    const userPassword = (document.getElementById('encrypt-user-password') as HTMLInputElement)?.value || '';
    const ownerPassword = (document.getElementById('encrypt-owner-password') as HTMLInputElement)?.value || '';
    const addRestrictions = (document.getElementById('encrypt-add-restrictions') as HTMLInputElement)?.checked || false;

    if (!userPassword) {
      showAlert('Password Required', 'Please enter a user password.');
      return;
    }

    showLoader('Encrypting PDF with 256-bit AES...');

    try {
      const options: EncryptOptions = {
        userPassword,
        ownerPassword: ownerPassword || undefined,
        addRestrictions
      };

      const encryptedBlob = await encryptPdfDocument(file, options);

      // Download the result
      const url = URL.createObjectURL(encryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encrypted_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      
      let successMessage = 'PDF encrypted successfully with 256-bit AES!';
      if (!ownerPassword || ownerPassword === userPassword) {
        successMessage += ' Note: Without a separate owner password, the PDF has no usage restrictions.';
      }
      
      showAlert('Success', successMessage, 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Encrypt error:', error);
      showAlert('Error', `Failed to encrypt PDF: ${error.message}`);
    }
  };

  const processDecrypt = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get password from UI
    const password = (document.getElementById('decrypt-password') as HTMLInputElement)?.value || '';

    if (!password) {
      showAlert('Password Required', 'Please enter the PDF password.');
      return;
    }

    showLoader('Decrypting PDF...');

    try {
      const options: DecryptOptions = {
        password
      };

      const decryptedBlob = await decryptPdfDocument(file, options);

      // Download the result
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decrypted_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      showAlert('Success', 'PDF decrypted successfully! Password protection has been removed.', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Decrypt error:', error);
      showAlert('Error', `Failed to decrypt PDF: ${error.message}`);
    }
  };

  const processChangePermissions = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get passwords and permissions from UI
    const currentPassword = (document.getElementById('permissions-current-password') as HTMLInputElement)?.value || '';
    const newUserPassword = (document.getElementById('permissions-user-password') as HTMLInputElement)?.value || '';
    const newOwnerPassword = (document.getElementById('permissions-owner-password') as HTMLInputElement)?.value || '';
    
    const allowPrint = (document.getElementById('permissions-allow-print') as HTMLInputElement)?.checked !== false;
    const allowModify = (document.getElementById('permissions-allow-modify') as HTMLInputElement)?.checked !== false;
    const allowCopy = (document.getElementById('permissions-allow-copy') as HTMLInputElement)?.checked !== false;
    const allowAnnotate = (document.getElementById('permissions-allow-annotate') as HTMLInputElement)?.checked !== false;

    showLoader('Updating PDF permissions...');

    try {
      const options: ChangePermissionsOptions = {
        currentPassword: currentPassword || undefined,
        newUserPassword: newUserPassword || undefined,
        newOwnerPassword: newOwnerPassword || undefined,
        permissions: {
          print: allowPrint,
          modify: allowModify,
          copy: allowCopy,
          annotate: allowAnnotate,
        }
      };

      const resultBlob = await changePermissionsPdf(file, options);

      // Download the result
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `permissions_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      
      let successMessage = 'PDF permissions updated successfully!';
      if (!newUserPassword && !newOwnerPassword) {
        successMessage = 'PDF decrypted successfully! All encryption and restrictions have been removed.';
      }
      
      showAlert('Success', successMessage, 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Change permissions error:', error);
      showAlert('Error', `Failed to change PDF permissions: ${error.message}`);
    }
  };

  const processRemoveMetadata = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get options from UI
    const removeDocumentInfo = (document.getElementById('remove-document-info') as HTMLInputElement)?.checked !== false;
    const removeXmpMetadata = (document.getElementById('remove-xmp-metadata') as HTMLInputElement)?.checked !== false;
    const removePieceInfo = (document.getElementById('remove-piece-info') as HTMLInputElement)?.checked !== false;
    const removeDocumentIds = (document.getElementById('remove-document-ids') as HTMLInputElement)?.checked !== false;

    showLoader('Removing metadata from PDF...');

    try {
      const options: RemoveMetadataOptions = {
        removeDocumentInfo,
        removeXmpMetadata,
        removePieceInfo,
        removeDocumentIds
      };

      const resultBlob = await removeMetadataPdf(file, options);

      // Download the result
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `no-metadata_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      showAlert('Success', 'Metadata removed successfully! Hidden information has been cleaned from the PDF.', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Remove metadata error:', error);
      showAlert('Error', `Failed to remove metadata: ${error.message}`);
    }
  };

  const processEditMetadata = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get metadata from UI
    const title = (document.getElementById('edit-meta-title') as HTMLInputElement)?.value || '';
    const author = (document.getElementById('edit-meta-author') as HTMLInputElement)?.value || '';
    const subject = (document.getElementById('edit-meta-subject') as HTMLInputElement)?.value || '';
    const keywordsStr = (document.getElementById('edit-meta-keywords') as HTMLInputElement)?.value || '';
    const creator = (document.getElementById('edit-meta-creator') as HTMLInputElement)?.value || '';
    const producer = (document.getElementById('edit-meta-producer') as HTMLInputElement)?.value || '';

    const keywords = keywordsStr
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    showLoader('Updating PDF metadata...');

    try {
      const options: EditMetadataOptions = {
        title,
        author,
        subject,
        keywords,
        creator,
        producer,
        modificationDate: new Date()
      };

      const resultBlob = await editMetadataPdf(file, options);

      // Download the result
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      showAlert('Success', 'PDF metadata updated successfully!', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Edit metadata error:', error);
      showAlert('Error', `Failed to update metadata: ${error.message}`);
    }
  };

  const processViewMetadata = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];

    showLoader('Reading PDF metadata...');

    try {
      const result: ViewMetadataResult = await viewMetadataPdf(file);
      
      hideLoader();
      
      // Display the metadata in the UI
      displayMetadataInUI(result);
      
      showAlert('Success', 'PDF metadata loaded successfully!', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('View metadata error:', error);
      showAlert('Error', `Failed to read metadata: ${error.message}`);
    }
  };

  const processRemoveRestrictions = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get password from UI
    const password = (document.getElementById('restrictions-password') as HTMLInputElement)?.value || '';

    showLoader('Removing PDF restrictions...');

    try {
      const options: RemoveRestrictionsOptions = {
        password: password || undefined
      };

      const resultBlob = await removeRestrictionsPdf(file, options);

      // Download the result
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unrestricted_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      showAlert('Success', 'PDF restrictions removed successfully! The file is now fully editable and printable.', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Remove restrictions error:', error);
      showAlert('Error', `Failed to remove restrictions: ${error.message}`);
    }
  };

  const processRemoveAnnotations = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];

    showLoader('Removing annotations from PDF...');

    try {
      const options: RemoveAnnotationsOptions = {
        removeAllAnnotations: true
      };

      const resultBlob = await removeAnnotationsPdf(file, options);

      // Download the result
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `no-annotations_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      hideLoader();
      showAlert('Success', 'All annotations removed successfully!', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Remove annotations error:', error);
      showAlert('Error', `Failed to remove annotations: ${error.message}`);
    }
  };

  // State for extracted images
  let extractedImages: ExtractedImage[] = [];

  const processExtractImages = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a PDF file first.');
      return;
    }

    const file = state.files[0];
    
    // Get options from UI
    const format = (document.getElementById('image-format') as HTMLSelectElement)?.value as 'original' | 'png' | 'jpg' || 'original';
    const minWidth = parseInt((document.getElementById('min-width') as HTMLInputElement)?.value || '0');
    const minHeight = parseInt((document.getElementById('min-height') as HTMLInputElement)?.value || '0');

    showLoader('Extracting images from PDF...');

    try {
      const options: ExtractImagesOptions = {
        format,
        minWidth,
        minHeight
      };

      extractedImages = await extractImagesPdf(file, options);

      hideLoader();

      if (extractedImages.length === 0) {
        showAlert('No Images Found', 'No images were found in this PDF that match the filter criteria.');
        return;
      }

      // Display extracted images
      displayExtractedImages(extractedImages);
      
      showAlert('Success', `Successfully extracted ${extractedImages.length} image(s) from the PDF!`, 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Extract images error:', error);
      showAlert('Error', `Failed to extract images: ${error.message}`);
    }
  };

  const processDownloadImagesZip = async () => {
    if (extractedImages.length === 0) {
      showAlert('No Images', 'Please extract images first.');
      return;
    }

    showLoader('Creating ZIP archive...');

    try {
      const filename = state.files[0] ? `${state.files[0].name.replace('.pdf', '')}_images.zip` : 'extracted_images.zip';
      await downloadImagesAsZip(extractedImages, filename);
      
      hideLoader();
      showAlert('Success', 'Images downloaded as ZIP file!', 'success');
    } catch (error: any) {
      hideLoader();
      console.error('Download ZIP error:', error);
      showAlert('Error', `Failed to download ZIP: ${error.message}`);
    }
  };

  const processWordToPdf = async () => {
    if (state.files.length === 0) {
      showAlert('No File', 'Please upload a Word document first.');
      return;
    }

    await wordToPdf(state.files);
  };

  // Generic setup function for tools
  const setupGenericTool = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.classList.remove('hidden');
    }
  };

  // PDF Manipulation Setup Functions
  const setupRotateTool = () => setupRotateToolImpl();
  const setupReverseTool = () => setupReverseToolImpl();
  const setupDuplicateTool = () => setupDuplicateToolImpl();
  const setupDivideTool = () => setupDivideToolImpl();
  const setupAddBlankPageTool = () => {
    console.log('[App] setupAddBlankPageTool wrapper called');
    return setupAddBlankPageToolImpl();
  };
  const setupRemoveBlankPagesTool = () => setupRemoveBlankPagesToolImpl();
  const setupPageNumbersTool = () => setupPageNumbersToolImpl();
  const setupPageDimensionsTool = () => setupFixPageSizeToolImpl();
  const setupNUpTool = () => setupNUpToolImpl();

  // PDF Conversions - To PDF Setup Functions
  const setupJpgToPdfTool = () => setupGenericTool('jpg-to-pdf-container');
  const setupPngToPdfTool = () => setupGenericTool('png-to-pdf-container');
  const setupBmpToPdfTool = () => setupGenericTool('bmp-to-pdf-container');
  const setupWebpToPdfTool = () => setupGenericTool('webp-to-pdf-container');
  const setupHeicToPdfTool = () => setupGenericTool('heic-to-pdf-container');
  const setupSvgToPdfTool = () => setupGenericTool('svg-to-pdf-container');
  const setupTiffToPdfTool = () => setupGenericTool('tiff-to-pdf-container');
  const setupEmailToPdfTool = () => setupGenericTool('email-to-pdf-container');
  const setupTxtToPdfTool = () => setupGenericTool('txt-to-pdf-container');
  const setupCsvToPdfTool = () => setupGenericTool('csv-to-pdf-container');
  const setupJsonToPdfTool = () => setupGenericTool('json-to-pdf-container');
  const setupMarkdownToPdfTool = () => setupGenericTool('markdown-to-pdf-container');
  const setupExcelToPdfTool = () => setupGenericTool('excel-to-pdf-container');
  const setupEpubToPdfTool = () => setupGenericTool('epub-to-pdf-container');
  const setupMobiToPdfTool = () => setupGenericTool('mobi-to-pdf-container');
  const setupCbzToPdfTool = () => setupGenericTool('cbz-to-pdf-container');
  const setupFb2ToPdfTool = () => setupGenericTool('fb2-to-pdf-container');
  const setupRtfToPdfTool = () => setupGenericTool('rtf-to-pdf-container');
  const setupOdgToPdfTool = () => setupGenericTool('odg-to-pdf-container');
  const setupOdpToPdfTool = () => setupGenericTool('odp-to-pdf-container');
  const setupOdsToPdfTool = () => setupGenericTool('ods-to-pdf-container');
  const setupOdtToPdfTool = () => setupGenericTool('odt-to-pdf-container');
  const setupPsdToPdfTool = () => setupGenericTool('psd-to-pdf-container');
  const setupVsdToPdfTool = () => setupGenericTool('vsd-to-pdf-container');
  const setupWpdToPdfTool = () => setupGenericTool('wpd-to-pdf-container');
  const setupWpsToPdfTool = () => setupGenericTool('wps-to-pdf-container');
  const setupPubToPdfTool = () => setupGenericTool('pub-to-pdf-container');
  const setupXmlToPdfTool = () => setupGenericTool('xml-to-pdf-container');
  const setupXpsToPdfTool = () => setupGenericTool('xps-to-pdf-container');

  // PDF Conversions - From PDF Setup Functions
  const setupPdfToJpgTool = () => setupGenericTool('pdf-to-jpg-container');
  const setupPdfToPngTool = () => setupGenericTool('pdf-to-png-container');
  const setupPdfToBmpTool = () => setupGenericTool('pdf-to-bmp-container');
  const setupPdfToWebpTool = () => setupGenericTool('pdf-to-webp-container');
  const setupPdfToSvgTool = () => setupGenericTool('pdf-to-svg-container');
  const setupPdfToTiffTool = () => setupGenericTool('pdf-to-tiff-container');
  const setupPdfToTextTool = () => setupGenericTool('pdf-to-text-container');
  const setupPdfToExcelTool = () => setupGenericTool('pdf-to-excel-container');
  const setupPdfToCsvTool = () => setupGenericTool('pdf-to-csv-container');
  const setupPdfToJsonTool = () => setupGenericTool('pdf-to-json-container');
  const setupPdfToMarkdownTool = () => setupGenericTool('pdf-to-markdown-container');
  const setupPdfToZipTool = () => setupGenericTool('pdf-to-zip-container');

  // PDF Editing & Enhancement Setup Functions
  const setupDigitalSignTool = () => setupGenericTool('digital-sign-container');
  const setupValidateSignatureTool = () => setupGenericTool('validate-signature-container');
  const setupAddStampsTool = () => setupGenericTool('add-stamps-container');
  const setupAddWatermarkTool = () => setupGenericTool('add-watermark-container');
  const setupAddAttachmentsTool = () => setupGenericTool('add-attachments-container');
  const setupExtractAttachmentsTool = () => setupGenericTool('extract-attachments-container');
  const setupEditAttachmentsTool = () => setupGenericTool('edit-attachments-container');
  const setupHeaderFooterTool = () => setupGenericTool('header-footer-container');
  const setupBackgroundColorTool = () => setupGenericTool('background-color-container');
  const setupTextColorTool = () => setupGenericTool('text-color-container');
  const setupInvertColorsTool = () => setupGenericTool('invert-colors-container');
  const setupAdjustColorsTool = () => setupGenericTool('adjust-colors-container');
  const setupGrayscaleTool = () => setupGenericTool('grayscale-container');
  const setupPostierizeTool = () => setupGenericTool('posterize-container');
  const setupRotateCustomTool = () => setupGenericTool('rotate-custom-container');
  const setupRasterizeTool = () => setupGenericTool('rasterize-container');
  const setupFlattenTool = () => setupGenericTool('flatten-container');
  const setupLinearizeTool = () => setupGenericTool('linearize-container');
  const setupSanitizeTool = () => setupGenericTool('sanitize-container');

  // PDF Security & Metadata Setup Functions
  const setupEncryptTool = () => {
    const { setupEncryptPdfPage } = require('./tools/encrypt-pdf-page');
    setupEncryptPdfPage();
  };
  const setupDecryptTool = () => {
    const { setupDecryptPdfPage } = require('./tools/decrypt-pdf-page');
    setupDecryptPdfPage();
  };
  const setupChangePermissionsTool = () => {
    const { setupChangePermissionsPage } = require('./tools/change-permissions-page');
    setupChangePermissionsPage();
  };
  const setupRemoveMetadataTool = () => {
    const { setupRemoveMetadataPage } = require('./tools/remove-metadata-page');
    setupRemoveMetadataPage();
  };
  const setupEditMetadataTool = () => {
    const { setupEditMetadataPage } = require('./tools/edit-metadata-page');
    setupEditMetadataPage();
  };
  const setupViewMetadataTool = () => {
    const { setupViewMetadataPage } = require('./tools/view-metadata-page');
    setupViewMetadataPage();
  };
  const setupRemoveRestrictionsTool = () => {
    const { setupRemoveRestrictionsPage } = require('./tools/remove-restrictions-page');
    setupRemoveRestrictionsPage();
  };
  const setupRemoveAnnotationsTool = () => {
    const { setupRemoveAnnotationsPage } = require('./tools/remove-annotations-page');
    setupRemoveAnnotationsPage();
  };

  // PDF Analysis & Extraction Setup Functions
  const setupExtractImagesTool = () => {
    const { setupExtractImagesPage } = require('./tools/extract-images-page');
    setupExtractImagesPage();
  };
  const setupExtractTablesTool = () => setupGenericTool('extract-tables-container');
  const setupOcrTool = () => setupGenericTool('ocr-container');
  const setupPrepareForAiTool = () => setupGenericTool('prepare-for-ai-container');

  // PDF Quality & Repair Setup Functions
  const setupDeskewTool = () => setupGenericTool('deskew-container');
  const setupRepairTool = () => setupGenericTool('repair-container');
  const setupFixPageSizeTool = () => setupGenericTool('fix-page-size-container');
  const setupScannerEffectTool = () => setupGenericTool('scanner-effect-container');
  const setupScanToPdfTool = () => setupGenericTool('scan-to-pdf-container');

  // PDF Formatting & Layout Setup Functions
  const setupBookletTool = () => setupGenericTool('booklet-container');
  const setupBatesNumberingTool = () => setupGenericTool('bates-numbering-container');
  const setupTableOfContentsTool = () => setupGenericTool('table-of-contents-container');
  const setupBookmarkTool = () => setupGenericTool('bookmark-container');
  const setupLayersTool = () => setupGenericTool('layers-container');
  const setupFontToOutlineTool = () => setupGenericTool('font-to-outline-container');
  const setupPdfToPdfATool = () => setupGenericTool('pdf-to-pdfa-container');
  const setupComparePdfsTool = () => setupGenericTool('compare-pdfs-container');

  // Merge Variations Setup Functions
  const setupAlternateMergeTool = () => setupGenericTool('alternate-merge-container');
  const setupCombineSinglePageTool = () => setupGenericTool('combine-single-page-container');

  // Advanced Tools Setup Functions
  const setupPdfWorkflowTool = () => setupGenericTool('pdf-workflow-container');
  const setupFormCreatorTool = () => setupGenericTool('form-creator-container');
  const setupFormFillerTool = () => setupGenericTool('form-filler-container');

  const executeToolAfterUpload = async (id: string) => {
    try {
      // Handle tools with specific implementations
      switch (id) {
        case 'merge':
          await setupMergeTool();
          break;
        case 'split':
          await setupSplitTool();
          break;
        case 'compress':
          setupCompressTool();
          break;
        case 'rotate':
          setupRotateTool();
          break;
        case 'reverse':
          setupReverseTool();
          break;
        case 'duplicate':
          setupDuplicateTool();
          break;
        case 'divide':
          setupDivideTool();
          break;
        case 'add-blank-page':
          setupAddBlankPageTool();
          break;
        case 'remove-blank-pages':
          setupRemoveBlankPagesTool();
          break;
        case 'page-numbers':
          setupPageNumbersTool();
          break;
        case 'page-dimensions':
          setupPageDimensionsTool();
          break;
        case 'n-up':
          setupNUpTool();
          break;
        case 'pdf-to-word':
          await setupPdfToWordTool();
          break;
        case 'pdf-to-jpg':
          await setupPdfToJpgTool();
          break;
        case 'pdf-to-png':
          await setupPdfToPngTool();
          break;
        case 'pdf-to-bmp':
          setupPdfToBmpTool();
          break;
        case 'pdf-to-webp':
          setupPdfToWebpTool();
          break;
        case 'pdf-to-svg':
          setupPdfToSvgTool();
          break;
        case 'pdf-to-tiff':
          setupPdfToTiffTool();
          break;
        case 'pdf-to-text':
          setupPdfToTextTool();
          break;
        case 'pdf-to-excel':
          setupPdfToExcelTool();
          break;
        case 'pdf-to-csv':
          setupPdfToCsvTool();
          break;
        case 'pdf-to-json':
          setupPdfToJsonTool();
          break;
        case 'pdf-to-markdown':
          setupPdfToMarkdownTool();
          break;
        case 'pdf-to-zip':
          setupPdfToZipTool();
          break;
        case 'digital-sign':
          // Digital signature tool uses its own initialization
          showAlert('Feature Note', 'Digital signature functionality is available but requires a valid P12/PFX certificate file. Please ensure you have your digital certificate ready.', 'info');
          break;
        case 'validate-signature':
          setupValidateSignatureTool();
          break;
        case 'add-stamps':
          setupAddStampsTool();
          break;
        case 'add-watermark':
          setupAddWatermarkTool();
          break;
        case 'word-to-pdf':
          await setupWordToPdfTool();
          // Attach event listener after setup
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const convertBtn = document.getElementById('word-to-pdf-process-btn');
              if (convertBtn) {
                console.log('Word to PDF button found, attaching listener');
                convertBtn.onclick = (e) => {
                  e.preventDefault();
                  console.log('Word to PDF button clicked');
                  processWordToPdf();
                };
              } else {
                console.error('Word to PDF button not found');
              }
            });
          });
          break;
        case 'powerpoint-to-pdf':
          await setupPowerpointToPdfTool();
          break;
        case 'sign':
          await setupSignTool();
          break;
        case 'crop':
          await setupCropperTool();
          break;
        case 'extract':
          await setupExtractPagesTool();
          break;
        case 'organize':
          await setupOrganizeTool();
          break;
        case 'delete':
          setupDeletePagesTool();
          break;
        case 'edit':
          await setupEditPDFTool();
          break;
        case 'image-to-pdf':
          document.getElementById('image-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'png-to-pdf':
          document.getElementById('png-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'bmp-to-pdf':
          document.getElementById('bmp-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'webp-to-pdf':
          document.getElementById('webp-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'heic-to-pdf':
          document.getElementById('heic-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'svg-to-pdf':
          document.getElementById('svg-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'tiff-to-pdf':
          document.getElementById('tiff-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'email-to-pdf':
          document.getElementById('email-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'txt-to-pdf':
          document.getElementById('txt-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'csv-to-pdf':
          document.getElementById('csv-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'json-to-pdf':
          document.getElementById('json-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'markdown-to-pdf':
          document.getElementById('markdown-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'excel-to-pdf':
          document.getElementById('excel-to-pdf-container')?.classList.remove('hidden');
          break;
        case 'epub-to-pdf':
          document.getElementById('epub-to-pdf-container')?.classList.remove('hidden');
          break;
        default:
          // For all other tools, use a generic approach
          const toolContainerId = TOOL_CONTAINER_MAP[id];
          if (toolContainerId) {
            const container = document.getElementById(toolContainerId);
            if (container) {
              container.classList.remove('hidden');
            }
          }
      }

      // Scroll to the tool container
      const toolContainerId = TOOL_CONTAINER_MAP[id];
      if (toolContainerId) {
        requestAnimationFrame(() => scrollToElement(toolContainerId));
      }
    } catch (error) {
      const toolName = POPULAR_TOOLS.find((t) => t.id === id)?.name || id;
      console.error(`Error executing tool ${id}:`, error);
      alert(
        `Error executing tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      try {
        // Handle all tools with specific implementations
        switch (id) {
          // Existing specific implementations
          case 'merge':
            await setupMergeTool();
            break;
          case 'split':
            await setupSplitTool();
            break;
          case 'compress':
            setupCompressTool();
            break;
          case 'pdf-to-word':
            await setupPdfToWordTool();
            break;
          case 'pdf-to-jpg':
            await setupPdfToJpgTool();
            break;
          case 'pdf-to-png':
            await setupPdfToPngTool();
            break;
          case 'word-to-pdf':
            await setupWordToPdfTool();
            // Attach event listener after setup
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const convertBtn = document.getElementById('word-to-pdf-process-btn');
                if (convertBtn) {
                  convertBtn.onclick = (e) => {
                    e.preventDefault();
                    processWordToPdf();
                  };
                }
              });
            });
            break;
          case 'sign':
            await setupSignTool();
            break;
          case 'crop':
            await setupCropperTool();
            break;
          case 'extract':
            await setupExtractPagesTool();
            break;
          case 'organize':
            await setupOrganizeTool();
            break;
          case 'delete':
            setupDeletePagesTool();
            break;
          case 'edit':
            await setupEditPDFTool();
            break;
          case 'image-to-pdf':
            setupGenericTool('image-to-pdf-container');
            break;

          // PDF Manipulation
          case 'rotate':
            setupRotateTool();
            break;
          case 'reverse':
            setupReverseTool();
            break;
          case 'duplicate':
            setupDuplicateTool();
            break;
          case 'divide':
            setupDivideTool();
            break;
          case 'add-blank-page':
            setupAddBlankPageTool();
            break;
          case 'remove-blank':
            setupRemoveBlankPagesTool();
            break;
          case 'page-numbers':
            setupPageNumbersTool();
            break;
          case 'page-dimensions':
            setupPageDimensionsTool();
            break;
          case 'n-up':
            setupNUpTool();
            break;

          // PDF Conversions - To PDF
          case 'jpg-to-pdf':
            setupJpgToPdfTool();
            break;
          case 'png-to-pdf':
            setupPngToPdfTool();
            break;
          case 'bmp-to-pdf':
            setupBmpToPdfTool();
            break;
          case 'webp-to-pdf':
            setupWebpToPdfTool();
            break;
          case 'heic-to-pdf':
            setupHeicToPdfTool();
            break;
          case 'svg-to-pdf':
            setupSvgToPdfTool();
            break;
          case 'tiff-to-pdf':
            setupTiffToPdfTool();
            break;
          case 'email-to-pdf':
            setupEmailToPdfTool();
            break;
          case 'txt-to-pdf':
            setupTxtToPdfTool();
            break;
          case 'csv-to-pdf':
            setupCsvToPdfTool();
            break;
          case 'json-to-pdf':
            setupJsonToPdfTool();
            break;
          case 'markdown-to-pdf':
            setupMarkdownToPdfTool();
            break;
          case 'excel-to-pdf':
            setupExcelToPdfTool();
            break;
          case 'powerpoint-to-pdf':
            setupPowerpointToPdfTool();
            break;
          case 'epub-to-pdf':
            setupEpubToPdfTool();
            break;
          case 'mobi-to-pdf':
            setupMobiToPdfTool();
            break;
          case 'cbz-to-pdf':
            setupCbzToPdfTool();
            break;
          case 'fb2-to-pdf':
            setupFb2ToPdfTool();
            break;
          case 'rtf-to-pdf':
            setupRtfToPdfTool();
            break;
          case 'odg-to-pdf':
            setupOdgToPdfTool();
            break;
          case 'odp-to-pdf':
            setupOdpToPdfTool();
            break;
          case 'ods-to-pdf':
            setupOdsToPdfTool();
            break;
          case 'odt-to-pdf':
            setupOdtToPdfTool();
            break;
          case 'psd-to-pdf':
            setupPsdToPdfTool();
            break;
          case 'vsd-to-pdf':
            setupVsdToPdfTool();
            break;
          case 'wpd-to-pdf':
            setupWpdToPdfTool();
            break;
          case 'wps-to-pdf':
            setupWpsToPdfTool();
            break;
          case 'pub-to-pdf':
            setupPubToPdfTool();
            break;
          case 'xml-to-pdf':
            setupXmlToPdfTool();
            break;
          case 'xps-to-pdf':
            setupXpsToPdfTool();
            break;

          // PDF Conversions - From PDF
          case 'pdf-to-jpg':
            setupPdfToJpgTool();
            break;
          case 'pdf-to-png':
            setupPdfToPngTool();
            break;
          case 'pdf-to-bmp':
            setupPdfToBmpTool();
            break;
          case 'pdf-to-webp':
            setupPdfToWebpTool();
            break;
          case 'pdf-to-svg':
            setupPdfToSvgTool();
            break;
          case 'pdf-to-tiff':
            setupPdfToTiffTool();
            break;
          case 'pdf-to-text':
            setupPdfToTextTool();
            break;
          case 'pdf-to-excel':
            setupPdfToExcelTool();
            break;
          case 'pdf-to-csv':
            setupPdfToCsvTool();
            break;
          case 'pdf-to-json':
            setupPdfToJsonTool();
            break;
          case 'pdf-to-markdown':
            setupPdfToMarkdownTool();
            break;
          case 'pdf-to-zip':
            setupPdfToZipTool();
            break;

          // PDF Editing & Enhancement
          case 'digital-sign':
            setupDigitalSignTool();
            break;
          case 'validate-signature':
            setupValidateSignatureTool();
            break;
          case 'add-stamps':
            setupAddStampsTool();
            break;
          case 'add-watermark':
            setupAddWatermarkTool();
            break;
          case 'add-attachments':
            setupAddAttachmentsTool();
            break;
          case 'extract-attachments':
            setupExtractAttachmentsTool();
            break;
          case 'edit-attachments':
            setupEditAttachmentsTool();
            break;
          case 'add-blank-page':
            setupAddBlankPageTool();
            break;
          case 'header-footer':
            setupHeaderFooterTool();
            break;
          case 'background-color':
            setupBackgroundColorTool();
            break;
          case 'text-color':
            setupTextColorTool();
            break;
          case 'invert-colors':
            setupInvertColorsTool();
            break;
          case 'adjust-colors':
            setupAdjustColorsTool();
            break;
          case 'grayscale':
            setupGrayscaleTool();
            break;
          case 'posterize':
            setupPostierizeTool();
            break;
          case 'rotate-custom':
            setupRotateCustomTool();
            break;
          case 'rasterize':
            setupRasterizeTool();
            break;
          case 'flatten':
            setupFlattenTool();
            break;
          case 'linearize':
            setupLinearizeTool();
            break;
          case 'sanitize':
            setupSanitizeTool();
            break;

          // PDF Security & Metadata
          case 'encrypt':
            setupEncryptTool();
            break;
          case 'decrypt':
            setupDecryptTool();
            break;
          case 'change-permissions':
            setupChangePermissionsTool();
            break;
          case 'remove-metadata':
            setupRemoveMetadataTool();
            break;
          case 'edit-metadata':
            setupEditMetadataTool();
            break;
          case 'view-metadata':
            setupViewMetadataTool();
            break;
          case 'remove-restrictions':
            setupRemoveRestrictionsTool();
            break;
          case 'remove-annotations':
            setupRemoveAnnotationsTool();
            break;

          // PDF Analysis & Extraction
          case 'extract-images':
            setupExtractImagesTool();
            // Attach event listeners after a brief delay to ensure DOM is ready
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const extractBtn = document.getElementById('extract-images-btn');
                const downloadZipBtn = document.getElementById('download-zip-btn');
                
                if (extractBtn) {
                  console.log('Extract Images button found, attaching listener');
                  extractBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('Extract Images button clicked');
                    processExtractImages();
                  };
                } else {
                  console.error('Extract Images button not found');
                }
                
                if (downloadZipBtn) {
                  downloadZipBtn.onclick = (e) => {
                    e.preventDefault();
                    processDownloadImagesZip();
                  };
                }
              });
            });
            break;
          case 'extract-tables':
            setupExtractTablesTool();
            break;
          case 'ocr':
            setupOcrTool();
            break;
          case 'prepare-for-ai':
            setupPrepareForAiTool();
            break;

          // PDF Quality & Repair
          case 'deskew':
            setupDeskewTool();
            break;
          case 'remove-blank-pages':
            setupRemoveBlankPagesTool();
            break;
          case 'repair':
            setupRepairTool();
            break;
          case 'fix-page-size':
            setupFixPageSizeTool();
            break;
          case 'scanner-effect':
            setupScannerEffectTool();
            break;
          case 'scan-to-pdf':
            setupScanToPdfTool();
            break;

          // PDF Formatting & Layout
          case 'booklet':
            setupBookletTool();
            break;
          case 'bates-numbering':
            setupBatesNumberingTool();
            break;
          case 'table-of-contents':
            setupTableOfContentsTool();
            break;
          case 'bookmark':
            setupBookmarkTool();
            break;
          case 'layers':
            setupLayersTool();
            break;
          case 'font-to-outline':
            setupFontToOutlineTool();
            break;
          case 'pdf-to-pdfa':
            setupPdfToPdfATool();
            break;
          case 'compare-pdfs':
            setupComparePdfsTool();
            break;

          // Merge Variations
          case 'alternate-merge':
            setupAlternateMergeTool();
            break;
          case 'combine-single-page':
            setupCombineSinglePageTool();
            break;

          // Advanced Tools
          case 'pdf-workflow':
            setupPdfWorkflowTool();
            break;
          case 'form-creator':
            setupFormCreatorTool();
            break;
          case 'form-filler':
            setupFormFillerTool();
            break;

          default:
            console.warn(`Unknown tool: ${id}`);
        }

        // Scroll to the tool container
        const toolContainerId = TOOL_CONTAINER_MAP[id];
        if (toolContainerId) {
          requestAnimationFrame(() => scrollToElement(toolContainerId));
        }
      } catch (error) {
        const toolName = POPULAR_TOOLS.find((t) => t.id === id)?.name || id;
        console.error(`Error executing tool ${id}:`, error);
        alert(
          `Error executing tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput) return;

    const uploadConfig = getUploadConfig(selectedTool);

    try {
      // Try to fetch the file from the URL
      const response = await fetch(urlInput);

      if (!response.ok) {
        throw new Error('Failed to fetch file from URL');
      }

      const blob = await response.blob();

      // Get filename from URL
      let fileName = urlInput.split('/').pop() || 'imported_file';
      if (fileName.includes('?')) {
        fileName = fileName.split('?')[0];
      }

      if (!matchesAcceptRule(fileName, blob.type, uploadConfig.accept)) {
        throw new Error(
          `URL file type is not supported. Please upload a valid ${uploadConfig.label}.`
        );
      }

      // Create a File object from the blob
      const file = new File([blob], fileName, { type: blob.type });

      handleFileSelect({
        file: file,
        name: fileName,
        size: blob.size,
      });

      // Hide input after successful import
      setSelectedSource('');
      setUrlInput('');
    } catch (error) {
      console.error('Error importing from URL:', error);
      alert(
        `Failed to import file from URL: ${error.message}\n\nNote: The URL must be publicly accessible and point directly to a supported file. CORS restrictions may prevent loading from some domains.`
      );
    }
  };

  const handleDownload = async () => {
    if (!selectedFile || !selectedFile.file) {
      alert('No file available to download.');
      return;
    }

    // Check if the file is an image (for image-to-PDF conversion)
    const isImage = selectedFile.file.type.startsWith('image/');

    if (!isImage) {
      alert(
        'Download is only available for image to PDF conversion. PDF tools handle downloads automatically.'
      );
      return;
    }

    try {
      const { PDFDocument } = await import('pdf-lib');

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Create an image bitmap from the file
      const imageBitmap = await createImageBitmap(selectedFile.file);
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(imageBitmap, 0, 0);

      // Convert to JPEG for better compression
      const jpegBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
      );
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

      // Embed the image in the PDF
      const image = await pdfDoc.embedJpg(jpegBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      imageBitmap.close();

      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();

      // Create download link
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '') + '.pdf';
      link.download = `converted_${fileName}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('Error creating PDF file. Please try again.');
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setIsConverted(true);
    setIsConverting(false);
    setSelectedSource('');
    setUrlInput('');
    setSelectedTool(null);
    setShowUploadForTool(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-700 dark:text-gray-300 antialiased">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div id="upload-section" className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            {selectedTool
              ? `${POPULAR_TOOLS.find((t) => t.id === selectedTool)?.name}`
              : 'Online Converter for your documents'}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {selectedTool
              ? `Upload your file(s) to use the ${POPULAR_TOOLS.find((t) => t.id === selectedTool)?.name} tool`
              : 'More faster as you can see'}
          </p>

          {selectedTool && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary dark:hover:text-primary transition-colors"
              >
                <span className="icon mr-2">arrow_back</span>
                Back to tools
              </button>
            </div>
          )}

          {selectedTool && (
            <FileUploader
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              accept={getUploadConfig(selectedTool).accept}
              fileTypeLabel={getUploadConfig(selectedTool).label}
              allowMultiple={selectedTool === 'merge' || selectedTool === 'image-to-pdf'}
            />
          )}

          {selectedFile && !isConverting && !isConverted && !selectedTool && (
            <div className="mt-8 animate-fade-in-up">
              <button
                onClick={startConversion}
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="icon mr-2">picture_as_pdf</span>
                Convert to PDF
              </button>
            </div>
          )}

          {selectedTool && (
            <ExtensionSelector
              options={INPUT_OPTIONS}
              selectedOption={selectedSource}
              onSelect={handleSourceSelect}
            />
          )}

          {selectedTool && selectedSource === 'url' && (
            <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in-up">
              <div className="w-full max-w-md flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white outline-none transition-shadow"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                />
                <button
                  onClick={handleUrlImport}
                  disabled={!urlInput}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
                >
                  Import
                </button>
              </div>
            </div>
          )}

          {isConverting && (
            <div className="mt-12 max-w-xl mx-auto px-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Converting...
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Please wait while we process your document
              </p>
            </div>
          )}
        </div>

        {/* Tool-specific UI containers */}
        <div id="merge-options" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex gap-2 mb-6">
              <button
                id="file-mode-btn"
                className="px-4 py-2 rounded-lg font-medium transition-colors"
              >
                File Mode
              </button>
              <button
                id="page-mode-btn"
                className="px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Page Mode
              </button>
            </div>

            <div id="file-mode-panel" className="space-y-4">
              <ul id="file-list" className="space-y-3"></ul>
            </div>

            <div id="page-mode-panel" className="hidden">
              <div
                id="page-merge-preview"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              ></div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                id="process-btn"
                onClick={() => merge()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Merge PDFs
              </button>
            </div>
          </div>
        </div>

        {/* Split Tool UI */}
        <div id="split-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Split PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose how you want to split your PDF document
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="split-mode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Split Mode
              </label>
              <select
                id="split-mode"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="range">Page Range</option>
                <option value="visual">Visual Selection</option>
                <option value="even-odd">Even/Odd Pages</option>
                <option value="all">All Pages (1 per file)</option>
                <option value="n-times">Split Every N Pages</option>
              </select>
            </div>

            {/* Range Panel */}
            <div id="range-panel" className="mb-6">
              <label
                htmlFor="page-range"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Page Range (e.g., 1-3, 5, 7-10)
              </label>
              <input
                type="text"
                id="page-range"
                placeholder="1-3, 5, 7-10"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Visual Selection Panel */}
            <div id="visual-select-panel" className="hidden mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click on pages to select them for extraction
              </p>
              <div
                id="page-selector-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto"
              ></div>
            </div>

            {/* Even/Odd Panel */}
            <div id="even-odd-panel" className="hidden mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select:</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="even-odd-choice"
                    value="even"
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Even Pages (2, 4, 6...)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="even-odd-choice"
                    value="odd"
                    defaultChecked
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Odd Pages (1, 3, 5...)</span>
                </label>
              </div>
            </div>

            {/* All Pages Panel */}
            <div id="all-pages-panel" className="hidden mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Each page will be saved as a separate PDF file in a ZIP archive.
              </p>
            </div>

            {/* N Times Panel */}
            <div id="n-times-panel" className="hidden mb-6">
              <label
                htmlFor="split-n-value"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Split every N pages
              </label>
              <input
                type="number"
                id="split-n-value"
                defaultValue="5"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div
                id="n-times-warning"
                className="hidden mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
              >
                <p
                  id="n-times-warning-text"
                  className="text-sm text-yellow-800 dark:text-yellow-200"
                ></p>
              </div>
            </div>

            {/* ZIP Option */}
            <div id="zip-option-wrapper" className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="download-as-zip"
                  className="w-5 h-5 text-primary focus:ring-primary focus:ring-2 rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Download as ZIP (one PDF per page)
                </span>
              </label>
            </div>

            {/* Split Button */}
            <div className="flex justify-center">
              <button
                id="split-process-btn"
                onClick={() => split()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Split PDF
              </button>
            </div>
          </div>
        </div>

        {/* Compress Tool UI */}
        <div id="compress-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Compress PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Reduce the file size of your PDF document
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="compression-level"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Compression Level
              </label>
              <select
                id="compression-level"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="balanced">Balanced (Recommended)</option>
                <option value="high-quality">High Quality</option>
                <option value="small-size">Small Size</option>
                <option value="extreme">Extreme Compression</option>
              </select>
            </div>

            <div className="mb-6">
              <label
                htmlFor="compression-algorithm"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Compression Algorithm
              </label>
              <select
                id="compression-algorithm"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="auto">Automatic (Best Result)</option>
                <option value="vector">Vector (Smart)</option>
                <option value="photon">Photon (Rasterize)</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Compression Methods:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Vector:</strong> Optimizes images while preserving PDF structure
                    </li>
                    <li>
                      <strong>Photon:</strong> Converts pages to images for maximum compression
                    </li>
                    <li>
                      <strong>Automatic:</strong> Tries Vector first, falls back to Photon if needed
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Compress Button */}
            <div className="flex justify-center">
              <button
                id="compress-process-btn"
                onClick={() => compress()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Compress PDF
              </button>
            </div>
          </div>
        </div>

        {/* Delete Pages Tool UI */}
        <div id="delete-pages-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Delete Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Remove unwanted pages from your PDF document
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="pages-to-delete"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Pages to Delete (e.g., 1-3, 5, 7-10)
              </label>
              <input
                type="text"
                id="pages-to-delete"
                placeholder="1-3, 5, 7-10"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Pages will be permanently removed from the PDF</li>
                    <li>You cannot delete all pages from the document</li>
                    <li>The original file will not be modified</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview Container */}
            <div id="delete-pages-preview" className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pages marked in red will be deleted
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto"></div>
            </div>

            {/* Delete Button */}
            <div className="flex justify-center">
              <button
                id="delete-pages-btn"
                onClick={() => deletePages()}
                className="px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
              >
                Delete Pages
              </button>
            </div>
          </div>
        </div>

        {/* Extract Pages Tool UI */}
        <div id="extract-pages-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract specific pages from your PDF document
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="pages-to-extract"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Pages to Extract (e.g., 1-3, 5, 7-10)
              </label>
              <input
                type="text"
                id="pages-to-extract"
                placeholder="1-3, 5, 7-10"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Extraction Info:</p>
                  <p>Each extracted page will be saved as a separate PDF file in a ZIP archive.</p>
                </div>
              </div>
            </div>

            {/* Preview Container */}
            <div id="extract-pages-preview" className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pages marked in green will be extracted
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto"></div>
            </div>

            {/* Extract Button */}
            <div className="flex justify-center">
              <button
                id="extract-pages-btn"
                onClick={() => extractPages()}
                className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
              >
                Extract Pages
              </button>
            </div>
          </div>
        </div>

        {/* Sign PDF Tool UI */}
        <div id="signature-editor" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add signatures, stamps, and annotations to your PDF document
              </p>
            </div>

            {/* PDF Viewer Container */}
            <div
              id="canvas-container-sign"
              className="mb-6 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden min-h-[800px] max-h-[900px]"
            >
              <p className="text-center text-gray-500 py-8">Loading PDF viewer...</p>
            </div>

            {/* Options */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  id="flatten-signature-toggle"
                  defaultChecked
                  className="w-5 h-5 text-primary focus:ring-primary focus:ring-2 rounded"
                />
                <div>
                  <span className="text-gray-900 dark:text-white font-medium block">
                    Flatten Signatures
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Makes signatures permanent and non-editable (recommended for security)
                  </span>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">How to sign:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use the signature tool in the PDF viewer toolbar</li>
                    <li>Click and drag to draw your signature</li>
                    <li>Add stamps or text annotations as needed</li>
                    <li>Click the save button below when finished</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                id="process-btn"
                onClick={() => applyAndSaveSignatures()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Save Signed PDF
              </button>
            </div>
          </div>
        </div>

        {/* Cropper Tool UI */}
        <div id="cropper-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Crop PDF Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Click and drag on the page to select the area you want to keep
              </p>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                id="prev-page"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span id="page-info" className="text-gray-700 dark:text-gray-300 font-medium">
                Page 1 of 1
              </span>
              <button
                id="next-page"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Canvas Container */}
            <div
              id="cropper-container"
              className="mb-6 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto min-h-[600px] max-h-[800px] flex items-center justify-center p-4"
            >
              <p className="text-gray-500">Loading PDF...</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  id="destructive-crop-toggle"
                  className="w-5 h-5 text-primary focus:ring-primary focus:ring-2 rounded"
                />
                <label
                  htmlFor="destructive-crop-toggle"
                  className="text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <span className="font-medium">Destructive Crop</span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">
                    Flatten to image (permanent)
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  id="apply-to-all-toggle"
                  className="w-5 h-5 text-primary focus:ring-primary focus:ring-2 rounded"
                />
                <label
                  htmlFor="apply-to-all-toggle"
                  className="text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <span className="font-medium">Apply to All Pages</span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">
                    Use same crop for all pages
                  </span>
                </label>
              </div>
            </div>

            {/* Crop Button */}
            <div className="flex justify-center">
              <button
                id="crop-button"
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crop & Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Organize PDF Tool UI */}
        <div id="organize-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Organize PDF Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop to reorder pages in your PDF document
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">How to organize:</p>
                  <p>
                    Click and drag page thumbnails to reorder them. The new order will be reflected
                    in the downloaded PDF.
                  </p>
                </div>
              </div>
            </div>

            {/* Page Organizer Container */}
            <div className="mb-6">
              <div
                id="page-organizer"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <p className="col-span-full text-center text-gray-500">Loading pages...</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                id="organize-save-btn"
                onClick={() => organize()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Save Organized PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF to Word Tool UI */}
        <div id="pdf-to-word-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to Word
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF documents to editable Word files using PyMuPDF
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">High-Quality Conversion:</p>
                  <p>
                    Uses PyMuPDF WASM for professional PDF to Word conversion. Preserves text,
                    formatting, images, and layout with high accuracy.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files.length} PDF file(s) ready to convert`
                    : 'PDF files uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {state.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                        <span className="truncate">{file.name}</span>
                        <span className="ml-4 text-gray-500 text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Features:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Preserves text formatting and layout</li>
                    <li>Extracts embedded images</li>
                    <li>Supports batch conversion with ZIP output</li>
                    <li>Works with complex PDF documents</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-word-process-btn"
                onClick={() => pdfToWord()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to Word
              </button>
            </div>
          </div>
        </div>

        {/* PDF to JPG Tool UI */}
        <div id="pdf-to-jpg-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to JPG
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to high-quality JPG images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate JPG image. All images will be packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Quality
                </label>
                <select
                  id="pdf-to-jpg-quality"
                  defaultValue="0.85"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="0.92">High Quality (Larger file size)</option>
                  <option value="0.85">Medium Quality (Balanced)</option>
                  <option value="0.75">Low Quality (Smaller file size)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-jpg-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Higher quality and DPI produce larger file sizes</li>
                    <li>150 DPI is suitable for most web and screen uses</li>
                    <li>Use 300 DPI or higher for printing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-jpg-process-btn"
                onClick={() => pdfToJpg()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to JPG
              </button>
            </div>
          </div>
        </div>

        {/* PDF to PNG Tool UI */}
        <div id="pdf-to-png-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to PNG
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to high-quality PNG images with transparency support
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate PNG image. PNG format supports transparency and lossless compression. All images will be packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-png-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>PNG format provides lossless compression</li>
                    <li>Ideal for images with transparency or text</li>
                    <li>150 DPI is suitable for most web and screen uses</li>
                    <li>Use 300 DPI or higher for printing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-png-process-btn"
                onClick={() => pdfToPng()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to PNG
              </button>
            </div>
          </div>
        </div>

        {/* Word to PDF Tool UI */}
        <div id="word-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert Word to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your Word document to a PDF file
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Your Word document will be converted to a PDF file while preserving the
                    formatting, fonts, images, and layout from the original document.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'Word file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Supports .docx and .doc Word documents</li>
                    <li>Formatting, images, and layout will be preserved in the PDF</li>
                    <li>The converted PDF will be ready to download immediately</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="word-to-pdf-process-btn"
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        {/* Image to PDF Tool UI */}
        <div id="image-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert Images to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Combine multiple images into a single PDF document
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Supported Formats:</p>
                  <p>
                    JPG, PNG, WEBP, BMP, TIFF, SVG, HEIC and more. All images will be converted to a
                    single PDF file in the order they were uploaded.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files.length} image(s) selected`
                    : 'Images uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <ul className="text-sm text-left max-w-md mx-auto space-y-2">
                      {state.files.map((file, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                          <span className="truncate">{file.name}</span>
                          <span className="ml-auto text-gray-500 text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Upload images in the order you want them to appear in the PDF</li>
                    <li>High-resolution images will maintain their quality</li>
                    <li>Each image will be placed on a separate page</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                onClick={() => imageToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF Editor Tool UI */}
        <div id="edit-pdf-options" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF Editor</h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and interact with your PDF document
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Interactive PDF Viewer</p>
                  <p>
                    Use the toolbar to navigate, zoom, search, print, or download your PDF. The
                    viewer provides a full-featured PDF reading experience.
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Viewer Container */}
            <div
              id="pdf-viewer-container"
              className="mb-6 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
            >
              <p className="text-gray-400 text-center py-8">Loading PDF viewer...</p>
            </div>

            <div
              id="edit-instructions"
              className="hidden bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4"
            >
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-green-800 dark:text-green-300">
                  <p className="font-semibold mb-1">PDF Loaded Successfully!</p>
                  <p>
                    Your PDF is now ready to view. Use the toolbar controls above the document to
                    navigate, zoom, search, print, or download.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rotate Tool UI */}
        <div id="rotate-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Rotate PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Rotate pages in your PDF document</p>
            </div>

            {/* File Display Area */}
            <div id="file-display-area" className="mb-4"></div>

            {/* Tool Options */}
            <div id="tool-options" className="hidden">
              {/* Rotation Controls */}
              <div className="mb-6 flex gap-4 justify-center">
                <button
                  id="rotate-all-left"
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <i data-lucide="rotate-ccw" className="w-5 h-5"></i>
                  Rotate All Left
                </button>
                <button
                  id="rotate-all-right"
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <i data-lucide="rotate-cw" className="w-5 h-5"></i>
                  Rotate All Right
                </button>
              </div>

              {/* Page Thumbnails */}
              <div
                id="page-thumbnails"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6"
              ></div>

              {/* Process Button */}
              <div className="flex justify-center">
                <button
                  id="rotate-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Apply Rotations
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reverse Tool UI */}
        <div id="reverse-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Reverse Page Order
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Reverse the order of pages in your PDF
              </p>
            </div>

            {/* File Display Area */}
            <div id="reverse-file-display-area" className="mb-4"></div>

            {/* Tool Options */}
            <div id="reverse-tool-options" className="hidden">
              <div className="flex justify-center">
                <button
                  id="reverse-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Reverse Pages
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate Tool UI */}
        <div id="duplicate-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Duplicate Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Drag, drop, duplicate, and delete pages to organize your PDF
              </p>
            </div>

            {/* Page Grid */}
            <div
              id="duplicate-page-grid"
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6"
            ></div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                id="duplicate-save-btn"
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Save Organized PDF
              </button>
            </div>
          </div>
        </div>

        {/* Divide Tool UI */}
        <div id="divide-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Divide PDF Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Split pages vertically or horizontally
              </p>
            </div>

            {/* File Display Area */}
            <div id="divide-file-display-area" className="mb-4"></div>

            {/* Tool Options */}
            <div id="divide-tool-options" className="hidden">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Split Type
                </label>
                <select
                  id="divide-split-type"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="vertical">Vertical Split</option>
                  <option value="horizontal">Horizontal Split</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Range (e.g., 1-3, 5, 7-9 or leave empty for all)
                </label>
                <input
                  type="text"
                  id="divide-page-range"
                  placeholder="e.g., 1-3, 5, 7-9 or leave empty for all"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-center">
                <button
                  id="divide-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Divide Pages
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Remove Blank Tool UI */}
        <div id="remove-blank-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Remove Blank Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically detect and remove blank pages
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sensitivity
              </label>
              <select
                id="blank-sensitivity"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low (More strict)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Less strict)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Remove Blank Pages
              </button>
            </div>
          </div>
        </div>

        {/* Page Numbers Tool UI */}
        <div id="page-numbers-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Page Numbers
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Add page numbers to your PDF</p>
            </div>

            {/* File Display Area */}
            <div id="page-numbers-file-display-area" className="mb-4"></div>

            {/* Options Panel */}
            <div id="page-numbers-options-panel" className="hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <select
                    id="page-numbers-position"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    id="page-numbers-format"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="simple">Simple (1, 2, 3...)</option>
                    <option value="page_x_of_y">Page X of Y</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <input
                    type="number"
                    id="page-numbers-font-size"
                    min="8"
                    max="48"
                    defaultValue="12"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Color
                  </label>
                  <input
                    type="color"
                    id="page-numbers-text-color"
                    defaultValue="#000000"
                    className="w-full h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  id="page-numbers-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Add Page Numbers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Dimensions Tool UI */}
        <div id="fix-page-size-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Fix Page Size
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Standardize page dimensions in your PDF
              </p>
            </div>

            {/* File Display Area */}
            <div id="fix-page-size-file-display-area" className="mb-4"></div>

            {/* Tool Options */}
            <div id="fix-page-size-tool-options" className="hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Size
                  </label>
                  <select
                    id="fix-page-size-target-size"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                    <option value="A5">A5</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientation
                  </label>
                  <select
                    id="fix-page-size-orientation"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              {/* Custom Size Options */}
              <div id="fix-page-size-custom-size-wrapper" className="hidden mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Width
                    </label>
                    <input
                      type="number"
                      id="fix-page-size-custom-width"
                      step="0.1"
                      min="0"
                      defaultValue="8.5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height
                    </label>
                    <input
                      type="number"
                      id="fix-page-size-custom-height"
                      step="0.1"
                      min="0"
                      defaultValue="11"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Units
                    </label>
                    <select
                      id="fix-page-size-custom-units"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="in">Inches</option>
                      <option value="mm">Millimeters</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scaling Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scaling Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fix-page-size-scaling-mode"
                      value="fit"
                      defaultChecked
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      Fit (preserve aspect ratio)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fix-page-size-scaling-mode"
                      value="fill"
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Fill (may crop)</span>
                  </label>
                </div>
              </div>

              {/* Background Color */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <input
                  type="color"
                  id="fix-page-size-background-color"
                  defaultValue="#ffffff"
                  className="w-full h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                />
              </div>

              <div className="flex justify-center">
                <button
                  id="fix-page-size-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Fix Page Size
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* N-Up Tool UI */}
        <div id="n-up-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">N-Up Layout</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Combine multiple pages onto one sheet
              </p>
            </div>

            {/* File Display Area */}
            <div id="n-up-file-display-area" className="mb-4"></div>

            {/* Tool Options */}
            <div id="n-up-tool-options" className="hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pages Per Sheet
                  </label>
                  <select
                    id="n-up-pages-per-sheet"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="2">2 Pages</option>
                    <option value="4">4 Pages</option>
                    <option value="9">9 Pages</option>
                    <option value="16">16 Pages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Output Page Size
                  </label>
                  <select
                    id="n-up-output-page-size"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientation
                  </label>
                  <select
                    id="n-up-output-orientation"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="auto">Auto</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input type="checkbox" id="n-up-add-margins" defaultChecked className="mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Add margins and gutters</span>
                </label>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input type="checkbox" id="n-up-add-border" className="mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Add borders around pages</span>
                </label>
              </div>

              <div id="n-up-border-color-wrapper" className="hidden mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Border Color
                </label>
                <input
                  type="color"
                  id="n-up-border-color"
                  defaultValue="#000000"
                  className="w-full h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                />
              </div>

              <div className="flex justify-center">
                <button
                  id="n-up-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Apply N-Up Layout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generic Image to PDF Converters */}
        <div id="jpg-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">JPG to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert JPG images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button
                id="jpg-to-pdf-process-btn"
                onClick={() => void imageToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="png-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PNG to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert PNG images to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="png-to-pdf-convert-btn"
                onClick={() => void pngToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="bmp-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">BMP to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert BMP images to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="bmp-to-pdf-convert-btn"
                onClick={() => void bmpToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="webp-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WebP to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert WebP images to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="webp-to-pdf-convert-btn"
                onClick={() => void webpToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="heic-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">HEIC to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert HEIC/HEIF images to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="heic-to-pdf-convert-btn"
                onClick={() => void heicToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="svg-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">SVG to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert SVG vector graphics to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="svg-to-pdf-convert-btn"
                onClick={() => void svgToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="tiff-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">TIFF to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert TIFF images to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="tiff-to-pdf-convert-btn"
                onClick={() => void tiffToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        {/* Document to PDF Converters */}
        <div id="email-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert email files (.eml, .msg) to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="email-to-pdf-convert-btn"
                onClick={() => void emailToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="txt-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Text to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert text files to PDF documents
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="txt-to-pdf-convert-btn"
                onClick={() => void txtToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="csv-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CSV to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert CSV spreadsheet files to PDF tables</p>
            </div>
            <div className="flex justify-center">
              <button
                id="csv-to-pdf-convert-btn"
                onClick={() => void csvToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="json-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">JSON to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert JSON data files to formatted PDF documents</p>
            </div>
            <div className="flex justify-center">
              <button
                id="json-to-pdf-convert-btn"
                onClick={() => void jsonToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="markdown-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Markdown to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert Markdown documents to formatted PDF files</p>
            </div>
            <div className="flex justify-center">
              <button
                id="markdown-to-pdf-convert-btn"
                onClick={() => void mdToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="excel-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Excel to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert Excel spreadsheets to formatted PDF documents</p>
            </div>
            <div className="flex justify-center">
              <button
                id="excel-to-pdf-convert-btn"
                onClick={() => void excelToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="powerpoint-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                PowerPoint to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert PowerPoint presentations to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button
                id="powerpoint-to-pdf-process-btn"
                onClick={() =>
                  void powerpointToPdf(
                    state.files.length > 0
                      ? state.files
                      : selectedFile?.file
                        ? [selectedFile.file]
                        : []
                  )
                }
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="epub-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">EPUB to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert EPUB ebooks to PDF</p>
            </div>
            <div className="flex justify-center">
              <button
                id="epub-to-pdf-convert-btn"
                onClick={() => void epubToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="mobi-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">MOBI to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert MOBI ebooks to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="cbz-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CBZ to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert CBZ comic archives to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="fb2-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">FB2 to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert FB2 ebooks to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="rtf-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">RTF to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert RTF documents to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        {/* OpenDocument Formats */}
        <div id="odg-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ODG to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert OpenDocument Graphics to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="odp-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ODP to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert OpenDocument Presentations to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="ods-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ODS to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert OpenDocument Spreadsheets to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="odt-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ODT to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert OpenDocument Text to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        {/* Other Format Converters */}
        <div id="psd-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PSD to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert Photoshop files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="vsd-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">VSD to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert Visio files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="wpd-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WPD to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert WordPerfect documents to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="wps-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WPS to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert WPS documents to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="pub-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Publisher to PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert Microsoft Publisher files to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="xml-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">XML to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert XML files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="xps-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">XPS to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert XPS files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF to Other Formats */}
        <div id="pdf-to-jpg-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to JPG</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to JPG images</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality
              </label>
              <select
                id="jpg-quality"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low (Smaller file)</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="maximum">Maximum (Larger file)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to JPG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-png-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to PNG</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to PNG images</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PNG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-bmp-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to BMP
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to BMP (Bitmap) images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate BMP image. BMP format is uncompressed and provides maximum compatibility. All images will be packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-bmp-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>BMP format is uncompressed and produces large files</li>
                    <li>Provides maximum compatibility with older applications</li>
                    <li>150 DPI is suitable for most web and screen uses</li>
                    <li>Use 300 DPI or higher for printing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-bmp-process-btn"
                onClick={() => pdfToBmp()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to BMP
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-webp-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to WebP
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to modern WebP images with efficient compression
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate WebP image. WebP format provides superior compression with excellent quality. All images will be packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-webp-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality: <span id="pdf-to-webp-quality-value">85%</span>
                </label>
                <input
                  type="range"
                  id="pdf-to-webp-quality"
                  min="0.1"
                  max="1"
                  step="0.05"
                  defaultValue="0.85"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  onChange={(e) => {
                    const value = document.getElementById('pdf-to-webp-quality-value');
                    if (value) value.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Lower size</span>
                  <span>Higher quality</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>WebP provides better compression than PNG and JPEG</li>
                    <li>Ideal for web use with modern browser support</li>
                    <li>85% quality offers excellent balance of size and quality</li>
                    <li>Higher DPI values result in larger file sizes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-webp-process-btn"
                onClick={() => pdfToWebp()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to WebP
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-svg-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to SVG
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to scalable SVG (Scalable Vector Graphics) images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate SVG image. SVG images are scalable and can be resized without quality loss. All images will be packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-svg-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>SVG images are infinitely scalable without quality loss</li>
                    <li>Perfect for logos, icons, and graphics</li>
                    <li>Can be edited with vector graphics software</li>
                    <li>Note: This creates raster-embedded SVGs from PDF pages</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-svg-process-btn"
                onClick={() => pdfToSvg()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to SVG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-tiff-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to TIFF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to TIFF (Tagged Image File Format) images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate TIFF image. TIFF is widely used in publishing and professional photography. All images will be packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-tiff-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compression
                </label>
                <select
                  id="pdf-to-tiff-compression"
                  defaultValue="none"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="none">None (Uncompressed)</option>
                  <option value="lzw">LZW Compression</option>
                  <option value="packbits">PackBits Compression</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>TIFF is ideal for archiving and professional printing</li>
                    <li>Supports lossless compression and high bit depth</li>
                    <li>300 DPI or higher recommended for print quality</li>
                    <li>Uncompressed TIFF produces larger files but maximum quality</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-tiff-process-btn"
                onClick={() => pdfToTiff()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to TIFF
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-text-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract Text from PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract all text content from your PDF document
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Extraction Info:</p>
                  <p>
                    Text will be extracted from all pages of your PDF and saved as a plain text file (.txt). The layout and formatting may not be preserved, but all readable text content will be extracted.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for text extraction`
                    : 'PDF file uploaded above will have text extracted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-text-page-numbers"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-text-page-numbers" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include page numbers in output
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Separator
                </label>
                <select
                  id="pdf-to-text-separator"
                  defaultValue="double-line"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="single-line">Single Line Break</option>
                  <option value="double-line">Double Line Break</option>
                  <option value="page-break">Page Break with Divider</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Best for PDFs containing selectable text</li>
                    <li>Images and complex layouts won't be preserved</li>
                    <li>Scanned PDFs require OCR (not supported in this tool)</li>
                    <li>Output is plain text format (.txt)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Extract Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-text-process-btn"
                onClick={() => pdfToText()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Extract Text
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-excel-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to Excel
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content to Excel spreadsheet format
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content from your PDF will be extracted and converted to an Excel spreadsheet (.xlsx). This tool extracts text content; for advanced table detection, specialized software is recommended.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-excel-one-sheet"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-excel-one-sheet" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Create one sheet per page
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Best for PDFs with structured text content</li>
                    <li>Complex tables may not preserve exact layout</li>
                    <li>Creates Excel .xlsx format compatible with Microsoft Excel</li>
                    <li>For precise table extraction, specialized tools may work better</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-excel-process-btn"
                onClick={() => pdfToExcel()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to Excel
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-csv-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to CSV
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content to CSV (Comma-Separated Values) format
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content from your PDF will be extracted and converted to CSV format. CSV files can be opened in Excel, Google Sheets, and other spreadsheet applications.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-csv-page-numbers"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-csv-page-numbers" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include page numbers column
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Separator
                </label>
                <select
                  id="pdf-to-csv-separator"
                  defaultValue="comma"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="comma">Comma (,)</option>
                  <option value="semicolon">Semicolon (;)</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>CSV format is ideal for data exchange between applications</li>
                    <li>Use semicolon separator for European Excel versions</li>
                    <li>Complex tables may not preserve exact structure</li>
                    <li>Output can be opened in Excel, Google Sheets, or any text editor</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-csv-process-btn"
                onClick={() => pdfToCsv()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to CSV
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-json-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to JSON
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content as structured JSON data
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content and metadata from your PDF will be extracted and converted to JSON format. JSON is perfect for data processing, APIs, and programmatic access.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <select
                  id="pdf-to-json-format"
                  defaultValue="structured"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="simple">Simple (text only)</option>
                  <option value="structured">Structured (with coordinates)</option>
                  <option value="full">Full (complete text content)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-json-metadata"
                  defaultChecked={true}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-json-metadata" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include PDF metadata
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-json-indent"
                  defaultChecked={true}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-json-indent" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pretty print (indented JSON)
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>JSON format is ideal for APIs and data processing</li>
                    <li>Structured format includes text coordinates and fonts</li>
                    <li>Simple format is best for basic text extraction</li>
                    <li>Pretty print makes JSON human-readable</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-json-process-btn"
                onClick={() => pdfToJson()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to JSON
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-markdown-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to Markdown
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content to Markdown format for documentation and notes
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content from your PDF will be extracted and converted to Markdown format (.md). Perfect for documentation, note-taking, and content management systems.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-markdown-title"
                  defaultChecked={true}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-markdown-title" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include document title (# Heading 1)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-markdown-page-numbers"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="pdf-to-markdown-page-numbers" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include page number headings (## Page N)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heading Detection
                </label>
                <select
                  id="pdf-to-markdown-headings"
                  defaultValue="auto"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="auto">Auto-detect (by font size)</option>
                  <option value="none">No heading detection</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Markdown is great for GitHub, GitLab, and documentation sites</li>
                    <li>Auto-detect headings based on font size differences</li>
                    <li>Use page separators (---) when not using page numbers</li>
                    <li>Compatible with all Markdown editors and viewers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-markdown-process-btn"
                onClick={() => pdfToMarkdown()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Convert to Markdown
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-zip-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract PDF to ZIP Archive
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF pages as images and/or text files packaged in a ZIP archive
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Extraction Info:</p>
                  <p>
                    Each page of your PDF will be extracted as separate files (images and/or text) and packaged into a ZIP archive for easy download and organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to extract`
                    : 'PDF file uploaded above will be extracted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extraction Type
                </label>
                <select
                  id="pdf-to-zip-type"
                  defaultValue="images"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="images">Images only</option>
                  <option value="text">Text only</option>
                  <option value="both">Both images and text</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Format
                </label>
                <select
                  id="pdf-to-zip-format"
                  defaultValue="png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Resolution (DPI)
                </label>
                <select
                  id="pdf-to-zip-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Extract images for presentations or web use</li>
                    <li>Extract text for editing and reuse</li>
                    <li>Extract both for complete page backups</li>
                    <li>Higher DPI creates larger but better quality images</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Extract Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-zip-process-btn"
                onClick={() => pdfToZip()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Extract to ZIP
              </button>
            </div>
          </div>
        </div>

        {/* PDF Enhancement Tools */}
        <div id="digital-sign-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Digital Signature
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Add digital signature to your PDF documents</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Digital Signature Info:</p>
                  <p>
                    Add legally binding digital signatures to your PDF documents using your P12/PFX certificate. The signature can be verified in any PDF reader.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to sign`
                    : 'PDF file uploaded above will be signed'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificate File (.p12/.pfx)
                </label>
                <input
                  type="file"
                  accept=".p12,.pfx"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificate Password
                </label>
                <input
                  type="password"
                  placeholder="Enter certificate password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Signature Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g., I approve this document"
                  defaultValue="I approve this document"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>You need a valid P12/PFX digital certificate to sign PDFs</li>
                    <li>Digital signatures are legally binding and cannot be removed</li>
                    <li>The signature can be verified in Adobe Acrobat, Foxit, and other PDF readers</li>
                    <li>This feature requires specialized cryptographic libraries</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-orange-600 dark:text-orange-400 mr-3">🔧</span>
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium mb-1">Feature Status:</p>
                  <p>
                    Digital signature functionality requires complex cryptographic operations and certificate handling. 
                    The full implementation is available in the codebase but requires the digital-sign-pdf.js library 
                    and proper certificate validation setup. For production use, consider using dedicated services like 
                    Adobe Sign, DocuSign, or HelloSign.
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Button */}
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
                title="Digital signature feature requires additional setup"
              >
                Sign PDF (Setup Required)
              </button>
            </div>
          </div>
        </div>

        <div id="validate-signature-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Validate Digital Signatures
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Verify digital signatures and check certificate validity in PDF documents
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Validation Info:</p>
                  <p>
                    This tool performs full cryptographic signature validation using node-forge, including certificate chain verification, expiration checking, and algorithm analysis. Also detects Indonesian BSrE (Balai Sertifikasi Elektronik, BSSN) QR code signatures.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready to validate`
                    : 'PDF file uploaded above will be checked for signatures'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Validation Features:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Extracts and parses digital signature data using PKCS#7</li>
                    <li>Validates certificate information (signer, issuer, validity dates)</li>
                    <li>Checks certificate expiration status</li>
                    <li>Identifies self-signed certificates</li>
                    <li>Displays cryptographic algorithms used</li>
                    <li>Shows signature metadata (reason, location, contact)</li>
                    <li>🇮🇩 Detects BSrE QR code signatures from BSSN</li>
                    <li>🇮🇩 Identifies Indonesian government digital certificates</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-3">✓</span>
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-1">What You'll See:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Signer name and organization</li>
                    <li>Certificate issuer and organization</li>
                    <li>Certificate validity period (from/to dates)</li>
                    <li>Expiration status (valid or expired)</li>
                    <li>Self-signed certificate indicator</li>
                    <li>Signature and digest algorithms</li>
                    <li>Signature reason, location, and contact info</li>
                    <li>🇮🇩 BSrE QR code detection and data extraction</li>
                    <li>🇮🇩 Indonesian government certificate identification</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Validate Button */}
            <div className="flex justify-center">
              <button
                id="validate-signature-process-btn"
                onClick={() => validateSignaturePdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Check Signatures
              </button>
            </div>
          </div>
        </div>

        <div id="add-stamps-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add Stamps to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add professional stamps to your PDF documents
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Stamp Info:</p>
                  <p>
                    Add text stamps like APPROVED, CONFIDENTIAL, DRAFT, etc. to your PDF pages. Customize position, opacity, size, and color.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for stamping`
                    : 'PDF file uploaded above will be stamped'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stamp Type
                  </label>
                  <select
                    id="stamp-type"
                    defaultValue="approved"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    onChange={(e) => {
                      const customTextDiv = document.getElementById('custom-text-div');
                      if (customTextDiv) {
                        customTextDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
                      }
                    }}
                  >
                    <option value="approved">✓ Approved</option>
                    <option value="confidential">🔒 Confidential</option>
                    <option value="draft">📝 Draft</option>
                    <option value="final">✅ Final</option>
                    <option value="reviewed">👁️ Reviewed</option>
                    <option value="void">❌ Void</option>
                    <option value="custom">✏️ Custom Text</option>
                  </select>
                </div>

                <div id="custom-text-div" style={{ display: 'none' }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Text
                  </label>
                  <input
                    type="text"
                    id="stamp-custom-text"
                    placeholder="Enter custom text"
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <select
                    id="stamp-position"
                    defaultValue="top-right"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="center">Center (Diagonal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apply to Pages
                  </label>
                  <select
                    id="stamp-pages"
                    defaultValue="all"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    onChange={(e) => {
                      const customPagesDiv = document.getElementById('custom-pages-div');
                      if (customPagesDiv) {
                        customPagesDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
                      }
                    }}
                  >
                    <option value="all">All Pages</option>
                    <option value="first">First Page Only</option>
                    <option value="last">Last Page Only</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              <div id="custom-pages-div" style={{ display: 'none' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Numbers
                </label>
                <input
                  type="text"
                  id="stamp-custom-pages"
                  placeholder="e.g., 1,3,5 or 1-5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use comma for specific pages (1,3,5) or dash for ranges (1-5)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opacity
                  </label>
                  <input
                    type="range"
                    id="stamp-opacity"
                    min="0.1"
                    max="1"
                    step="0.1"
                    defaultValue="0.5"
                    className="w-full"
                    onInput={(e) => {
                      const value = (parseFloat((e.target as HTMLInputElement).value) * 100).toFixed(0);
                      const display = document.getElementById('opacity-value');
                      if (display) display.textContent = `${value}%`;
                    }}
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span id="opacity-value">50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <input
                    type="range"
                    id="stamp-font-size"
                    min="12"
                    max="72"
                    step="4"
                    defaultValue="36"
                    className="w-full"
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      const display = document.getElementById('font-size-value');
                      if (display) display.textContent = `${value}px`;
                    }}
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span id="font-size-value">36px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    id="stamp-color"
                    defaultValue="#FF0000"
                    className="w-full h-10 px-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Use preset stamps for common document statuses</li>
                    <li>Center position creates diagonal stamps across the page</li>
                    <li>Adjust opacity to make stamps visible but not intrusive</li>
                    <li>Custom ranges allow selective page stamping</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Add Stamp Button */}
            <div className="flex justify-center">
              <button
                id="add-stamp-process-btn"
                onClick={() => addStampsToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Add Stamp
              </button>
            </div>
          </div>
        </div>

        <div id="add-watermark-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add Watermark to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add text or image watermarks to your PDF documents
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Watermark Info:</p>
                  <p>
                    Add text or image watermarks to protect your documents. Choose position, opacity, and customize appearance.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for watermarking`
                    : 'PDF file uploaded above will be watermarked'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Watermark Type
                  </label>
                  <select
                    id="watermark-type"
                    defaultValue="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    onChange={(e) => {
                      const textDiv = document.getElementById('watermark-text-div');
                      const imageDiv = document.getElementById('watermark-image-div');
                      const colorDiv = document.getElementById('watermark-color-div');
                      const fontSizeDiv = document.getElementById('watermark-font-size-div');
                      const scaleDiv = document.getElementById('watermark-scale-div');
                      
                      if (e.target.value === 'text') {
                        textDiv?.classList.remove('hidden');
                        colorDiv?.classList.remove('hidden');
                        fontSizeDiv?.classList.remove('hidden');
                        imageDiv?.classList.add('hidden');
                        scaleDiv?.classList.add('hidden');
                      } else {
                        textDiv?.classList.add('hidden');
                        colorDiv?.classList.add('hidden');
                        fontSizeDiv?.classList.add('hidden');
                        imageDiv?.classList.remove('hidden');
                        scaleDiv?.classList.remove('hidden');
                      }
                    }}
                  >
                    <option value="text">📝 Text Watermark</option>
                    <option value="image">🖼️ Image Watermark</option>
                  </select>
                </div>

                <div id="watermark-text-div">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    id="watermark-text"
                    placeholder="CONFIDENTIAL"
                    defaultValue="CONFIDENTIAL"
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div id="watermark-image-div" className="hidden">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Watermark Image (PNG/JPG)
                  </label>
                  <input
                    type="file"
                    id="watermark-image"
                    accept="image/png,image/jpeg,image/jpg"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <select
                    id="watermark-position"
                    defaultValue="diagonal"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="diagonal">Diagonal (Center)</option>
                    <option value="top">Top Center</option>
                    <option value="bottom">Bottom Center</option>
                    <option value="center">Center (Horizontal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apply to Pages
                  </label>
                  <select
                    id="watermark-pages"
                    defaultValue="all"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    onChange={(e) => {
                      const customPagesDiv = document.getElementById('watermark-custom-pages-div');
                      if (customPagesDiv) {
                        customPagesDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
                      }
                    }}
                  >
                    <option value="all">All Pages</option>
                    <option value="first">First Page Only</option>
                    <option value="last">Last Page Only</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              <div id="watermark-custom-pages-div" style={{ display: 'none' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Numbers
                </label>
                <input
                  type="text"
                  id="watermark-custom-pages"
                  placeholder="e.g., 1,3,5 or 1-5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use comma for specific pages (1,3,5) or dash for ranges (1-5)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opacity
                  </label>
                  <input
                    type="range"
                    id="watermark-opacity"
                    min="0.1"
                    max="1"
                    step="0.1"
                    defaultValue="0.3"
                    className="w-full"
                    onInput={(e) => {
                      const value = (parseFloat((e.target as HTMLInputElement).value) * 100).toFixed(0);
                      const display = document.getElementById('watermark-opacity-value');
                      if (display) display.textContent = `${value}%`;
                    }}
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span id="watermark-opacity-value">30%</span>
                  </div>
                </div>

                <div id="watermark-font-size-div">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <input
                    type="range"
                    id="watermark-font-size"
                    min="20"
                    max="100"
                    step="5"
                    defaultValue="60"
                    className="w-full"
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      const display = document.getElementById('watermark-font-size-value');
                      if (display) display.textContent = `${value}px`;
                    }}
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span id="watermark-font-size-value">60px</span>
                  </div>
                </div>

                <div id="watermark-scale-div" className="hidden">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image Scale
                  </label>
                  <input
                    type="range"
                    id="watermark-scale"
                    min="0.1"
                    max="2"
                    step="0.1"
                    defaultValue="1.0"
                    className="w-full"
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      const display = document.getElementById('watermark-scale-value');
                      if (display) display.textContent = `${value}x`;
                    }}
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span id="watermark-scale-value">1.0x</span>
                  </div>
                </div>

                <div id="watermark-color-div">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    id="watermark-color"
                    defaultValue="#808080"
                    className="w-full h-10 px-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rotation (degrees)
                </label>
                <input
                  type="range"
                  id="watermark-rotation"
                  min="-180"
                  max="180"
                  step="15"
                  defaultValue="0"
                  className="w-full"
                  onInput={(e) => {
                    const value = (e.target as HTMLInputElement).value;
                    const display = document.getElementById('watermark-rotation-value');
                    if (display) display.textContent = `${value}°`;
                  }}
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <span id="watermark-rotation-value">0°</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Use text watermarks for copyright or confidentiality notices</li>
                    <li>Use image watermarks for logos or signatures</li>
                    <li>Diagonal position is most common for watermarks</li>
                    <li>Lower opacity (20-40%) makes watermarks less intrusive</li>
                    <li>Custom rotation overrides default position rotation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                id="add-watermark-process-btn"
                onClick={() => addWatermarkToPdf()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.files.length === 0}
              >
                Add Watermark
              </button>
            </div>
          </div>
        </div>

        <div id="add-attachments-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Attachments
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Attach files to your PDF document</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Attachment Info:</p>
                  <p>
                    Embed files inside your PDF. Attachments can be added at document level or attached to specific pages.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for attachments`
                    : 'PDF file uploaded above will receive attachments'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Files to Attach
                </label>
                <input
                  type="file"
                  id="attachment-files-input"
                  multiple
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-gray-800"
                />
                <div id="attachment-file-list" className="mt-3 space-y-2"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachment Level
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="attachment-level"
                      value="document"
                      defaultChecked
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Document Level (Portfolio)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="attachment-level"
                      value="page"
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Page Level (Specific pages)</span>
                  </label>
                </div>
              </div>

              <div id="page-range-wrapper" className="hidden">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Range
                </label>
                <input
                  type="text"
                  id="attachment-page-range"
                  placeholder="e.g., 1,3-5,8"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Specify pages to attach files to (e.g., 1,3-5,8 for pages 1, 3 to 5, and 8)
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                id="add-attachments-process-btn"
                onClick={() => processAddAttachments()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Attachments
              </button>
            </div>
          </div>
        </div>

        <div id="extract-attachments-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract Attachments
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Extract embedded files from your PDF document</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Extract Info:</p>
                  <p>
                    This tool will extract all attached/embedded files from your PDF and download them as a ZIP archive.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for extraction`
                    : 'PDF file uploaded above will be processed'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                id="extract-attachments-process-btn"
                onClick={() => processExtractAttachments()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Extract Attachments
              </button>
            </div>
          </div>
        </div>

        <div id="edit-attachments-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Edit Attachments
              </h2>
              <p className="text-gray-600 dark:text-gray-400">View and remove embedded files from your PDF</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Edit Info:</p>
                  <p>
                    Select attachments to remove from your PDF. Click "Load Attachments" to see all embedded files.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for editing`
                    : 'PDF file uploaded above will be processed'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={async () => {
                  const attachments = await processEditAttachments();
                  if (attachments && attachments.length === 0) {
                    showAlert('No Attachments', 'This PDF does not contain any attachments.', 'info');
                  }
                }}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
              >
                Load Attachments
              </button>
            </div>

            {editAttachments.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Attachments ({editAttachments.length})
                  </h3>
                  <button
                    onClick={() => {
                      const allSelected = editAttachments.every(att => selectedAttachmentsToRemove.has(att.index));
                      if (allSelected) {
                        setSelectedAttachmentsToRemove(new Set());
                      } else {
                        setSelectedAttachmentsToRemove(new Set(editAttachments.map(att => att.index)));
                      }
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-all"
                  >
                    {editAttachments.every(att => selectedAttachmentsToRemove.has(att.index)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="space-y-2">
                  {editAttachments.map((attachment) => (
                    <div
                      key={attachment.index}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        selectedAttachmentsToRemove.has(attachment.index)
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 opacity-60 line-through'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{attachment.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {attachment.page === 0 ? 'Document-level attachment' : `Page ${attachment.page} attachment`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const newSet = new Set(selectedAttachmentsToRemove);
                          if (newSet.has(attachment.index)) {
                            newSet.delete(attachment.index);
                          } else {
                            newSet.add(attachment.index);
                          }
                          setSelectedAttachmentsToRemove(newSet);
                        }}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          selectedAttachmentsToRemove.has(attachment.index)
                            ? 'bg-gray-500 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {selectedAttachmentsToRemove.has(attachment.index) ? 'Undo' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editAttachments.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={() => processRemoveAttachments(Array.from(selectedAttachmentsToRemove))}
                  disabled={selectedAttachmentsToRemove.size === 0}
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes ({selectedAttachmentsToRemove.size} to remove)
                </button>
              </div>
            )}
          </div>
        </div>

        <div id="add-blank-page-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Blank Page
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Insert blank pages into PDF</p>
            </div>

            {/* File Display Area */}
            <div id="add-blank-file-display-area" className="mb-4"></div>

            {/* Tool Options */}
            <div id="add-blank-tool-options" className="hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position (Page Number)
                  </label>
                  <input
                    type="number"
                    id="add-blank-page-position"
                    min="0"
                    defaultValue="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p
                    id="add-blank-page-position-hint"
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                  >
                    Enter 0 to insert at the beginning
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Blank Pages
                  </label>
                  <input
                    type="number"
                    id="add-blank-page-count"
                    min="1"
                    defaultValue="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Position 0 inserts at the beginning</li>
                      <li>Position equal to page count inserts at the end</li>
                      <li>Blank pages will match the size of existing pages</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  id="add-blank-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Add Blank Pages
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="header-footer-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Headers/Footers
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add customizable headers and footers to your PDF pages
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Placeholders:</p>
                  <p>Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{page}'}</code> for current page number and <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{total}'}</code> for total pages.</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for headers/footers`
                    : 'PDF file uploaded above will receive headers/footers'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Left
                    </label>
                    <input
                      type="text"
                      id="header-left"
                      placeholder="Document Title"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Center
                    </label>
                    <input
                      type="text"
                      id="header-center"
                      placeholder="Chapter Name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Right
                    </label>
                    <input
                      type="text"
                      id="header-right"
                      placeholder="Date"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Footer</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Left
                    </label>
                    <input
                      type="text"
                      id="footer-left"
                      placeholder="Company Name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Center
                    </label>
                    <input
                      type="text"
                      id="footer-center"
                      placeholder="Page {page} of {total}"
                      defaultValue="Page {page} of {total}"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Right
                    </label>
                    <input
                      type="text"
                      id="footer-right"
                      placeholder="© 2024"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <input
                    type="number"
                    id="header-footer-font-size"
                    defaultValue="10"
                    min="6"
                    max="24"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Color
                  </label>
                  <input
                    type="color"
                    id="header-footer-font-color"
                    defaultValue="#000000"
                    className="w-full h-10 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Range
                  </label>
                  <input
                    type="text"
                    id="header-footer-page-range"
                    placeholder="e.g., 1-10 or leave empty for all"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const options = {
                    headerLeft: (document.getElementById('header-left') as HTMLInputElement)?.value || '',
                    headerCenter: (document.getElementById('header-center') as HTMLInputElement)?.value || '',
                    headerRight: (document.getElementById('header-right') as HTMLInputElement)?.value || '',
                    footerLeft: (document.getElementById('footer-left') as HTMLInputElement)?.value || '',
                    footerCenter: (document.getElementById('footer-center') as HTMLInputElement)?.value || '',
                    footerRight: (document.getElementById('footer-right') as HTMLInputElement)?.value || '',
                    fontSize: parseInt((document.getElementById('header-footer-font-size') as HTMLInputElement)?.value || '10'),
                    fontColor: (document.getElementById('header-footer-font-color') as HTMLInputElement)?.value || '#000000',
                    pageRange: (document.getElementById('header-footer-page-range') as HTMLInputElement)?.value || '',
                  };
                  processHeaderFooter(options);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Add Headers/Footers
              </button>
            </div>
          </div>
        </div>

        {/* Color Manipulation Tools */}
        <div id="background-color-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Background Color
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Change PDF page background color</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Background Info:</p>
                  <p>
                    This tool adds a colored background layer behind all PDF content. The original content will remain visible on top of the background.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for background color change`
                    : 'PDF file uploaded above will receive a background color'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  id="background-color-picker"
                  defaultValue="#ffffff"
                  className="h-12 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  id="background-color-hex"
                  defaultValue="#ffffff"
                  placeholder="#ffffff"
                  maxLength={7}
                  onChange={(e) => {
                    const picker = document.getElementById('background-color-picker') as HTMLInputElement;
                    if (picker && e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                      picker.value = e.target.value;
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white font-mono"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Pick a color or enter a hex code (e.g., #ffffff for white)
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const colorPicker = document.getElementById('background-color-picker') as HTMLInputElement;
                  const colorHex = colorPicker?.value || '#ffffff';
                  processBackgroundColor(colorHex);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Apply Background Color
              </button>
            </div>
          </div>
        </div>

        <div id="text-color-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Text Color</h2>
              <p className="text-gray-600 dark:text-gray-400">Change PDF text color by detecting dark pixels</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Text Color Info:</p>
                  <p>
                    This tool renders each page as an image and changes dark pixels (text) to your selected color. Note: This converts the PDF to images.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for text color change`
                    : 'PDF file uploaded above will have text color changed'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  id="text-color-picker"
                  defaultValue="#000000"
                  className="h-12 w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  id="text-color-hex"
                  defaultValue="#000000"
                  placeholder="#000000"
                  maxLength={7}
                  onChange={(e) => {
                    const picker = document.getElementById('text-color-picker') as HTMLInputElement;
                    if (picker && e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                      picker.value = e.target.value;
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white font-mono"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Pick a color or enter a hex code (e.g., #FF0000 for red text)
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    This process may take some time for large PDFs and will increase file size as pages are converted to images.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const colorPicker = document.getElementById('text-color-picker') as HTMLInputElement;
                  const colorHex = colorPicker?.value || '#000000';
                  processTextColor(colorHex);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Apply Text Color
              </button>
            </div>
          </div>
        </div>

        <div id="invert-colors-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invert Colors
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Invert all colors in PDF for a negative effect</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Invert Info:</p>
                  <p>
                    This tool creates a negative effect by inverting all colors (white becomes black, black becomes white, etc.). Pages are converted to images.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for color inversion`
                    : 'PDF file uploaded above will have colors inverted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    This process converts pages to images and may increase file size. Best for creating negative/dark mode versions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => processInvertColors()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Invert Colors
              </button>
            </div>
          </div>
        </div>

        <div id="adjust-colors-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Adjust Colors
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Fine-tune brightness, contrast, saturation, and more
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Color Adjustment Info:</p>
                  <p>
                    Adjust multiple color properties to enhance your PDF. Pages are rendered to images with your adjustments applied.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for color adjustments`
                    : 'PDF file uploaded above will have colors adjusted'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brightness */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Brightness
                    </label>
                    <span id="brightness-value" className="text-sm text-gray-600 dark:text-gray-400">0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-brightness"
                    min="-100"
                    max="100"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('brightness-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contrast
                    </label>
                    <span id="contrast-value" className="text-sm text-gray-600 dark:text-gray-400">0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-contrast"
                    min="-100"
                    max="100"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('contrast-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Saturation
                    </label>
                    <span id="saturation-value" className="text-sm text-gray-600 dark:text-gray-400">0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-saturation"
                    min="-100"
                    max="100"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('saturation-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Hue Shift */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hue Shift
                    </label>
                    <span id="hue-shift-value" className="text-sm text-gray-600 dark:text-gray-400">0°</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-hue-shift"
                    min="-180"
                    max="180"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('hue-shift-value');
                      if (display) display.textContent = val + '°';
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Temperature
                    </label>
                    <span id="temperature-value" className="text-sm text-gray-600 dark:text-gray-400">0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-temperature"
                    min="-100"
                    max="100"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('temperature-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Tint */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tint
                    </label>
                    <span id="tint-value" className="text-sm text-gray-600 dark:text-gray-400">0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-tint"
                    min="-100"
                    max="100"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('tint-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Gamma */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gamma
                    </label>
                    <span id="gamma-value" className="text-sm text-gray-600 dark:text-gray-400">1.0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-gamma"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    defaultValue="1.0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('gamma-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Sepia */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sepia
                    </label>
                    <span id="sepia-value" className="text-sm text-gray-600 dark:text-gray-400">0</span>
                  </div>
                  <input
                    type="range"
                    id="adjust-sepia"
                    min="0"
                    max="100"
                    defaultValue="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = document.getElementById('sepia-value');
                      if (display) display.textContent = val;
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  // Reset all sliders
                  const sliders = [
                    { id: 'adjust-brightness', value: '0', displayId: 'brightness-value', suffix: '' },
                    { id: 'adjust-contrast', value: '0', displayId: 'contrast-value', suffix: '' },
                    { id: 'adjust-saturation', value: '0', displayId: 'saturation-value', suffix: '' },
                    { id: 'adjust-hue-shift', value: '0', displayId: 'hue-shift-value', suffix: '°' },
                    { id: 'adjust-temperature', value: '0', displayId: 'temperature-value', suffix: '' },
                    { id: 'adjust-tint', value: '0', displayId: 'tint-value', suffix: '' },
                    { id: 'adjust-gamma', value: '1.0', displayId: 'gamma-value', suffix: '' },
                    { id: 'adjust-sepia', value: '0', displayId: 'sepia-value', suffix: '' },
                  ];
                  sliders.forEach(({ id, value, displayId, suffix }) => {
                    const slider = document.getElementById(id) as HTMLInputElement;
                    const display = document.getElementById(displayId);
                    if (slider) slider.value = value;
                    if (display) display.textContent = value + suffix;
                  });
                }}
                className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-full hover:bg-gray-600 transition"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  const settings: AdjustColorsSettings = {
                    brightness: parseInt((document.getElementById('adjust-brightness') as HTMLInputElement)?.value || '0'),
                    contrast: parseInt((document.getElementById('adjust-contrast') as HTMLInputElement)?.value || '0'),
                    saturation: parseInt((document.getElementById('adjust-saturation') as HTMLInputElement)?.value || '0'),
                    hueShift: parseInt((document.getElementById('adjust-hue-shift') as HTMLInputElement)?.value || '0'),
                    temperature: parseInt((document.getElementById('adjust-temperature') as HTMLInputElement)?.value || '0'),
                    tint: parseInt((document.getElementById('adjust-tint') as HTMLInputElement)?.value || '0'),
                    gamma: parseFloat((document.getElementById('adjust-gamma') as HTMLInputElement)?.value || '1.0'),
                    sepia: parseInt((document.getElementById('adjust-sepia') as HTMLInputElement)?.value || '0'),
                  };
                  processAdjustColors(settings);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Apply Adjustments
              </button>
            </div>
          </div>
        </div>

        <div id="grayscale-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert to Grayscale
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF to black and white</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Grayscale Info:</p>
                  <p>
                    This tool converts your PDF to black and white by removing all color information. Pages are rendered to images.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for grayscale conversion`
                    : 'PDF file uploaded above will be converted to grayscale'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    Conversion uses JPEG format for better compression. Output file size may vary based on content.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => processConvertToGreyscale()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Convert to Grayscale
              </button>
            </div>
          </div>
        </div>

        <div id="posterize-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Posterize PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Split PDF pages into poster-sized tiles</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Posterize Info:</p>
                  <p>
                    This tool splits PDF pages into a grid of tiles for printing large posters. Each tile becomes a separate page.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for posterizing`
                    : 'PDF file uploaded above will be posterized'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Grid Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grid Settings</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rows
                  </label>
                  <input
                    type="number"
                    id="posterize-rows"
                    min="1"
                    max="10"
                    defaultValue="2"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Columns
                  </label>
                  <input
                    type="number"
                    id="posterize-cols"
                    min="1"
                    max="10"
                    defaultValue="2"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overlap
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="posterize-overlap"
                      min="0"
                      step="0.1"
                      defaultValue="0"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <select
                      id="posterize-overlap-units"
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="pt">pt</option>
                      <option value="in">in</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Range
                  </label>
                  <input
                    type="text"
                    id="posterize-page-range"
                    placeholder="e.g., 1-3, 5"
                    defaultValue="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Output Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Output Settings</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Size
                  </label>
                  <select
                    id="posterize-page-size"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                    <option value="Tabloid">Tabloid</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientation
                  </label>
                  <select
                    id="posterize-orientation"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="auto">Auto</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scaling Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="posterize-scaling"
                        value="fit"
                        defaultChecked
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Fit (maintain aspect ratio)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="posterize-scaling"
                        value="fill"
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Fill (may crop)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const options: PosterizeOptions = {
                    rows: parseInt((document.getElementById('posterize-rows') as HTMLInputElement)?.value || '2'),
                    cols: parseInt((document.getElementById('posterize-cols') as HTMLInputElement)?.value || '2'),
                    pageSize: (document.getElementById('posterize-page-size') as HTMLSelectElement)?.value as any || 'A4',
                    orientation: (document.getElementById('posterize-orientation') as HTMLSelectElement)?.value as any || 'auto',
                    scalingMode: (document.querySelector('input[name="posterize-scaling"]:checked') as HTMLInputElement)?.value as any || 'fit',
                    overlap: parseFloat((document.getElementById('posterize-overlap') as HTMLInputElement)?.value || '0'),
                    overlapUnits: (document.getElementById('posterize-overlap-units') as HTMLSelectElement)?.value as any || 'pt',
                    pageRange: (document.getElementById('posterize-page-range') as HTMLInputElement)?.value || '1',
                  };
                  processPosterize(options);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Create Poster
              </button>
            </div>
          </div>
        </div>

        <div id="rotate-custom-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Custom Rotation
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Rotate PDF by custom angle</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Custom Rotation Info:</p>
                  <p>
                    Rotate all pages by any angle. For angles that are multiples of 90°, the original quality is preserved. For other angles, pages are embedded with transformation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for rotation`
                    : 'PDF file uploaded above will be rotated'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rotation Angle (degrees)
              </label>
              <input
                type="number"
                id="custom-angle"
                min="-360"
                max="360"
                step="1"
                defaultValue="0"
                placeholder="Enter angle (e.g., 45, 90, -30)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Positive values rotate clockwise, negative values rotate counter-clockwise
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => {
                  const input = document.getElementById('custom-angle') as HTMLInputElement;
                  if (input) input.value = '90';
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
              >
                90° CW
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('custom-angle') as HTMLInputElement;
                  if (input) input.value = '-90';
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
              >
                90° CCW
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('custom-angle') as HTMLInputElement;
                  if (input) input.value = '180';
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
              >
                180°
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('custom-angle') as HTMLInputElement;
                  if (input) input.value = '45';
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
              >
                45°
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Note:</p>
                  <p>
                    Non-90° rotations will increase file size as pages are embedded. The canvas size adjusts to fit the rotated content.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const angle = parseFloat((document.getElementById('custom-angle') as HTMLInputElement)?.value || '0');
                  if (angle === 0) {
                    showAlert('Invalid Angle', 'Please enter a non-zero angle.');
                    return;
                  }
                  processRotateCustom(angle);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Apply Rotation
              </button>
            </div>
          </div>
        </div>

        <div id="rasterize-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Rasterize PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert vector PDF to raster images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Rasterization Info:</p>
                  <p>
                    Converts vector PDF content to raster images. This flattens all layers, removes text selectability, but ensures consistent rendering across all devices.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files[0].name} ready for rasterization`
                    : 'PDF file uploaded above will be rasterized'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{state.files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(state.files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DPI (Resolution)
                </label>
                <select
                  id="rasterize-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen/Web)</option>
                  <option value="96">96 DPI (Standard Screen)</option>
                  <option value="150">150 DPI (Standard Quality)</option>
                  <option value="200">200 DPI (Good Quality)</option>
                  <option value="300">300 DPI (Print Quality)</option>
                  <option value="600">600 DPI (High Quality)</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Higher DPI = better quality but larger file size
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Format
                </label>
                <select
                  id="rasterize-format"
                  defaultValue="png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpeg">JPEG (Smaller size)</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  PNG preserves quality, JPEG reduces file size
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="rasterize-grayscale"
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Convert to Grayscale
                </span>
              </label>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Text becomes non-selectable after rasterization</li>
                    <li>File size may increase significantly at high DPI</li>
                    <li>Processing may take time for large PDFs</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  const options: RasterizeOptions = {
                    dpi: parseInt((document.getElementById('rasterize-dpi') as HTMLSelectElement)?.value || '150'),
                    format: (document.getElementById('rasterize-format') as HTMLSelectElement)?.value as 'png' | 'jpeg' || 'png',
                    grayscale: (document.getElementById('rasterize-grayscale') as HTMLInputElement)?.checked || false,
                    quality: 95,
                  };
                  processRasterize(options);
                }}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Rasterize PDF
              </button>
            </div>
          </div>
        </div>

        <div id="flatten-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Flatten PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Flatten form fields and annotations into the page content
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Flattening Info:</p>
                  <p>
                    Flattening converts interactive form fields and annotations to static content. 
                    This prevents editing and ensures the content appears the same on all devices.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files.length} PDF(s) ready for flattening`
                    : 'PDF file(s) uploaded above will be flattened'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {state.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                        <span className="truncate">{file.name}</span>
                        <span className="ml-4 text-gray-500 text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Form fields will become non-editable</li>
                    <li>Annotations and comments will be merged into pages</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => processFlatten()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Flatten PDF
              </button>
            </div>
          </div>
        </div>

        <div id="linearize-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Linearize PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Optimize PDF for fast web viewing (enables byte-range requests)
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Linearization Info:</p>
                  <p>
                    Linearizing (also called web optimization) restructures PDFs so they can start displaying 
                    before the entire file downloads. Essential for web-based PDF viewers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.files.length > 0
                    ? `${state.files.length} PDF(s) ready for linearization`
                    : 'PDF file(s) uploaded above will be linearized'}
                </p>
                {state.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {state.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                        <span className="truncate">{file.name}</span>
                        <span className="ml-4 text-gray-500 text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => processLinearize()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Linearize PDF
              </button>
            </div>
          </div>
        </div>

        <div id="sanitize-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Sanitize PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Remove hidden data and scripts for security</p>
            </div>

            <div className="space-y-4 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="sanitize-remove-metadata"
                  defaultChecked
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700 dark:text-gray-300">Remove Metadata (Author, Title, etc.)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="sanitize-remove-annotations"
                  defaultChecked
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700 dark:text-gray-300">Remove Annotations and Comments</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="sanitize-remove-javascript"
                  defaultChecked
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700 dark:text-gray-300">Remove JavaScript</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="sanitize-flatten-forms"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700 dark:text-gray-300">Flatten Forms (Make Non-Editable)</span>
              </label>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => processSanitize()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Sanitize PDF
              </button>
            </div>
          </div>
        </div>

        {/* Security Tools */}
        <div id="encrypt-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Encrypt PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Protect PDF with password encryption (256-bit AES)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Password (Required)
                </label>
                <input
                  type="password"
                  id="encrypt-user-password"
                  placeholder="Password to open PDF"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner Password (Optional)
                </label>
                <input
                  type="password"
                  id="encrypt-owner-password"
                  placeholder="Password for permissions"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="encrypt-add-restrictions"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Add usage restrictions (requires owner password)
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                Prevents printing, copying, and editing without owner password
              </p>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={() => processEncrypt()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Encrypt PDF
              </button>
            </div>
          </div>
        </div>

        <div id="decrypt-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Decrypt PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Remove password protection from PDF
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="decrypt-password"
                placeholder="Enter PDF password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => processDecrypt()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Decrypt PDF
              </button>
            </div>
          </div>
        </div>

        <div id="change-permissions-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Change Permissions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Modify PDF security permissions and encryption</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password (if encrypted)
              </label>
              <input
                type="password"
                id="permissions-current-password"
                placeholder="Enter current password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required only if the PDF is already password-protected
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New User Password
                </label>
                <input
                  type="password"
                  id="permissions-user-password"
                  placeholder="Enter new user password (optional)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave blank to remove encryption
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Owner Password
                </label>
                <input
                  type="password"
                  id="permissions-owner-password"
                  placeholder="Enter new owner password (optional)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Defaults to user password if not set
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Document Permissions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Set what users can do with this PDF (requires owner password)
              </p>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="permissions-allow-print"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Allow Printing</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="permissions-allow-modify"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Allow Modifications</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="permissions-allow-copy"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Allow Content Copying</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="permissions-allow-annotate"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Allow Annotations</span>
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => processChangePermissions()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Update Permissions
              </button>
            </div>
          </div>
        </div>

        <div id="remove-metadata-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Remove Metadata
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Remove metadata and hidden information from your PDF
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Metadata Removal Options
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="remove-document-info"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Remove Document Information</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Title, Author, Subject, Keywords, Creator, Producer</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="remove-xmp-metadata"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Remove XMP Metadata</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Extended metadata streams and custom properties</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="remove-piece-info"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Remove Private Application Data</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PieceInfo and application-specific data</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="remove-document-ids"
                    defaultChecked
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Remove Document IDs</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unique identifiers for tracking</p>
                  </div>
                </label>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This will permanently remove selected metadata from the PDF. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => processRemoveMetadata()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Remove Metadata
              </button>
            </div>
          </div>
        </div>

        <div id="edit-metadata-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Edit Metadata
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Modify document properties and information</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Document Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="edit-meta-title"
                    placeholder="Document title"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    id="edit-meta-author"
                    placeholder="Author name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="edit-meta-subject"
                    placeholder="Document subject"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    id="edit-meta-keywords"
                    placeholder="keyword1, keyword2, keyword3"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Separate keywords with commas
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Creator
                  </label>
                  <input
                    type="text"
                    id="edit-meta-creator"
                    placeholder="Creating application"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Producer
                  </label>
                  <input
                    type="text"
                    id="edit-meta-producer"
                    placeholder="PDF producer"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => processEditMetadata()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Update Metadata
              </button>
            </div>
          </div>
        </div>

        <div id="view-metadata-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                View Metadata
              </h2>
              <p className="text-gray-600 dark:text-gray-400">View all PDF document properties and information</p>
            </div>

            <div id="metadata-empty" className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Upload a PDF and click "View Metadata" to see document properties</p>
            </div>

            <div id="metadata-result" className="hidden mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Document Information
              </h3>
              <div id="metadata-basic" className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6"></div>
            </div>

            <div id="metadata-custom" className="hidden mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Custom Fields
              </h3>
              <div id="metadata-custom-fields" className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6"></div>
            </div>

            <div id="metadata-document" className="hidden mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                File Information
              </h3>
              <div id="metadata-document-info" className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"></div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => processViewMetadata()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                View Metadata
              </button>
            </div>
          </div>
        </div>

        <div id="remove-restrictions-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Remove Restrictions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Remove editing, printing, and copying restrictions from your PDF
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password (if required)
              </label>
              <input
                type="password"
                id="restrictions-password"
                placeholder="Enter owner or user password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required only if the PDF is password-protected
              </p>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                ⚠️ Note: This will remove all security restrictions including:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 ml-4 space-y-1">
                <li>• Printing restrictions</li>
                <li>• Content copying restrictions</li>
                <li>• Editing restrictions</li>
                <li>• Annotation restrictions</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => processRemoveRestrictions()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Remove Restrictions
              </button>
            </div>
          </div>
        </div>

        <div id="remove-annotations-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Remove Annotations
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Remove all comments, highlights, and markups from your PDF
              </p>
            </div>

            <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                What Will Be Removed:
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Text comments and notes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Highlights and underlines</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Stamps and signatures</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Drawing markups (lines, shapes, freehand)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Sticky notes and callouts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>All other annotation types</span>
                </li>
              </ul>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Warning:</strong> This action cannot be undone. All annotations will be permanently removed from the PDF.
              </p>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => processRemoveAnnotations()}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                Remove All Annotations
              </button>
            </div>
          </div>
        </div>

        {/* Analysis & Extraction Tools */}
        <div id="extract-images-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract Images
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Extract all images from PDF</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <select
                id="image-format"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="original">Original Format</option>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Extract Images
              </button>
            </div>
          </div>
        </div>

        <div id="extract-tables-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract Tables
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Extract tables from PDF</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <select
                id="table-format"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Extract Tables
              </button>
            </div>
          </div>
        </div>

        <div id="ocr-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">OCR PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract text from scanned documents
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                id="ocr-language"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="chi_sim">Chinese (Simplified)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Perform OCR
              </button>
            </div>
          </div>
        </div>

        <div id="prepare-for-ai-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Prepare for AI
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Optimize PDF for AI processing</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Prepare for AI
              </button>
            </div>
          </div>
        </div>

        {/* Quality & Repair Tools */}
        <div id="deskew-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Deskew PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically straighten skewed pages
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Deskew PDF
              </button>
            </div>
          </div>
        </div>

        <div id="remove-blank-pages-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Remove Blank Pages
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically detect and remove blank pages
              </p>
            </div>

            {/* File Display Area */}
            <div id="remove-blank-file-display-area" className="mb-4"></div>

            {/* Options Panel */}
            <div id="remove-blank-options-panel" className="hidden">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detection Sensitivity
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="remove-blank-sensitivity-slider"
                    min="0"
                    max="100"
                    defaultValue="80"
                    className="flex-1"
                  />
                  <span
                    id="remove-blank-sensitivity-value"
                    className="text-gray-700 dark:text-gray-300 font-medium min-w-[3ch]"
                  >
                    80
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Higher values detect more pages as blank
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <button
                  id="remove-blank-detect-btn"
                  className="px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                >
                  Detect Blank Pages
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div id="remove-blank-preview-panel" className="hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <p
                  id="remove-blank-preview-info"
                  className="text-sm text-blue-800 dark:text-blue-200"
                ></p>
              </div>

              <div
                id="remove-blank-pages-preview"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6 max-h-[600px] overflow-y-auto"
              ></div>

              <div className="flex justify-center">
                <button
                  id="remove-blank-process-btn"
                  className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
                >
                  Remove Selected Pages
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="repair-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Repair PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Fix corrupted PDF files</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Repair PDF
              </button>
            </div>
          </div>
        </div>

        <div id="fix-page-size-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Fix Page Size
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Standardize page dimensions</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Fix Page Size
              </button>
            </div>
          </div>
        </div>

        <div id="scanner-effect-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Scanner Effect
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Apply scanner-like appearance to PDF
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Apply Scanner Effect
              </button>
            </div>
          </div>
        </div>

        <div id="scan-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Scan to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert scanned images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Create PDF from Scans
              </button>
            </div>
          </div>
        </div>

        {/* Formatting & Layout Tools */}
        <div id="booklet-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Booklet
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Arrange pages for booklet printing</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Create Booklet
              </button>
            </div>
          </div>
        </div>

        <div id="bates-numbering-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Bates Numbering
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add Bates numbers for legal documents
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prefix
                </label>
                <input
                  type="text"
                  id="bates-prefix"
                  placeholder="DOC-"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Number
                </label>
                <input
                  type="number"
                  id="bates-start"
                  min="1"
                  defaultValue="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Add Bates Numbers
              </button>
            </div>
          </div>
        </div>

        <div id="table-of-contents-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Table of Contents
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Generate table of contents</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Generate TOC
              </button>
            </div>
          </div>
        </div>

        <div id="bookmark-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Bookmarks
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Add and organize PDF bookmarks</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Manage Bookmarks
              </button>
            </div>
          </div>
        </div>

        <div id="layers-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Layers
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage PDF layers (Optional Content)
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Manage Layers
              </button>
            </div>
          </div>
        </div>

        <div id="font-to-outline-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert Fonts to Outlines
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert text to vector outlines</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert Fonts
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-pdfa-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert to PDF/A
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert to archival PDF/A format</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF/A Version
              </label>
              <select
                id="pdfa-version"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="1b">PDF/A-1b</option>
                <option value="2b">PDF/A-2b</option>
                <option value="3b">PDF/A-3b</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF/A
              </button>
            </div>
          </div>
        </div>

        <div id="compare-pdfs-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Compare PDFs
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Compare two PDF documents</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Second PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Compare PDFs
              </button>
            </div>
          </div>
        </div>

        {/* Merge Variations */}
        <div id="alternate-merge-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Alternate Merge
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Merge PDFs by alternating pages</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Second PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Alternate Merge
              </button>
            </div>
          </div>
        </div>

        <div id="combine-single-page-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Combine Single Page
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Combine multiple pages side by side
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Combine Pages
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Tools */}
        <div id="pdf-workflow-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                PDF Workflow
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Create automated PDF workflows</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Create Workflow
              </button>
            </div>
          </div>
        </div>

        <div id="form-creator-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Form Creator
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Create fillable PDF forms</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Create Form
              </button>
            </div>
          </div>
        </div>

        <div id="form-filler-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Filler</h2>
              <p className="text-gray-600 dark:text-gray-400">Fill PDF forms</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Fill Form
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {showCloudPicker && cloudProvider && (
        <CloudFilePicker
          provider={cloudProvider}
          accessToken={cloudAccessToken}
          onSelect={handleCloudFileSelect}
          onCancel={() => setShowCloudPicker(false)}
        />
      )}
    </div>
  );
};

export default App;
