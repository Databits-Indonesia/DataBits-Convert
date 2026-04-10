import React from 'react';

interface SimpleToolPanelProps {
  containerId: string;
  title: string;
  description: string;
  actionLabel: string;
}

const SimpleToolPanel: React.FC<SimpleToolPanelProps> = ({
  containerId,
  title,
  description,
  actionLabel,
}) => {
  return (
    <div id={containerId} className="hidden max-w-6xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex justify-center">
          <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleToolPanel;
