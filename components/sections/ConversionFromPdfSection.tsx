import React from 'react';

interface ConversionFromPdfSectionProps {
  files: File[];
  onPdfToBmp: () => void;
  onPdfToWebp: () => void;
  onPdfToSvg: () => void;
  onPdfToTiff: () => void;
  onPdfToText: () => void;
  onPdfToExcel: () => void;
  onPdfToCsv: () => void;
  onPdfToJson: () => void;
  onPdfToMarkdown: () => void;
  onPdfToZip: () => void;
}

const ConversionFromPdfSection: React.FC<ConversionFromPdfSectionProps> = ({
  files,
  onPdfToBmp,
  onPdfToWebp,
  onPdfToSvg,
  onPdfToTiff,
  onPdfToText,
  onPdfToExcel,
  onPdfToCsv,
  onPdfToJson,
  onPdfToMarkdown,
  onPdfToZip,
}) => {
  return (
    <>
        {/* PDF to Other Formats */}
        <div id="pdf-to-jpg-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to JPG</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to JPG images</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality
              </label>
              <select
                id="jpg-quality"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low (Smaller file)</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="maximum">Maximum (Larger file)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to JPG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-png-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">PDF to PNG</h2>
              <p className="text-gray-600 dark:text-gray-400">Convert PDF pages to PNG images</p>
            </div>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105">
                Convert to PNG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-bmp-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to BMP
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to BMP (Bitmap) images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate BMP image. BMP format is
                    uncompressed and provides maximum compatibility. All images will be packaged in
                    a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-bmp-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>BMP format is uncompressed and produces large files</li>
                    <li>Provides maximum compatibility with older applications</li>
                    <li>150 DPI is suitable for most web and screen uses</li>
                    <li>Use 300 DPI or higher for printing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-bmp-process-btn"
                onClick={onPdfToBmp}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to BMP
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-webp-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to WebP
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to modern WebP images with efficient compression
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate WebP image. WebP format
                    provides superior compression with excellent quality. All images will be
                    packaged in a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-webp-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality: <span id="pdf-to-webp-quality-value">85%</span>
                </label>
                <input
                  type="range"
                  id="pdf-to-webp-quality"
                  min="0.1"
                  max="1"
                  step="0.05"
                  defaultValue="0.85"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  onChange={(e) => {
                    const value = document.getElementById('pdf-to-webp-quality-value');
                    if (value)
                      value.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Lower size</span>
                  <span>Higher quality</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>WebP provides better compression than PNG and JPEG</li>
                    <li>Ideal for web use with modern browser support</li>
                    <li>85% quality offers excellent balance of size and quality</li>
                    <li>Higher DPI values result in larger file sizes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-webp-process-btn"
                onClick={onPdfToWebp}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to WebP
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-svg-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to SVG
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to scalable SVG (Scalable Vector Graphics) images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate SVG image. SVG images are
                    scalable and can be resized without quality loss. All images will be packaged in
                    a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-svg-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>SVG images are infinitely scalable without quality loss</li>
                    <li>Perfect for logos, icons, and graphics</li>
                    <li>Can be edited with vector graphics software</li>
                    <li>Note: This creates raster-embedded SVGs from PDF pages</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-svg-process-btn"
                onClick={onPdfToSvg}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to SVG
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-tiff-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to TIFF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Convert your PDF pages to TIFF (Tagged Image File Format) images
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Each page of your PDF will be converted to a separate TIFF image. TIFF is widely
                    used in publishing and professional photography. All images will be packaged in
                    a ZIP file for easy download.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (DPI)
                </label>
                <select
                  id="pdf-to-tiff-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compression
                </label>
                <select
                  id="pdf-to-tiff-compression"
                  defaultValue="none"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="none">None (Uncompressed)</option>
                  <option value="lzw">LZW Compression</option>
                  <option value="packbits">PackBits Compression</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>TIFF is ideal for archiving and professional printing</li>
                    <li>Supports lossless compression and high bit depth</li>
                    <li>300 DPI or higher recommended for print quality</li>
                    <li>Uncompressed TIFF produces larger files but maximum quality</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-tiff-process-btn"
                onClick={onPdfToTiff}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to TIFF
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-text-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract Text from PDF
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract all text content from your PDF document
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Extraction Info:</p>
                  <p>
                    Text will be extracted from all pages of your PDF and saved as a plain text file
                    (.txt). The layout and formatting may not be preserved, but all readable text
                    content will be extracted.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready for text extraction`
                    : 'PDF file uploaded above will have text extracted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-text-page-numbers"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-text-page-numbers"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Include page numbers in output
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Separator
                </label>
                <select
                  id="pdf-to-text-separator"
                  defaultValue="double-line"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="single-line">Single Line Break</option>
                  <option value="double-line">Double Line Break</option>
                  <option value="page-break">Page Break with Divider</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Best for PDFs containing selectable text</li>
                    <li>Images and complex layouts won't be preserved</li>
                    <li>Scanned PDFs require OCR (not supported in this tool)</li>
                    <li>Output is plain text format (.txt)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Extract Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-text-process-btn"
                onClick={onPdfToText}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Extract Text
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-excel-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to Excel
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content to Excel spreadsheet format
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content from your PDF will be extracted and converted to an Excel
                    spreadsheet (.xlsx). This tool extracts text content; for advanced table
                    detection, specialized software is recommended.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-excel-one-sheet"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-excel-one-sheet"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Create one sheet per page
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Best for PDFs with structured text content</li>
                    <li>Complex tables may not preserve exact layout</li>
                    <li>Creates Excel .xlsx format compatible with Microsoft Excel</li>
                    <li>For precise table extraction, specialized tools may work better</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-excel-process-btn"
                onClick={onPdfToExcel}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to Excel
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-csv-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to CSV
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content to CSV (Comma-Separated Values) format
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content from your PDF will be extracted and converted to CSV format. CSV
                    files can be opened in Excel, Google Sheets, and other spreadsheet applications.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-csv-page-numbers"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-csv-page-numbers"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Include page numbers column
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Separator
                </label>
                <select
                  id="pdf-to-csv-separator"
                  defaultValue="comma"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="comma">Comma (,)</option>
                  <option value="semicolon">Semicolon (;)</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>CSV format is ideal for data exchange between applications</li>
                    <li>Use semicolon separator for European Excel versions</li>
                    <li>Complex tables may not preserve exact structure</li>
                    <li>Output can be opened in Excel, Google Sheets, or any text editor</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-csv-process-btn"
                onClick={onPdfToCsv}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to CSV
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-json-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to JSON
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content as structured JSON data
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content and metadata from your PDF will be extracted and converted to JSON
                    format. JSON is perfect for data processing, APIs, and programmatic access.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <select
                  id="pdf-to-json-format"
                  defaultValue="structured"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="simple">Simple (text only)</option>
                  <option value="structured">Structured (with coordinates)</option>
                  <option value="full">Full (complete text content)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-json-metadata"
                  defaultChecked={true}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-json-metadata"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Include PDF metadata
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-json-indent"
                  defaultChecked={true}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-json-indent"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Pretty print (indented JSON)
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>JSON format is ideal for APIs and data processing</li>
                    <li>Structured format includes text coordinates and fonts</li>
                    <li>Simple format is best for basic text extraction</li>
                    <li>Pretty print makes JSON human-readable</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-json-process-btn"
                onClick={onPdfToJson}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to JSON
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-markdown-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Convert PDF to Markdown
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF content to Markdown format for documentation and notes
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Conversion Info:</p>
                  <p>
                    Text content from your PDF will be extracted and converted to Markdown format
                    (.md). Perfect for documentation, note-taking, and content management systems.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to convert`
                    : 'PDF file uploaded above will be converted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-markdown-title"
                  defaultChecked={true}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-markdown-title"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Include document title (# Heading 1)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pdf-to-markdown-page-numbers"
                  defaultChecked={false}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="pdf-to-markdown-page-numbers"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Include page number headings (## Page N)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heading Detection
                </label>
                <select
                  id="pdf-to-markdown-headings"
                  defaultValue="auto"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="auto">Auto-detect (by font size)</option>
                  <option value="none">No heading detection</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Markdown is great for GitHub, GitLab, and documentation sites</li>
                    <li>Auto-detect headings based on font size differences</li>
                    <li>Use page separators (---) when not using page numbers</li>
                    <li>Compatible with all Markdown editors and viewers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-markdown-process-btn"
                onClick={onPdfToMarkdown}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Convert to Markdown
              </button>
            </div>
          </div>
        </div>

        <div id="pdf-to-zip-container" className="hidden max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Extract PDF to ZIP Archive
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Extract PDF pages as images and/or text files packaged in a ZIP archive
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-3">ℹ️</span>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Extraction Info:</p>
                  <p>
                    Each page of your PDF will be extracted as separate files (images and/or text)
                    and packaged into a ZIP archive for easy download and organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {files.length > 0
                    ? `${files[0].name} ready to extract`
                    : 'PDF file uploaded above will be extracted'}
                </p>
                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span className="truncate">{files[0].name}</span>
                      <span className="ml-4 text-gray-500 text-xs">
                        {(files[0].size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extraction Type
                </label>
                <select
                  id="pdf-to-zip-type"
                  defaultValue="images"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="images">Images only</option>
                  <option value="text">Text only</option>
                  <option value="both">Both images and text</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Format
                </label>
                <select
                  id="pdf-to-zip-format"
                  defaultValue="png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Resolution (DPI)
                </label>
                <select
                  id="pdf-to-zip-dpi"
                  defaultValue="150"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Print Quality)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-yellow-600 dark:text-yellow-400 mr-3">💡</span>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Extract images for presentations or web use</li>
                    <li>Extract text for editing and reuse</li>
                    <li>Extract both for complete page backups</li>
                    <li>Higher DPI creates larger but better quality images</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Extract Button */}
            <div className="flex justify-center">
              <button
                id="pdf-to-zip-process-btn"
                onClick={onPdfToZip}
                className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0}
              >
                Extract to ZIP
              </button>
            </div>
          </div>
        </div>


    </>
  );
};

export default ConversionFromPdfSection;
