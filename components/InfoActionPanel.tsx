import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface InfoActionPanelProps {
  containerId: string;
  title: string;
  description: string;
  label: string;
  selectId: string;
  options: SelectOption[];
  actionLabel: string;
  actionButtonId?: string;
}

const InfoActionPanel: React.FC<InfoActionPanelProps> = ({
  containerId,
  title,
  description,
  label,
  selectId,
  options,
  actionLabel,
  actionButtonId,
}) => {
  return (
    <div id={containerId} className="hidden max-w-6xl mx-auto mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
          <select
            id={selectId}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-center">
          <button
            id={actionButtonId}
            className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoActionPanel;
