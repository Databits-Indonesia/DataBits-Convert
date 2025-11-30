import React from "react";

interface DownloadSectionProps {
  onDownload: () => void;
  fileName: string;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({
  onDownload,
  fileName,
}) => {
  return (
    <div className="mt-12 animate-fade-in-up">
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Download File
        </h3>
        {fileName && (
            <p className="text-md text-primary font-medium mt-1 mb-1">{fileName}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          (Automated deleted after 60 minutes)
        </p>
        <button
          onClick={onDownload}
          className="mt-5 w-full max-w-xs inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="icon mr-2">download</span>
          Download
        </button>
      </div>
    </div>
  );
};

export default DownloadSection;
