/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

interface EnvConfig {
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_ONEDRIVE_CLIENT_ID?: string;
  VITE_DROPBOX_CLIENT_ID?: string;
}

export function validateEnvironment(): void {
  const env: EnvConfig = {
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_ONEDRIVE_CLIENT_ID: import.meta.env.VITE_ONEDRIVE_CLIENT_ID,
    VITE_DROPBOX_CLIENT_ID: import.meta.env.VITE_DROPBOX_CLIENT_ID,
  };

  const warnings: string[] = [];

  if (!env.VITE_GOOGLE_CLIENT_ID) {
    warnings.push('Google Drive OAuth not configured');
  }

  if (!env.VITE_ONEDRIVE_CLIENT_ID) {
    warnings.push('OneDrive OAuth not configured');
  }

  if (!env.VITE_DROPBOX_CLIENT_ID) {
    warnings.push('Dropbox OAuth not configured');
  }

  if (warnings.length > 0) {
    console.warn(
      '⚠️  Optional features not configured:\n' +
        warnings.map((w) => `   - ${w}`).join('\n') +
        '\n\nThe app will work without cloud storage import. See OAUTH_SETUP.md for configuration.'
    );
  }
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function isProduction(): boolean {
  return import.meta.env.PROD;
}

export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '0.0.0';
}
