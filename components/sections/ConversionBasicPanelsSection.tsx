import React from 'react';
import {
  conversionBasicPanels,
  type ConversionBasicActionKey,
} from '../../app/lib/tool-panels-config';

interface ConversionBasicPanelsSectionProps {
  actions: Partial<Record<ConversionBasicActionKey, () => void>>;
}

const ConversionBasicPanelsSection: React.FC<ConversionBasicPanelsSectionProps> = ({ actions }) => {
  return (
    <>
      {conversionBasicPanels.map((panel) => (
        <div
          key={panel.containerId}
          id={panel.containerId}
          className="hidden max-w-6xl mx-auto mt-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {panel.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{panel.description}</p>
            </div>
            {panel.containerId === 'excel-to-csv-container' && (
              <div className="mb-6 max-w-md mx-auto text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="excel-to-csv-double-quote"
                    defaultChecked={true}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Double Quote Wrap
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                  Wrap all fields in double quotes by default for consistent CSV parsing.
                </p>
              </div>
            )}
            <div className="flex justify-center">
              <button
                id={panel.buttonId}
                onClick={
                  panel.actionKey && actions[panel.actionKey]
                    ? () => actions[panel.actionKey]?.()
                    : undefined
                }
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
              >
                {panel.actionLabel}
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ConversionBasicPanelsSection;
