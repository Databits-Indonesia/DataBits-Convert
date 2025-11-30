import React from "react";

interface ActionButtonsProps {
    onConvertOther: () => void;
    onConvertDiff: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onConvertOther, onConvertDiff }) => {
  return (
    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
      <button 
        onClick={onConvertOther}
        className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
      >
        Convert Other files?
      </button>
      <button 
        onClick={onConvertDiff}
        className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
      >
        Convert different Extension?
      </button>
    </div>
  );
};

export default ActionButtons;
