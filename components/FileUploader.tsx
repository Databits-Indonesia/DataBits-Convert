import React, { useCallback, useState } from 'react';
import { FileState } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: FileState, allFiles?: File[]) => void;
  selectedFile: FileState | null;
  acceptType?: 'image' | 'pdf' | 'docx';
  allowMultiple?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  selectedFile,
  acceptType = 'image',
  allowMultiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const validateFile = (file: File) => {
    if (acceptType === 'pdf') {
      // Check for PDF file types
      const isValidPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isValidPdf) {
        setError('Invalid file type. Please upload a PDF file.');
        return false;
      }
    } else if (acceptType === 'docx') {
      // Check for DOCX file types
      const isValidDocx =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        /\.docx?$/i.test(file.name);
      if (!isValidDocx) {
        setError('Invalid file type. Please upload a Word file (.docx or .doc).');
        return false;
      }
    } else {
      // Check for image file types
      const validImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml',
      ];
      const isValidType =
        validImageTypes.includes(file.type) || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name);

      if (!isValidType) {
        setError(
          'Invalid file type. Please upload an image file (JPG, PNG, GIF, WebP, BMP, or SVG).'
        );
        return false;
      }
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
        const files = Array.from(e.dataTransfer.files) as File[];
        const validFiles = files.filter((f: File) => validateFile(f));

        if (validFiles.length > 0) {
          if (allowMultiple) {
            const newFiles = [...uploadedFiles, ...validFiles];
            setUploadedFiles(newFiles);
            onFileSelect(
              {
                file: validFiles[0],
                name: `${newFiles.length} file${newFiles.length > 1 ? 's' : ''} selected`,
                size: newFiles.reduce((sum, f) => sum + f.size, 0),
              },
              newFiles
            );
          } else {
            const file = validFiles[0];
            setUploadedFiles([file]);
            onFileSelect({
              file: file,
              name: file.name,
              size: file.size,
            });
          }
        }
      }
    },
    [onFileSelect, allowMultiple, uploadedFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files) as File[];
        const validFiles = files.filter((f: File) => validateFile(f));

        if (validFiles.length > 0) {
          if (allowMultiple) {
            const newFiles = [...uploadedFiles, ...validFiles];
            setUploadedFiles(newFiles);
            onFileSelect(
              {
                file: validFiles[0],
                name: `${newFiles.length} file${newFiles.length > 1 ? 's' : ''} selected`,
                size: newFiles.reduce((sum, f) => sum + f.size, 0),
              },
              newFiles
            );
          } else {
            const file = validFiles[0];
            setUploadedFiles([file]);
            onFileSelect({
              file: file,
              name: file.name,
              size: file.size,
            });
          }
        }
      }
      // Reset input value to allow re-selecting the same file
      e.target.value = '';
    },
    [onFileSelect, allowMultiple, uploadedFiles]
  );

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    if (newFiles.length > 0) {
      onFileSelect(
        {
          file: newFiles[0],
          name: `${newFiles.length} file${newFiles.length > 1 ? 's' : ''} selected`,
          size: newFiles.reduce((sum, f) => sum + f.size, 0),
        },
        newFiles
      );
    }
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const triggerFileInput = () => {
    document.getElementById('file-input-hidden')?.click();
  };

  return (
    <div className="mt-10 max-w-4xl mx-auto">
      {uploadedFiles.length === 0 ? (
        // Before upload state - show upload area
        <div
          className={`relative w-full border-2 border-dashed rounded-lg p-12 sm:p-16 flex flex-col items-center justify-center text-center transition-colors ${
            error
              ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
              : isDragging
                ? 'border-primary bg-blue-50 dark:bg-blue-50'
                : 'border-gray-300 dark:border-gray-300 bg-white dark:bg-white hover:border-gray-400 dark:hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span
            className={`icon text-6xl mb-4 transition-colors ${
              error
                ? 'text-red-500'
                : isDragging
                  ? 'text-primary dark:text-blue-500'
                  : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {error ? 'error_outline' : 'cloud_upload'}
          </span>

          {error ? (
            <>
              <p className="text-xl font-medium text-red-600 dark:text-red-400">Upload Failed</p>
              <p className="text-red-500 dark:text-red-300 mt-2">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Click to try again</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-700">
                Click to select, or drag and drop here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                You can select, drag or paste up to {allowMultiple ? '20' : '1'} file
                {allowMultiple ? 's' : ''}
              </p>
            </>
          )}

          <input
            id="file-input-hidden"
            aria-label="Upload file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            type="file"
            accept={
              acceptType === 'pdf'
                ? 'application/pdf,.pdf'
                : acceptType === 'docx'
                  ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc'
                  : 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg'
            }
            multiple={allowMultiple}
            onChange={handleFileInput}
          />
        </div>
      ) : (
        // After upload state - show file list
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={triggerFileInput}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              <span className="icon text-xl">add</span>
              Add More Files
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <span className="icon text-xl">delete_outline</span>
              Clear All
            </button>
          </div>

          <div className="bg-white dark:bg-white rounded-lg border border-gray-300 dark:border-gray-300">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-200 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="icon text-2xl text-red-500 flex-shrink-0">
                    {acceptType === 'pdf' ? 'picture_as_pdf' : 'image'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="ml-3 p-2 hover:bg-gray-200 dark:hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Remove file"
                >
                  <span className="icon text-xl text-gray-500 hover:text-red-500">close</span>
                </button>
              </div>
            ))}
          </div>

          {/* Hidden input for "Add More Files" button */}
          <input
            id="file-input-hidden"
            aria-label="Upload file"
            className="hidden"
            type="file"
            accept={
              acceptType === 'pdf'
                ? 'application/pdf,.pdf'
                : acceptType === 'docx'
                  ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.doc'
                  : 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg'
            }
            multiple={allowMultiple}
            onChange={handleFileInput}
          />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
