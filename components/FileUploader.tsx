import React, { useCallback, useState } from "react";
import { FileState } from "../types";

interface FileUploaderProps {
  onFileSelect: (file: FileState) => void;
  selectedFile: FileState | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  selectedFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    // Check for .docx extension
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError("Invalid file type. Please upload a .docx file.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          onFileSelect({
            file: file,
            name: file.name,
            size: file.size,
          });
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (validateFile(file)) {
          onFileSelect({
            file: file,
            name: file.name,
            size: file.size,
          });
        }
      }
    },
    [onFileSelect]
  );

  return (
    <div className="mt-10">
      <div
        className={`relative w-full border-2 border-dashed rounded-lg p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-colors ${
          error
            ? "border-red-500 bg-red-50 dark:bg-red-900/10"
            : isDragging
            ? "border-primary bg-blue-50 dark:bg-gray-800 dark:border-blue-500"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span
          className={`icon text-5xl mb-4 transition-colors ${
            error
              ? "text-red-500"
              : isDragging
              ? "text-primary dark:text-blue-500"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {error
            ? "error_outline"
            : selectedFile
            ? "check_circle"
            : "upload_file"}
        </span>

        {error ? (
          <>
            <p className="text-xl font-medium text-red-600 dark:text-red-400">
              Upload Failed
            </p>
            <p className="text-red-500 dark:text-red-300 mt-2">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Click to try again
            </p>
          </>
        ) : selectedFile ? (
          <>
            <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
              {selectedFile.name}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <p className="text-sm text-primary mt-2">Click to replace</p>
          </>
        ) : (
          <>
            <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
              Drag your .docx file here!
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              or click to browse
            </p>
          </>
        )}

        <input
          aria-label="Upload file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInput}
        />
      </div>
    </div>
  );
};

export default FileUploader;