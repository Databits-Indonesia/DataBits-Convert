'use client';

/**
 * OAuth Callback Handler
 * This component handles the OAuth redirect and sends the token back to the parent window
 */

import { useEffect } from 'react';

import React from 'react';

const OAuthCallback: React.FC = () => {
  useEffect(() => {
    // Parse hash parameters from URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const state = params.get('state');
    const error = params.get('error');

    // Verify state to prevent CSRF
    const savedState = sessionStorage.getItem('oauth_state');

    if (error) {
      // Send error back to parent window
      window.opener?.postMessage(
        {
          type: 'oauth_error',
          error: error,
        },
        window.location.origin
      );
      window.close();
      return;
    }

    if (!accessToken || state !== savedState) {
      window.opener?.postMessage(
        {
          type: 'oauth_error',
          error: 'Invalid state or missing access token',
        },
        window.location.origin
      );
      window.close();
      return;
    }

    // Send success message with token back to parent
    window.opener?.postMessage(
      {
        type: 'oauth_success',
        accessToken: accessToken,
      },
      window.location.origin
    );

    // Clean up
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');

    window.close();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300">Completing authorization...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
