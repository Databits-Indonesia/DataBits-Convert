/**
 * OAuth Helper Functions
 * Handles OAuth flow for cloud storage providers
 */

import { OAUTH_CONFIG } from '../config/oauth.config';

type Provider = 'googleDrive' | 'oneDrive' | 'dropbox';

/**
 * Generate random state for OAuth CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Initiate OAuth flow by opening authorization window
 */
export function initiateOAuth(provider: Provider): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = OAUTH_CONFIG[provider];
    
    if (!config.clientId) {
      reject(new Error(`${provider} OAuth is not configured. Please add client ID to environment variables.`));
      return;
    }

    const state = generateState();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', provider);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'token',
      scope: config.scope,
      state: state,
    });

    const authUrl = `${config.authEndpoint}?${params.toString()}`;

    // Open OAuth window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'OAuth Authorization',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error('Failed to open OAuth window. Please allow popups for this site.'));
      return;
    }

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth_success') {
        window.removeEventListener('message', handleMessage);
        resolve(event.data.accessToken);
      } else if (event.data.type === 'oauth_error') {
        window.removeEventListener('message', handleMessage);
        reject(new Error(event.data.error || 'OAuth authorization failed'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        reject(new Error('OAuth window was closed'));
      }
    }, 1000);
  });
}

/**
 * Fetch files from Google Drive
 */
export async function fetchGoogleDriveFiles(accessToken: string): Promise<any[]> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=mimeType contains "image/" and trashed=false&fields=files(id,name,mimeType,thumbnailLink,webContentLink)',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google Drive files');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Download file from Google Drive
 */
export async function downloadGoogleDriveFile(fileId: string, accessToken: string): Promise<Blob> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download file from Google Drive');
  }

  return await response.blob();
}

/**
 * Fetch files from OneDrive
 */
export async function fetchOneDriveFiles(accessToken: string): Promise<any[]> {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=file ne null and (startswith(file/mimeType, "image/"))',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch OneDrive files');
  }

  const data = await response.json();
  return data.value || [];
}

/**
 * Download file from OneDrive
 */
export async function downloadOneDriveFile(downloadUrl: string, accessToken: string): Promise<Blob> {
  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download file from OneDrive');
  }

  return await response.blob();
}

/**
 * Fetch files from Dropbox
 */
export async function fetchDropboxFiles(accessToken: string): Promise<any[]> {
  const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: '',
      recursive: false,
      include_media_info: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Dropbox files');
  }

  const data = await response.json();
  // Filter for image files
  return (data.entries || []).filter((entry: any) => 
    entry['.tag'] === 'file' && 
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(entry.name)
  );
}

/**
 * Download file from Dropbox
 */
export async function downloadDropboxFile(path: string, accessToken: string): Promise<Blob> {
  const response = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download file from Dropbox');
  }

  return await response.blob();
}
