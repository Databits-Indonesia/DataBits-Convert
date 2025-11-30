import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FileUploader from "./components/FileUploader";
import ExtensionSelector from "./components/ExtensionSelector";
import DownloadSection from "./components/DownloadSection";
import ActionButtons from "./components/ActionButtons";
import { InputOption, FileState } from "./types";

const INPUT_OPTIONS: InputOption[] = [
  { id: "gdrive", label: "Google Drive", icon: "add_to_drive" },
  { id: "onedrive", label: "OneDrive", icon: "cloud_upload" },
  { id: "dropbox", label: "Dropbox", icon: "inventory_2" },
  { id: "url", label: "URL", icon: "link" },
];

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileState | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [isConverted, setIsConverted] = useState<boolean>(true); // Default true to show the full UI as per mockup initially
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>("");

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

  const handleFileSelect = (file: FileState) => {
    setSelectedFile(file);
    setIsConverted(false);
    setIsConverting(false);
  };

  const startConversion = () => {
    setIsConverting(true);
  };

  const handleSourceSelect = (id: string) => {
    setSelectedSource(id);
    if (id !== 'url') {
      alert(`Importing from ${INPUT_OPTIONS.find(o => o.id === id)?.label}... (Demo)`);
    } else {
        setUrlInput("");
    }
  };

  const handleUrlImport = () => {
      if (!urlInput) return;
      
      let fileName = urlInput.split('/').pop();
      // Remove query parameters if present
      if (fileName && fileName.includes('?')) {
          fileName = fileName.split('?')[0];
      }

      if (!fileName || fileName.trim() === "") {
          fileName = "document_from_url.docx";
      }
      
      // Basic check to ensure it looks like a file, otherwise append docx for demo purposes
      if (!fileName.includes('.')) {
          fileName += ".docx";
      }

      handleFileSelect({
          file: null, // No real file object for URL
          name: fileName,
          size: 1024 * 1024 * 1.5 // Dummy size ~1.5MB
      });
      // Hide input after import
      setSelectedSource(""); 
  };

  const handleDownload = () => {
    if (!selectedFile) {
        alert("This is a demo. In a real app, the file would download now.");
        return;
    }
    alert(`Downloading ${selectedFile.name}...`);
  };

  const resetAll = () => {
    setSelectedFile(null);
    setIsConverted(true); 
    setIsConverting(false);
    setSelectedSource("");
    setUrlInput("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-700 dark:text-gray-300 antialiased">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
            Online Converter for your documents
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            More faster as you can see
          </p>

          <FileUploader
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
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
                        placeholder="https://example.com/file.docx"
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

          {isConverted && !isConverting && (
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
      </main>

      <Footer />
    </div>
  );
};

export default App;