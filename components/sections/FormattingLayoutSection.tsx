import React from 'react';
import SimpleToolPanel from '../SimpleToolPanel';
import SelectOptionActionPanel from '../SelectOptionActionPanel';
import SecondaryFileActionPanel from '../SecondaryFileActionPanel';
// import TableOfContentsToolPanel from '../TableOfContentsToolPanel';
import { layoutSimplePanels } from '../../app/lib/tool-panels-config';

const FormattingLayoutSection: React.FC = () => {
  return (
    <>
      {layoutSimplePanels.map((panel) => (
        <SimpleToolPanel key={panel.containerId} {...panel} />
      ))}

      {/* <TableOfContentsToolPanel containerId="table-of-contents-container" /> */}

      <div id="bates-numbering-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Bates Numbering
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add Bates numbers for legal documents
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prefix
              </label>
              <input
                type="text"
                id="bates-prefix"
                placeholder="DOC-"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Number
              </label>
              <input
                type="number"
                id="bates-start"
                min="1"
                defaultValue="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
              Add Bates Numbers
            </button>
          </div>
        </div>
      </div>

      <SelectOptionActionPanel
        containerId="pdf-to-pdfa-container"
        title="Convert to PDF/A"
        description="Convert to archival PDF/A format"
        selectLabel="PDF/A Version"
        selectId="pdfa-version"
        options={[
          { value: '1b', label: 'PDF/A-1b' },
          { value: '2b', label: 'PDF/A-2b' },
          { value: '3b', label: 'PDF/A-3b' },
        ]}
        actionLabel="Convert to PDF/A"
      />

      <SecondaryFileActionPanel
        containerId="compare-pdfs-container"
        title="Compare PDFs"
        description="Compare two PDF documents"
        secondaryFileLabel="Second PDF File"
        actionLabel="Compare PDFs"
      />

      <SecondaryFileActionPanel
        containerId="alternate-merge-container"
        title="Alternate Merge"
        description="Merge PDFs by alternating pages"
        secondaryFileLabel="Second PDF File"
        actionLabel="Alternate Merge"
      />

      <div id="combine-single-page-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Combine Single Page
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Combine multiple pages side by side</p>
          </div>
          <div className="flex justify-center">
            <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
              Combine Pages
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FormattingLayoutSection;
