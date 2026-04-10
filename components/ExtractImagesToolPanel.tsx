import React from 'react';

interface ExtractImagesToolPanelProps {
  onExtract: () => void;
  onDownloadZip: () => void;
}

const ExtractImagesToolPanel: React.FC<ExtractImagesToolPanelProps> = ({
  onExtract,
  onDownloadZip,
}) => {
  return (
    <div id="extract-images-container" className="hidden max-w-6xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Extract Images</h2>
          <p className="text-gray-600 dark:text-gray-400">Extract all images from PDF</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Extraction Mode
          </label>
          <select
            id="image-format"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="dedupe">Deduplicate repeated images per page</option>
          </select>
        </div>
        <div className="flex justify-center">
          <button
            id="extract-images-btn"
            onClick={onExtract}
            className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
          >
            Extract Images
          </button>
        </div>

        <div id="extract-images-results" className="hidden mt-6">
          <div className="flex justify-center mb-4">
            <button
              id="download-zip-btn"
              onClick={onDownloadZip}
              className="hidden px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all"
            >
              Download Images as ZIP
            </button>
          </div>
          <div
            id="extract-images-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ExtractImagesToolPanel;
