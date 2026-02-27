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
    merge: 'merge-options',
    split: 'split-tool-container',
    compress: 'compress-tool-container',
    'pdf-to-word': 'pdf-to-word-container',
    delete: 'delete-pages-tool-container',
    extract: 'extract-pages-tool-container',
    sign: 'signature-editor',
    crop: 'cropper-tool-container',
    'image-to-pdf': 'image-to-pdf-container',
    organize: 'organize-tool-container',
    edit: 'edit-pdf-options',
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
    // Clean up previous tool UI
    const toolContainers = [
      'merge-options',
      'split-tool-container',
      'compress-tool-container',
      'pdf-to-word-container',
      'delete-pages-tool-container',
      'extract-pages-tool-container',
      'signature-editor',
      'cropper-tool-container',
      'image-to-pdf-container',
      'organize-tool-container',
      'edit-pdf-options',
    ];

    toolContainers.forEach((containerId) => {
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

  const executeToolAfterUpload = async (id: string) => {
    try {
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
          // Show the image to PDF container
          document.getElementById('image-to-pdf-container')?.classList.remove('hidden');
          break;
        default:
          alert(
            `Tool "${POPULAR_TOOLS.find((t) => t.id === id)?.name}" selected. (Demo functionality)`
          );
      }

      const toolContainerId = TOOL_CONTAINER_MAP[id];
      if (toolContainerId) {
        requestAnimationFrame(() => scrollToElement(toolContainerId));
      }
    } catch (error) {
      console.error(`Error executing tool ${id}:`, error);
      alert(`Error executing tool: ${error.message}`);
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
              acceptType={selectedTool !== 'image-to-pdf' ? 'pdf' : 'image'}
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
