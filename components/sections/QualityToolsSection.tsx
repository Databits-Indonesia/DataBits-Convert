import React from 'react';
import SimpleToolPanel from '../SimpleToolPanel';
import { qualitySimplePanels } from '../../app/lib/tool-panels-config';

const QualityToolsSection: React.FC = () => {
  return (
    <>
      {qualitySimplePanels.map((panel) => (
        <SimpleToolPanel key={panel.containerId} {...panel} />
      ))}

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

          <div id="remove-blank-file-display-area" className="mb-4"></div>

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
    </>
  );
};

export default QualityToolsSection;
