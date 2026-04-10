import React from 'react';
import {
  editMetadataFields,
  encryptPasswordFields,
  metadataRemovalFields,
  permissionsCheckboxFields,
  permissionsPasswordFields,
} from '../../app/lib/security-form-config';

interface SecurityToolsSectionProps {
  onEncrypt: () => void;
  onDecrypt: () => void;
  onChangePermissions: () => void;
  onRemoveMetadata: () => void;
  onEditMetadata: () => void;
  onViewMetadata: () => void;
  onRemoveRestrictions: () => void;
  onRemoveAnnotations: () => void;
}

const SecurityToolsSection: React.FC<SecurityToolsSectionProps> = ({
  onEncrypt,
  onDecrypt,
  onChangePermissions,
  onRemoveMetadata,
  onEditMetadata,
  onViewMetadata,
  onRemoveRestrictions,
  onRemoveAnnotations,
}) => {
  return (
    <>
      <div id="encrypt-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Encrypt PDF</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Protect PDF with password encryption (256-bit AES)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {encryptPasswordFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type ?? 'text'}
                  id={field.id}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                id="encrypt-add-restrictions"
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Add usage restrictions (requires owner password)
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
              Prevents printing, copying, and editing without owner password
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onEncrypt}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Encrypt PDF
            </button>
          </div>
        </div>
      </div>

      <div id="decrypt-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Decrypt PDF</h2>
            <p className="text-gray-600 dark:text-gray-400">Remove password protection from PDF</p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="decrypt-password"
              placeholder="Enter PDF password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={onDecrypt}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Decrypt PDF
            </button>
          </div>
        </div>
      </div>

      <div id="change-permissions-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Change Permissions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Modify PDF security permissions and encryption
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password (if encrypted)
            </label>
            <input
              type="password"
              id="permissions-current-password"
              placeholder="Enter current password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Required only if the PDF is already password-protected
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {permissionsPasswordFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type ?? 'text'}
                  id={field.id}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {field.helperText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {field.helperText}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Document Permissions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Set what users can do with this PDF (requires owner password)
            </p>
            <div className="space-y-3">
              {permissionsCheckboxFields.map((field) => (
                <label key={field.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id={field.id}
                    defaultChecked={field.defaultChecked}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onChangePermissions}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Update Permissions
            </button>
          </div>
        </div>
      </div>

      <div id="remove-metadata-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Remove Metadata
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Remove metadata and hidden information from your PDF
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Metadata Removal Options
            </h3>
            <div className="space-y-3">
              {metadataRemovalFields.map((field) => (
                <label key={field.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id={field.id}
                    defaultChecked={field.defaultChecked}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {field.title}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This will permanently remove selected metadata from the PDF. This action cannot be
                undone.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onRemoveMetadata}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Remove Metadata
            </button>
          </div>
        </div>
      </div>

      <div id="edit-metadata-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Edit Metadata</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Modify document properties and information
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Document Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editMetadataFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type ?? 'text'}
                    id={field.id}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  {field.helperText && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {field.helperText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onEditMetadata}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Update Metadata
            </button>
          </div>
        </div>
      </div>

      <div id="view-metadata-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">View Metadata</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View all PDF document properties and information
            </p>
          </div>
          <div id="metadata-empty" className="text-center py-8 text-gray-500">
            <p>Upload a PDF and click "View Metadata" to see document properties</p>
          </div>
          <div id="metadata-result" className="hidden mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Document Information
            </h3>
            <div
              id="metadata-basic"
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6"
            ></div>
          </div>
          <div id="metadata-custom" className="hidden mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Custom Fields
            </h3>
            <div
              id="metadata-custom-fields"
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6"
            ></div>
          </div>
          <div id="metadata-document" className="hidden mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              File Information
            </h3>
            <div
              id="metadata-document-info"
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
            ></div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onViewMetadata}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              View Metadata
            </button>
          </div>
        </div>
      </div>

      <div id="remove-restrictions-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Remove Restrictions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Remove editing, printing, and copying restrictions from your PDF
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password (if required)
            </label>
            <input
              type="password"
              id="restrictions-password"
              placeholder="Enter owner or user password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This will remove all security restrictions.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onRemoveRestrictions}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Remove Restrictions
            </button>
          </div>
        </div>
      </div>

      <div id="remove-annotations-container" className="hidden max-w-6xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Remove Annotations
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Remove all comments, highlights, and markups from your PDF
            </p>
          </div>
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onRemoveAnnotations}
              className="px-8 py-3 bg-primary text-white text-lg font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Remove All Annotations
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecurityToolsSection;
