import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import FileUploader from './components/FileUploader';
import ExtensionSelector from './components/ExtensionSelector';
import CloudFilePicker from './components/CloudFilePicker';
import { FileState } from './types';
import { merge, setupMergeTool } from './tools/merge';
import { split, setupSplitTool } from './tools/split';
import { compress, setupCompressTool } from './tools/compress';
import { applyAndSaveSignatures, setupSignTool } from './tools/sign-pdf';
import { setupCropperTool } from './tools/cropper';
import { extractPages, setupExtractPagesTool } from './tools/extract-pages';
import { organize, setupOrganizeTool } from './tools/organize';
import { deletePages, setupDeletePagesTool } from './tools/delete-pages';
import { imageToPdf } from './tools/image-to-pdf';
import { setupEditPDFTool } from './tools/edit-pdf';
import { pdfToWord, setupPdfToWordTool } from './tools/pdf-to-word';
import { wordToPdf, setupWordToPdfTool } from './tools/word-to-pdf';
import { state, setFiles } from './state';
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
    'page-numbers': 'page-numbers-tool-container',
    'page-dimensions': 'page-dimensions-tool-container',
    'n-up': 'n-up-tool-container',

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
        input.accept = 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg';

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

  // Generic setup function for tools
  const setupGenericTool = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.classList.remove('hidden');
    }
  };

  // PDF Manipulation Setup Functions
  const setupRotateTool = () => setupGenericTool('rotate-tool-container');
  const setupReverseTool = () => setupGenericTool('reverse-tool-container');
  const setupDuplicateTool = () => setupGenericTool('duplicate-tool-container');
  const setupDivideTool = () => setupGenericTool('divide-tool-container');
  const setupRemoveBlankTool = () => setupGenericTool('remove-blank-tool-container');
  const setupPageNumbersTool = () => setupGenericTool('page-numbers-tool-container');
  const setupPageDimensionsTool = () => setupGenericTool('page-dimensions-tool-container');
  const setupNUpTool = () => setupGenericTool('n-up-tool-container');

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
  const setupPowerpointToPdfTool = () => setupGenericTool('powerpoint-to-pdf-container');
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
  const setupAddBlankPageTool = () => setupGenericTool('add-blank-page-container');
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
  const setupEncryptTool = () => setupGenericTool('encrypt-container');
  const setupDecryptTool = () => setupGenericTool('decrypt-container');
  const setupChangePermissionsTool = () => setupGenericTool('change-permissions-container');
  const setupRemoveMetadataTool = () => setupGenericTool('remove-metadata-container');
  const setupEditMetadataTool = () => setupGenericTool('edit-metadata-container');
  const setupViewMetadataTool = () => setupGenericTool('view-metadata-container');
  const setupRemoveRestrictionsTool = () => setupGenericTool('remove-restrictions-container');
  const setupRemoveAnnotationsTool = () => setupGenericTool('remove-annotations-container');

  // PDF Analysis & Extraction Setup Functions
  const setupExtractImagesTool = () => setupGenericTool('extract-images-container');
  const setupExtractTablesTool = () => setupGenericTool('extract-tables-container');
  const setupOcrTool = () => setupGenericTool('ocr-container');
  const setupPrepareForAiTool = () => setupGenericTool('prepare-for-ai-container');

  // PDF Quality & Repair Setup Functions
  const setupDeskewTool = () => setupGenericTool('deskew-container');
  const setupRemoveBlankPagesTool = () => setupGenericTool('remove-blank-pages-container');
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
        case 'pdf-to-word':
          await setupPdfToWordTool();
          break;
        case 'word-to-pdf':
          await setupWordToPdfTool();
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
        default:
          // For all other tools, use a generic approach
          const toolContainerId = TOOL_CONTAINER_MAP[id];
          if (toolContainerId) {
            const container = document.getElementById(toolContainerId);
            if (container) {
              container.classList.remove('hidden');
            }
          }

          // Show demo alert for unimplemented tools
          const toolName = POPULAR_TOOLS.find((t) => t.id === id)?.name || id;
          alert(`Tool "${toolName}" selected. (Core functionality ready, advanced UI coming soon)`);
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
          case 'word-to-pdf':
            await setupWordToPdfTool();
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
          case 'remove-blank':
            setupRemoveBlankTool();
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

    try {
      // Try to fetch the image from the URL
      const response = await fetch(urlInput);

      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }

      const blob = await response.blob();

      // Check if it's an image
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image file');
      }

      // Get filename from URL
      let fileName = urlInput.split('/').pop() || 'image_from_url.jpg';
      if (fileName.includes('?')) {
        fileName = fileName.split('?')[0];
      }
      if (!fileName.includes('.')) {
        // Determine extension from mime type
        const ext = blob.type.split('/')[1] || 'jpg';
        fileName += `.${ext}`;
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
        `Failed to import image from URL: ${error.message}\n\nNote: The URL must be publicly accessible and point directly to an image file. CORS restrictions may prevent loading from some domains.`
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
              acceptType={
                selectedTool === 'image-to-pdf'
                  ? 'image'
                  : selectedTool === 'word-to-pdf'
                    ? 'docx'
                    : 'pdf'
              }
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
                Convert your PDF document to an editable Word file (DOCX)
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content will be extracted from your PDF and converted to an editable Word
                    document. The original formatting and layout may vary based on the PDF
                    structure.
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

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Text-based PDFs work best for conversion</li>
                    <li>Scanned PDFs (images) may require OCR for accurate text extraction</li>
                    <li>Complex layouts may need manual adjustment in Word</li>
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
                onClick={() => wordToPdf()}
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rotation Angle
              </label>
              <select
                id="rotate-angle"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="90">90° Clockwise</option>
                <option value="180">180°</option>
                <option value="270">270° Clockwise (90° Counter-clockwise)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Rotate PDF
              </button>
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
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Reverse Pages
              </button>
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
                Duplicate specific pages in your PDF
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pages to Duplicate (e.g., 1,3,5)
              </label>
              <input
                type="text"
                id="pages-to-duplicate"
                placeholder="1,3,5"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Duplicate Pages
              </button>
            </div>
          </div>
        </div>

        {/* Divide Tool UI */}
        <div id="divide-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Divide PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Divide PDF into equal parts</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Parts
              </label>
              <input
                type="number"
                id="divide-parts"
                min="2"
                defaultValue="2"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Divide PDF
              </button>
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
        <div id="page-numbers-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Page Numbers
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Add page numbers to your PDF</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <select
                  id="page-number-position"
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
                  Start Number
                </label>
                <input
                  type="number"
                  id="page-number-start"
                  min="1"
                  defaultValue="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Add Page Numbers
              </button>
            </div>
          </div>
        </div>

        {/* Page Dimensions Tool UI */}
        <div id="page-dimensions-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Fix Page Size
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Standardize page dimensions in your PDF
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Size
              </label>
              <select
                id="page-size"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
                <option value="A3">A3</option>
                <option value="A5">A5</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Fix Page Size
              </button>
            </div>
          </div>
        </div>

        {/* N-Up Tool UI */}
        <div id="n-up-tool-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">N-Up Layout</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Combine multiple pages onto one sheet
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pages Per Sheet
              </label>
              <select
                id="n-up-layout"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="2">2 Pages</option>
                <option value="4">4 Pages</option>
                <option value="6">6 Pages</option>
                <option value="9">9 Pages</option>
                <option value="16">16 Pages</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Apply N-Up Layout
              </button>
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
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="png-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PNG to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PNG images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="bmp-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">BMP to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert BMP images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="webp-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WebP to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert WebP images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="heic-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">HEIC to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert HEIC images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="svg-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">SVG to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert SVG images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="tiff-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">TIFF to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert TIFF images to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Convert email files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="txt-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Text to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert text files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="csv-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CSV to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert CSV files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PDF
              </button>
            </div>
          </div>
        </div>

        <div id="json-to-pdf-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">JSON to PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert JSON files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Convert Markdown files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Convert Excel files to PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to BMP</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to BMP images</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to BMP
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-webp-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to WebP</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to WebP images</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to WebP
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-svg-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to SVG</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to SVG images</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to SVG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-tiff-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to TIFF</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to TIFF images</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to TIFF
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-text-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to Text</h2>
              <p className="text-gray-600 dark:text-gray-400">Extract text from PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Extract Text
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-excel-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                PDF to Excel
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF to Excel spreadsheet</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to Excel
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-csv-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to CSV</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF tables to CSV</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to CSV
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-json-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to JSON</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF data to JSON</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to JSON
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-markdown-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                PDF to Markdown
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF to Markdown format</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to Markdown
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-zip-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to ZIP</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF contents to ZIP archive
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Create ZIP
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
              <p className="text-gray-600 dark:text-gray-400">Add digital signature to PDF</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Certificate File (.p12/.pfx)
              </label>
              <input
                type="file"
                accept=".p12,.pfx"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Sign PDF
              </button>
            </div>
          </div>
        </div>

        <div id="validate-signature-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Validate Signature
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Verify digital signatures in PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Validate Signatures
              </button>
            </div>
          </div>
        </div>

        <div id="add-stamps-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add Stamps</h2>
              <p className="text-gray-600 dark:text-gray-400">Add stamps to PDF pages</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stamp Type
              </label>
              <select
                id="stamp-type"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="approved">Approved</option>
                <option value="confidential">Confidential</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Add Stamp
              </button>
            </div>
          </div>
        </div>

        <div id="add-watermark-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Add Watermark
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Add watermark to PDF pages</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watermark Text
                </label>
                <input
                  type="text"
                  id="watermark-text"
                  placeholder="CONFIDENTIAL"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opacity
                </label>
                <input
                  type="range"
                  id="watermark-opacity"
                  min="0"
                  max="100"
                  defaultValue="30"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Attach files to PDF document</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Files to Attach
              </label>
              <input
                type="file"
                multiple
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Extract attached files from PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Manage PDF attachments</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Manage Attachments
              </button>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <select
                  id="blank-page-position"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="beginning">Beginning</option>
                  <option value="end">End</option>
                  <option value="after">After Page</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Pages
                </label>
                <input
                  type="number"
                  id="blank-page-count"
                  min="1"
                  defaultValue="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Add Blank Pages
              </button>
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
                Add headers and footers to PDF pages
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Header Text
                </label>
                <input
                  type="text"
                  id="header-text"
                  placeholder="Document Title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Footer Text
                </label>
                <input
                  type="text"
                  id="footer-text"
                  placeholder="Page {page}"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                id="background-color"
                defaultValue="#ffffff"
                className="w-full h-12 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Apply Background Color
              </button>
            </div>
          </div>
        </div>

        <div id="text-color-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Text Color</h2>
              <p className="text-gray-600 dark:text-gray-400">Change PDF text color</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <input
                type="color"
                id="text-color"
                defaultValue="#000000"
                className="w-full h-12 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Invert all colors in PDF</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
                Fine-tune brightness, contrast, and saturation
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brightness
                </label>
                <input
                  type="range"
                  id="brightness"
                  min="-100"
                  max="100"
                  defaultValue="0"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contrast
                </label>
                <input
                  type="range"
                  id="contrast"
                  min="-100"
                  max="100"
                  defaultValue="0"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Saturation
                </label>
                <input
                  type="range"
                  id="saturation"
                  min="-100"
                  max="100"
                  defaultValue="0"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to Grayscale
              </button>
            </div>
          </div>
        </div>

        <div id="posterize-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Posterize</h2>
              <p className="text-gray-600 dark:text-gray-400">Apply posterize effect to PDF</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Levels
              </label>
              <input
                type="number"
                id="posterize-levels"
                min="2"
                max="256"
                defaultValue="8"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Apply Posterize
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rotation Angle (degrees)
              </label>
              <input
                type="number"
                id="custom-angle"
                min="-360"
                max="360"
                defaultValue="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Rotate
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                DPI (Resolution)
              </label>
              <select
                id="rasterize-dpi"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="72">72 DPI (Screen)</option>
                <option value="150">150 DPI (Standard)</option>
                <option value="300">300 DPI (Print)</option>
                <option value="600">600 DPI (High Quality)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Rasterize
              </button>
            </div>
          </div>
        </div>

        <div id="flatten-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Flatten PDF</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Flatten form fields and annotations
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Optimize PDF for fast web viewing</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Remove hidden data and scripts</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
                Protect PDF with password encryption
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Password (Open)
                </label>
                <input
                  type="password"
                  id="user-password"
                  placeholder="Password to open"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner Password (Permissions)
                </label>
                <input
                  type="password"
                  id="owner-password"
                  placeholder="Password for editing"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Modify PDF security permissions</p>
            </div>
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-5 h-5 text-primary focus:ring-primary" />
                <span className="text-gray-700 dark:text-gray-300">Allow Printing</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-5 h-5 text-primary focus:ring-primary" />
                <span className="text-gray-700 dark:text-gray-300">Allow Copy</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-5 h-5 text-primary focus:ring-primary" />
                <span className="text-gray-700 dark:text-gray-300">Allow Modifications</span>
              </label>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
                Remove metadata and hidden information
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">Edit PDF document properties</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="meta-title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  id="meta-author"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="meta-subject"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  id="meta-keywords"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
              <p className="text-gray-600 dark:text-gray-400">View PDF document properties</p>
            </div>
            <div id="metadata-display" className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-gray-500">Upload a PDF to view metadata</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
                Remove editing and printing restrictions
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
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
                Remove all comments and annotations
              </p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Remove Annotations
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
              <p className="text-gray-600 dark:text-gray-400">Automatically remove blank pages</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Remove Blank Pages
              </button>
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
