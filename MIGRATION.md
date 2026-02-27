# Migration from Vite to Next.js

This document describes the migration from Vite to Next.js App Router completed on February 27, 2026.

## Summary of Changes

### Framework Migration

- **From:** Vite + React SPA
- **To:** Next.js 15 App Router (Static Export mode)

### Key Benefits

- Better SEO capabilities
- Improved performance with automatic code splitting
- Built-in image and font optimization
- Better developer experience with TypeScript support
- Simplified deployment configuration

## Files Changed

### Added Files

- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `app/layout.tsx` - Root layout component
- `app/globals.css` - Global styles with Tailwind directives
- `app/[[...slug]]/page.tsx` - Catch-all page for SPA mode
- `app/[[...slug]]/client.tsx` - Client-side wrapper component
- `public/` - Static assets folder

### Modified Files

- `package.json` - Updated scripts and dependencies
- `tsconfig.json` - Added Next.js TypeScript plugin
- `.eslintrc.json` - Added Next.js ESLint config
- `.gitignore` - Added Next.js build outputs
- `vercel.json` - Updated for Next.js deployment
- `netlify.toml` - Updated for Next.js deployment
- `staticwebapp.config.json` - Updated for Azure Static Web Apps

### Removed Files

- `vite.config.ts` - No longer needed
- `vite-env.d.ts` - No longer needed
- `index.html` - Replaced by app/layout.tsx
- `index.tsx` - Replaced by app/[[...slug]]/page.tsx
- `tsconfig.node.json` - No longer needed
- `index.css` - Replaced by app/globals.css

## Dependencies Changes

### Added

- `next` ^15.1.6
- `autoprefixer` ^10.4.20
- `postcss` ^8.4.49
- `tailwindcss` ^3.4.17
- `@tailwindcss/forms` ^0.5.9
- `@tailwindcss/typography` ^0.5.15
- `eslint-config-next` ^15.1.6

### Removed

- `vite`
- `@vitejs/plugin-react`
- `eslint-plugin-react-refresh`
- `vitest`

## App Structure

```
app/
├── layout.tsx                 # Root layout with HTML structure
├── globals.css               # Global styles
└── [[...slug]]/
    ├── page.tsx              # Main page with routing logic
    └── client.tsx            # Client-only wrapper for App component
```

## How to Run

### Development

```bash
npm run dev
```

Application will run on http://localhost:3000

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory

### Preview Production Build

```bash
npm run start
```

## Important Notes

### Static Export Mode

The application is configured for static export (`output: 'export'` in next.config.mjs), which means:

- It generates static HTML files at build time
- No server-side rendering (SSR) at runtime
- Perfect for static hosting (Vercel, Netlify, Azure Static Web Apps)
- Maintains SPA behavior with client-side routing

### Routing

- The app uses a catch-all route `[[...slug]]` to handle all routes
- OAuth callback route (`/oauth/callback`) is handled in the page component
- All existing routes continue to work as before

### Static Assets

- Static assets are now in the `public/` folder
- Files in `public/` are served from the root URL
- Example: `public/logo_small.jpeg` is accessible at `/logo_small.jpeg`

### Environment Variables

- Use `NEXT_PUBLIC_` prefix for client-side environment variables
- Example: `NEXT_PUBLIC_API_KEY` instead of `VITE_API_KEY`

### Import Maps

- The application still uses CDN-based import maps (aistudiocdn.com)
- Import maps are included in the root layout

### CSS and Styling

- Tailwind CSS is now configured via `tailwind.config.ts`
- Global styles are in `app/globals.css`
- Tailwind plugins (forms, typography) are properly configured

## Deployment

### Vercel

```bash
vercel deploy
```

Vercel automatically detects Next.js and uses optimized build settings.

### Netlify

Deploy is handled via `netlify.toml`. The build command and publish directory are already configured.

### Azure Static Web Apps

Deploy using the Azure CLI or GitHub Actions. Configuration is in `staticwebapp.config.json`.

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Delete `node_modules/` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build`

### TypeScript Errors

If you see TypeScript errors:

1. Delete `.next/` folder
2. Run `npm run dev` to regenerate Next.js types

### Missing Types

If you see "Cannot find module" errors:

1. Ensure all dependencies are installed: `npm install`
2. Check that `next-env.d.ts` exists (auto-generated on first run)

## Next Steps

Consider these incremental improvements:

1. **Remove CDN dependencies**: Install packages via npm instead of using import maps
2. **Optimize Images**: Replace `<img>` tags with Next.js `<Image>` component
3. **Server Components**: Gradually convert static components to React Server Components
4. **API Routes**: Add API routes if backend functionality is needed
5. **Metadata API**: Add page-specific metadata for better SEO

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/from-vite)
