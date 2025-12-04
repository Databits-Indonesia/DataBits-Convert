import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FileUploader from "./components/FileUploader";
import ExtensionSelector from "./components/ExtensionSelector";
import DownloadSection from "./components/DownloadSection";
import ActionButtons from "./components/ActionButtons";
import ToolsGrid from "./components/ToolsGrid";
import CloudFilePicker from "./components/CloudFilePicker";
import { FileState } from "./types";
import { merge, setupMergeTool } from "./tools/merge";
import { split, setupSplitTool } from "./tools/split";
import { compress } from "./tools/compress";
import { applyAndSaveSignatures, setupSignTool } from "./tools/sign-pdf";
import { setupCropperTool } from "./tools/cropper";
import { extractPages } from "./tools/extract-pages";
import { organize } from "./tools/organize";
import { deletePages, setupDeletePagesTool } from "./tools/delete-pages";
import { imageToPdf } from "./tools/image-to-pdf";
import { editAttachments, setupEditAttachmentsTool } from "./tools/edit-attachments";
import { state, setFiles } from "./state";
import { initiateOAuth, downloadGoogleDriveFile, downloadOneDriveFile, downloadDropboxFile } from "./utils/oauth";
import { isOAuthConfigured } from "./config/oauth.config";
import { INPUT_OPTIONS, POPULAR_TOOLS, ERROR_MESSAGES } from "./config/constants";

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileState | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [isConverted, setIsConverted] = useState<boolean>(true); // Default true to show the full UI as per mockup initially
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>("");
  const [showCloudPicker, setShowCloudPicker] = useState(false);
  const [cloudProvider, setCloudProvider] = useState<'googleDrive' | 'oneDrive' | 'dropbox' | null>(null);
  const [cloudAccessToken, setCloudAccessToken] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showUploadForTool, setShowUploadForTool] = useState<boolean>(false);

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

  const handleFileSelect = async (file: FileState, allFiles?: File[]) => {
    setSelectedFile(file);
    setIsConverted(false);
    setIsConverting(false);
    
    // Update global state with selected file(s)
    if (allFiles && allFiles.length > 0) {
      // Multiple files (for merge tool)
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
      setUrlInput("");
    } else if (id === 'gdrive' || id === 'onedrive' || id === 'dropbox') {
      const providerMap = {
        'gdrive': 'googleDrive' as const,
        'onedrive': 'oneDrive' as const,
        'dropbox': 'dropbox' as const,
      };
      
      const provider = providerMap[id as keyof typeof providerMap];
      
      // Check if OAuth is configured
      if (!isOAuthConfigured(provider)) {
        alert(`${provider === 'googleDrive' ? 'Google Drive' : provider === 'oneDrive' ? 'OneDrive' : 'Dropbox'} OAuth is not configured.\n\nTo enable cloud storage import:\n1. Follow setup instructions in config/oauth.config.ts\n2. Add your OAuth credentials to .env file\n\nFalling back to local file picker...`);
        
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
        
        setSelectedSource("");
        return;
      }
      
      // Initiate OAuth flow
      try {
        const accessToken = await initiateOAuth(provider);
        setCloudAccessToken(accessToken);
        setCloudProvider(provider);
        setShowCloudPicker(true);
      } catch (error: any) {
        console.error('OAuth error:', error);
        alert(`Failed to connect to ${provider === 'googleDrive' ? 'Google Drive' : provider === 'oneDrive' ? 'OneDrive' : 'Dropbox'}: ${error.message}`);
      }
      
      setSelectedSource("");
    }
  };

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
    } catch (error: any) {
      console.error('Error downloading cloud file:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const handleToolSelect = async (id: string) => {
    // Image to PDF tool can be executed directly
    if (id === 'image-to-pdf') {
      try {
        await imageToPdf();
      } catch (error) {
        console.error(`Error executing tool ${id}:`, error);
        alert(`Error executing tool: ${error.message}`);
      }
      return;
    }
    
    // For PDF tools, redirect to upload section first
    setSelectedTool(id);
    setShowUploadForTool(true);
    setIsConverted(false);
    setSelectedFile(null);
    
    // Scroll to upload section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const executeToolAfterUpload = async (id: string) => {
    try {
      switch (id) {
        case 'merge':
          await setupMergeTool();
          break;
        case 'split':
          setupSplitTool();
          break;
        case 'compress':
          await compress();
          break;
        case 'sign':
          await setupSignTool();
          break;
        case 'crop':
          await setupCropperTool();
          break;
        case 'extract':
          await extractPages();
          break;
        case 'organize':
          await organize();
          break;
        case 'delete':
          setupDeletePagesTool();
          break;
        case 'edit':
          await setupEditAttachmentsTool();
          break;
        default:
          alert(`Tool "${POPULAR_TOOLS.find(t => t.id === id)?.name}" selected. (Demo functionality)`);
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
          size: blob.size
        });
        
        // Hide input after successful import
        setSelectedSource("");
        setUrlInput("");
      } catch (error) {
        console.error('Error importing from URL:', error);
        alert(`Failed to import image from URL: ${error.message}\n\nNote: The URL must be publicly accessible and point directly to an image file. CORS restrictions may prevent loading from some domains.`);
      }
  };

  const handleDownload = async () => {
    if (!selectedFile || !selectedFile.file) {
        alert("No file available to download.");
        return;
    }
    
    // Check if the file is an image (for image-to-PDF conversion)
    const isImage = selectedFile.file.type.startsWith('image/');
    
    if (!isImage) {
      alert('Download is only available for image to PDF conversion. PDF tools handle downloads automatically.');
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
    setSelectedSource("");
    setUrlInput("");
    setSelectedTool(null);
    setShowUploadForTool(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-700 dark:text-gray-300 antialiased">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            {showUploadForTool && selectedTool 
              ? `Upload PDF for ${POPULAR_TOOLS.find(t => t.id === selectedTool)?.name}`
              : 'Online Converter for your documents'}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {showUploadForTool && selectedTool
              ? `Please upload your PDF file(s) to use the ${POPULAR_TOOLS.find(t => t.id === selectedTool)?.name} tool`
              : 'More faster as you can see'}
          </p>

          <FileUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            acceptType={showUploadForTool && selectedTool ? 'pdf' : 'image'}
            allowMultiple={selectedTool === 'merge'}
          />

          {selectedFile && !isConverting && !isConverted && (
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

          <ExtensionSelector
            options={INPUT_OPTIONS}
            selectedOption={selectedSource}
            onSelect={handleSourceSelect}
          />

          {selectedSource === 'url' && (
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

          {isConverted && !isConverting && !selectedTool && (
            <>
              <DownloadSection 
                onDownload={handleDownload} 
                fileName={selectedFile ? `converted_${selectedFile.name}` : ''}
              />
              <ActionButtons 
                onConvertOther={resetAll}
                onConvertDiff={() => setIsConverted(false)}
              />
            </>
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
              <div id="page-merge-preview" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"></div>
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

        <ToolsGrid tools={POPULAR_TOOLS} onSelect={handleToolSelect} />
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