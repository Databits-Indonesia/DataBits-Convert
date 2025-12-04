import React from "react";
import { Tool } from "../types";

interface ToolsGridProps {
  tools: Tool[];
  onSelect: (toolId: string) => void;
}

const ToolsGrid: React.FC<ToolsGridProps> = ({ tools, onSelect }) => {
  return (
    <div className="mt-20 w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular PDF Tools</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Everything you need to manage your PDF files</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary dark:hover:border-primary transition-all duration-200 group text-center"
          >
            <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-700 text-primary dark:text-white mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="icon text-3xl">{tool.icon}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{tool.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{tool.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToolsGrid;