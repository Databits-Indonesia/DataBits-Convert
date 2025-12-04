# OAuth Setup Guide

This guide walks you through setting up OAuth for Google Drive, OneDrive, and Dropbox integration.

## Prerequisites

1. Create developer accounts for each service:
   - **Google Cloud Console**: https://console.cloud.google.com
   - **Microsoft Azure Portal**: https://portal.azure.com
   - **Dropbox App Console**: https://www.dropbox.com/developers/apps

## Step 1: Create OAuth Applications

### Google Drive

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"
4. Create OAuth credentials:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production URL
   - Add authorized redirect URIs:
     - `http://localhost:5173/oauth/callback`
     - Your production URL + `/oauth/callback`
   - Click "Create"
5. Copy the **Client ID**

### Microsoft OneDrive

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
   - Name: Your app name
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Select "Single-page application (SPA)" and add:
     - `http://localhost:5173/oauth/callback`
     - Your production URL + `/oauth/callback`
   - Click "Register"
4. Copy the **Application (client) ID**
5. Navigate to "API permissions":
   - Click "Add a permission" → "Microsoft Graph" → "Delegated permissions"
   - Add `Files.Read` permission
   - Click "Add permissions"

### Dropbox

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
   - Choose "Scoped access"
   - Choose "Full Dropbox" or "App folder" (depending on your needs)
   - Name your app
   - Click "Create app"
3. In the app settings:
   - Under "OAuth 2", add redirect URIs:
     - `http://localhost:5173/oauth/callback`
     - Your production URL + `/oauth/callback`
   - Under "Permissions", enable:
     - `files.metadata.read`
     - `files.content.read`
   - Click "Submit" to save permissions
4. Copy the **App key** (this is your Client ID)

## Step 2: Configure Environment Variables

1. Create a `.env` file in your project root (copy from `.env.example`):

```bash
# Google Drive OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# OneDrive OAuth
VITE_ONEDRIVE_CLIENT_ID=your-onedrive-client-id

# Dropbox OAuth
VITE_DROPBOX_CLIENT_ID=your-dropbox-app-key
```

2. Replace the placeholder values with your actual Client IDs from Step 1

3. **Important**: Add `.env` to your `.gitignore` to prevent committing sensitive credentials

## Step 3: Update Redirect URI for Production

When deploying to production, update the redirect URIs in each OAuth application to include your production URL:

- Google: Add `https://yourdomain.com/oauth/callback`
- OneDrive: Add `https://yourdomain.com/oauth/callback`
- Dropbox: Add `https://yourdomain.com/oauth/callback`

Also update `config/oauth.config.ts` if you need a different redirect URI:

```typescript
redirectUri: window.location.origin + '/oauth/callback',
```

## Step 4: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Open your app at `http://localhost:5173`

3. Try importing from each cloud service:
   - Click "Google Drive", "OneDrive", or "Dropbox" button
   - Authorize the app in the OAuth popup
   - Select a file from the cloud picker
   - The file should be imported successfully

## Troubleshooting

### "OAuth is not configured" error

- Ensure your `.env` file has all the required variables
- Restart your dev server after creating/updating `.env`
- Check that variable names match exactly: `VITE_GOOGLE_CLIENT_ID`, etc.

### OAuth popup blocked

- Allow popups for your development URL
- Check browser console for errors

### "Invalid redirect URI" error

- Ensure the redirect URI in your OAuth app matches exactly: `http://localhost:5173/oauth/callback`
- Include the protocol (`http://` or `https://`)
- Check for trailing slashes

### "Access denied" or permission errors

- Verify you've enabled the correct API scopes in your OAuth app
- For Google: Enable Google Drive API
- For OneDrive: Add Files.Read permission
- For Dropbox: Enable files.metadata.read and files.content.read

### CORS errors

- Google Drive and OneDrive should work with CORS by default
- For Dropbox, ensure you're using the correct API endpoints

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all OAuth credentials
3. **Validate state parameter** (already implemented in OAuthCallback.tsx)
4. **Use HTTPS in production** to protect OAuth tokens
5. **Implement token refresh** for long-running sessions (future enhancement)
6. **Limit OAuth scopes** to minimum required permissions

## API Rate Limits

Be aware of rate limits for each service:

- **Google Drive**: 1,000 requests per 100 seconds per user
- **OneDrive**: Varies by account type, typically 5-10 requests per second
- **Dropbox**: 500 requests per hour per app

Implement error handling and retry logic for production use.

## Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Microsoft Graph Files API](https://learn.microsoft.com/en-us/graph/api/resources/onedrive)
- [Dropbox API Documentation](https://www.dropbox.com/developers/documentation/http/documentation)
