import React from "react";
import { InputOption } from "../types";

interface ExtensionSelectorProps {
  options: InputOption[];
  selectedOption: string;
  onSelect: (id: string) => void;
}

const ExtensionSelector: React.FC<ExtensionSelectorProps> = ({
  options,
  selectedOption,
  onSelect,
}) => {
  return (
    <div className="mt-12 text-center">
      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
        Or import from:
      </h2>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
              selectedOption === opt.id
                ? "bg-primary text-white shadow-md hover:opacity-90 scale-105"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span className="icon text-lg leading-none">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExtensionSelector;