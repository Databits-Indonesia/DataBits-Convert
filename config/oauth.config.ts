/**
 * OAuth Configuration for Cloud Storage Providers
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Google Drive API:
 *    - Go to https://console.developers.google.com/
 *    - Create a new project or select existing
 *    - Enable Google Drive API
 *    - Create OAuth 2.0 credentials (Web application)
 *    - Add authorized redirect URI: http://localhost:3000/oauth/callback
 *    - Copy Client ID and paste below
 * 
 * 2. Microsoft OneDrive:
 *    - Go to https://portal.azure.com/
 *    - Register a new application
 *    - Add redirect URI: http://localhost:3000/oauth/callback
 *    - Add Microsoft Graph API permissions: Files.Read
 *    - Copy Application (client) ID and paste below
 * 
 * 3. Dropbox:
 *    - Go to https://www.dropbox.com/developers/apps
 *    - Create a new app
 *    - Choose "Scoped access" and "Full Dropbox" access
 *    - Add redirect URI: http://localhost:3000/oauth/callback
 *    - Copy App key and paste below
 */

export const OAUTH_CONFIG = {
  googleDrive: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  },
  oneDrive: {
    clientId: import.meta.env.VITE_ONEDRIVE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'Files.Read offline_access',
    authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
  dropbox: {
    clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/callback`,
    scope: 'files.content.read',
    authEndpoint: 'https://www.dropbox.com/oauth2/authorize',
    tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
  },
};

// Check if OAuth is properly configured
export function isOAuthConfigured(provider: 'googleDrive' | 'oneDrive' | 'dropbox'): boolean {
  return Boolean(OAUTH_CONFIG[provider].clientId);
}
