import React from 'react';
import ExtractImagesToolPanel from '../ExtractImagesToolPanel';
import InfoActionPanel from '../InfoActionPanel';

interface AnalysisExtractionSectionProps {
  onExtractImages: () => void;
  onDownloadImagesZip: () => void;
}

const AnalysisExtractionSection: React.FC<AnalysisExtractionSectionProps> = ({
  onExtractImages,
  onDownloadImagesZip,
}) => {
  return (
    <>
      <ExtractImagesToolPanel onExtract={onExtractImages} onDownloadZip={onDownloadImagesZip} />

      <InfoActionPanel
        containerId="extract-tables-container"
        title="Extract Tables"
        description="Extract tables from PDF"
        label="Output Format"
        selectId="table-format"
        options={[
          { value: 'csv', label: 'CSV' },
          { value: 'excel', label: 'Excel' },
          { value: 'json', label: 'JSON' },
        ]}
        actionLabel="Extract Tables"
      />

      <InfoActionPanel
        containerId="ocr-container"
        title="OCR PDF"
        description="Extract text from scanned documents"
        label="Language"
        selectId="ocr-language"
        options={[
          { value: 'eng', label: 'English' },
          { value: 'spa', label: 'Spanish' },
          { value: 'fra', label: 'French' },
          { value: 'deu', label: 'German' },
          { value: 'chi_sim', label: 'Chinese (Simplified)' },
        ]}
        actionLabel="Perform OCR"
      />

      <div id="prepare-for-ai-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Prepare for AI
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Optimize PDF for AI processing</p>
          </div>
          <div className="flex justify-center">
            <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
              Prepare for AI
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalysisExtractionSection;
