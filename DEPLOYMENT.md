# Deployment Guide

This guide covers deploying DataBits Convert to various platforms.

## 📋 Prerequisites

- Node.js 20+ installed
- Git repository
- (Optional) OAuth credentials for cloud storage features

## 🚀 Deployment Platforms

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

#### Manual Deployment

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

#### Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects
- Security headers
- Asset caching

#### Environment Variables

Set in Netlify UI (Site settings → Environment variables):
- `VITE_GOOGLE_CLIENT_ID` (optional)
- `VITE_ONEDRIVE_CLIENT_ID` (optional)
- `VITE_DROPBOX_CLIENT_ID` (optional)

---

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

#### Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

#### Configuration

The `vercel.json` file is already configured with:
- Build settings
- SPA rewrites
- Security headers
- Asset caching

#### Environment Variables

Set in Vercel UI (Project Settings → Environment Variables):
- `VITE_GOOGLE_CLIENT_ID` (optional)
- `VITE_ONEDRIVE_CLIENT_ID` (optional)
- `VITE_DROPBOX_CLIENT_ID` (optional)

---

### GitHub Pages

1. Install `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/databits-convert"
   }
   ```

3. Update `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/databits-convert/',
     // ... rest of config
   });
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

---

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages

2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

3. Set environment variables (if using OAuth):
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_ONEDRIVE_CLIENT_ID`
   - `VITE_DROPBOX_CLIENT_ID`

---

## 🔐 OAuth Setup for Production

If you want to enable cloud storage import features:

1. **Update OAuth Redirect URIs** in your OAuth provider consoles:
   - Google: `https://yourdomain.com/oauth/callback`
   - OneDrive: `https://yourdomain.com/oauth/callback`
   - Dropbox: `https://yourdomain.com/oauth/callback`

2. **Set Environment Variables** on your deployment platform

3. **Test OAuth Flow** after deployment

See `OAUTH_SETUP.md` for detailed OAuth configuration.

---

## ✅ Post-Deployment Checklist

- [ ] Test all PDF tools (merge, split, compress, etc.)
- [ ] Test image to PDF conversion
- [ ] Test file upload/download
- [ ] Verify responsive design on mobile
- [ ] Test OAuth flows (if configured)
- [ ] Check browser console for errors
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify security headers (use securityheaders.com)
- [ ] Test performance (use Lighthouse)

---

## 🐛 Troubleshooting

### Build Fails

- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 20+)
- Check build logs for specific errors

### OAuth Not Working

- Verify redirect URIs match exactly
- Check environment variables are set correctly
- Ensure OAuth credentials are for the correct environment (development vs production)

### Large Bundle Size

- Check if all dependencies are necessary
- Consider lazy loading for tools
- Use bundle analyzer: `npm install --save-dev rollup-plugin-visualizer`

### CORS Errors with URL Import

- This is expected for URLs without CORS headers
- Users should use direct file upload instead
- Consider adding a proxy endpoint (requires backend)

---

## 📊 Performance Optimization

1. **Enable compression** (Gzip/Brotli) - already configured in Netlify/Vercel
2. **Set proper cache headers** - already configured
3. **Consider CDN** - Netlify/Vercel provide this automatically
4. **Monitor bundle size** - keep under 500KB for main bundle

---

## 🔒 Security Considerations

- All PDF processing happens **client-side** (no data sent to servers)
- OAuth tokens are stored in memory only (not persisted)
- Security headers are configured to prevent XSS, clickjacking
- No sensitive data in environment variables exposed to client
- Regular dependency updates recommended

---

## 📝 Notes

- The app is fully client-side and requires no backend
- OAuth features are optional - app works without them
- File size limit is enforced client-side (50MB default)
- All processing is done in the browser using WebAssembly and JavaScript libraries
