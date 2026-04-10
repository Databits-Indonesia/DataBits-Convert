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
