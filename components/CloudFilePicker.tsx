/**
 * Cloud File Picker Component
 * Displays files from cloud storage and allows selection
 */

import React, { useState, useEffect } from 'react';

interface CloudFile {
  id: string;
  name: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  path?: string;
}

interface CloudFilePickerProps {
  provider: 'googleDrive' | 'oneDrive' | 'dropbox';
  accessToken: string;
  onSelect: (file: CloudFile) => void;
  onCancel: () => void;
}

const CloudFilePicker: React.FC<CloudFilePickerProps> = ({
  provider,
  accessToken,
  onSelect,
  onCancel,
}) => {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [provider, accessToken]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { 
        fetchGoogleDriveFiles, 
        fetchOneDriveFiles, 
        fetchDropboxFiles 
      } = await import('../utils/oauth');

      let cloudFiles: CloudFile[] = [];

      if (provider === 'googleDrive') {
        const rawFiles = await fetchGoogleDriveFiles(accessToken);
        cloudFiles = rawFiles.map(f => ({
          id: f.id,
          name: f.name,
          thumbnailUrl: f.thumbnailLink,
          downloadUrl: f.webContentLink,
        }));
      } else if (provider === 'oneDrive') {
        const rawFiles = await fetchOneDriveFiles(accessToken);
        cloudFiles = rawFiles.map(f => ({
          id: f.id,
          name: f.name,
          thumbnailUrl: f.thumbnails?.[0]?.medium?.url,
          downloadUrl: f['@microsoft.graph.downloadUrl'],
        }));
      } else if (provider === 'dropbox') {
        const rawFiles = await fetchDropboxFiles(accessToken);
        cloudFiles = rawFiles.map(f => ({
          id: f.id,
          name: f.name,
          path: f.path_display,
        }));
      }

      setFiles(cloudFiles);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const providerName = provider === 'googleDrive' ? 'Google Drive' : 
                       provider === 'oneDrive' ? 'OneDrive' : 'Dropbox';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select from {providerName}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="icon text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={loadFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No image files found in your {providerName}
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onSelect(file)}
                  className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="icon text-4xl text-gray-400">image</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-sm truncate">{file.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudFilePicker;
