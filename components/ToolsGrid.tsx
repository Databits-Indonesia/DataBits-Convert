import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tool, ToolCategory } from '../types';
import { TOOL_CATEGORIES } from '../config/constants';

interface ToolsGridProps {
  tools: Tool[];
  onSelect: (toolId: string) => void;
}

const ToolsGrid: React.FC<ToolsGridProps> = ({ tools, onSelect }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let result = tools;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((tool) => tool.category === selectedCategory);
    }

    // Filter by search query
    if (normalized) {
      result = result.filter((tool) =>
        [tool.name, tool.description, tool.id].some((value) =>
          value.toLowerCase().includes(normalized)
        )
      );
    }

    return result;
  }, [query, tools, selectedCategory]);

  // Group tools by category for display
  const groupedTools = useMemo(() => {
    if (query || selectedCategory !== 'all') {
      // If filtering, show flat list
      return null;
    }

    const groups: Record<string, Tool[]> = {};
    TOOL_CATEGORIES.forEach((category) => {
      groups[category.id] = tools.filter((tool) => tool.category === category.id);
    });
    return groups;
  }, [tools, query, selectedCategory]);

  return (
    <div className="mt-20 w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get Started with Tools</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Find the right tool and jump straight to upload or editing.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-full max-w-xl">
          <label className="sr-only" htmlFor="tool-search">
            Search tools
          </label>
          <div className="relative">
            <span className="icon absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              ref={searchInputRef}
              id="tool-search"
              type="search"
              placeholder="Search tools... (Cmd+K / Ctrl+K)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-12 py-3 text-sm text-gray-800 dark:text-gray-200 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <span className="icon">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full max-w-4xl overflow-x-auto">
          <div className="flex gap-2 min-w-max justify-center px-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Tools
            </button>
            {TOOL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="icon text-lg">{category.icon}</span>
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500">
          Showing {filteredTools.length} of {tools.length} tools
        </p>
      </div>

      {/* Tools Display */}
      {groupedTools ? (
        // Grouped by category
        <div className="space-y-12">
          {TOOL_CATEGORIES.map((category) => {
            const categoryTools = groupedTools[category.id];
            if (!categoryTools || categoryTools.length === 0) return null;

            return (
              <div key={category.id} className="scroll-mt-20" id={`category-${category.id}`}>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="icon text-2xl text-primary">{category.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-9">
                    {category.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {categoryTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => onSelect(tool.id)}
                      className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary dark:hover:border-primary transition-all duration-200 group text-center"
                    >
                      <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-700 text-primary dark:text-white mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="icon text-3xl">{tool.icon}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {tool.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list (when searching or filtering)
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelect(tool.id)}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary dark:hover:border-primary transition-all duration-200 group text-center"
              >
                <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-700 text-primary dark:text-white mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="icon text-3xl">{tool.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {tool.description}
                </p>
              </button>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No tools match your search. Try a different keyword.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolsGrid;
