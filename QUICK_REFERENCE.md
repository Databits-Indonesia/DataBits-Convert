# Quick Reference Guide

## 🚀 Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check for errors
npm run lint:fix         # Auto-fix errors
npm run format           # Format all code
npm run format:check     # Check if code is formatted
npm run type-check       # TypeScript check

# Deployment
netlify deploy --prod    # Deploy to Netlify
vercel --prod            # Deploy to Vercel
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main app component |
| `index.tsx` | Entry point with ErrorBoundary |
| `config/constants.ts` | App configuration & constants |
| `config/oauth.config.ts` | OAuth settings |
| `.env.local` | Local environment variables (create from `.env.example`) |
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript configuration |
| `.eslintrc.json` | ESLint rules |
| `.prettierrc` | Code formatting rules |

## 🛠️ Project Structure

```
DataBits-Convert/
├── components/          # React components
│   ├── ErrorBoundary.tsx
│   ├── FileUploader.tsx
│   └── ...
├── tools/              # PDF processing tools
│   ├── merge.ts
│   ├── split.ts
│   └── ...
├── utils/              # Helper utilities
│   ├── helpers.ts
│   ├── oauth.ts
│   └── env-validation.ts
├── config/             # Configuration
│   ├── constants.ts
│   └── oauth.config.ts
├── .github/workflows/  # CI/CD
└── docs: README, DEPLOYMENT, CONTRIBUTING
```

## 🔧 Configuration Files

### Environment Variables (.env.local)
```env
# Optional OAuth configs
VITE_GOOGLE_CLIENT_ID=your_id
VITE_ONEDRIVE_CLIENT_ID=your_id
VITE_DROPBOX_CLIENT_ID=your_id
```

### VSCode Settings
Already configured for:
- Auto-format on save
- ESLint auto-fix
- Prettier integration

### Recommended VSCode Extensions
- ESLint
- Prettier
- TypeScript

## 🚢 Deployment Platforms

| Platform | Command | Config File |
|----------|---------|-------------|
| Netlify | `netlify deploy --prod` | `netlify.toml` |
| Vercel | `vercel --prod` | `vercel.json` |
| GitHub Pages | `npm run deploy` | Add script to package.json |
| Cloudflare | Connect Git repo | Auto-detected |

## 📋 Pre-Deployment Checklist

- [ ] `npm install` - Install dependencies
- [ ] `npm run lint` - No linting errors
- [ ] `npm run type-check` - No type errors
- [ ] `npm run build` - Build succeeds
- [ ] Test locally with `npm run dev`
- [ ] Update README with your info
- [ ] (Optional) Configure OAuth
- [ ] Choose deployment platform

## 🐛 Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Type Errors
- Check `tsconfig.json` - strict mode is disabled
- Add `// @ts-ignore` for external libraries
- Use `npm run type-check` to find issues

### Linting Errors
```bash
npm run lint:fix    # Auto-fix
npm run format      # Format code
```

### OAuth Not Working
- Check `.env.local` has correct IDs
- Verify redirect URIs in OAuth console
- See `OAUTH_SETUP.md` for details

## 💡 Tips

### Adding New Tool
1. Create file in `tools/` (e.g., `my-tool.ts`)
2. Export main function
3. Add to `config/constants.ts` POPULAR_TOOLS
4. Add case in `App.tsx` executeToolAfterUpload
5. Test with `npm run dev`

### Modifying UI
- Components in `components/`
- Styles in `index.css` (Tailwind)
- Icons: Material Icons (via `<span class="icon">name</span>`)

### Adding Dependencies
```bash
npm install package-name          # Runtime dependency
npm install -D package-name       # Dev dependency
```

## 📚 Documentation Links

- **Getting Started**: [README.md](README.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changes Made**: [IMPROVEMENTS.md](IMPROVEMENTS.md)
- **Setup Summary**: [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
- **OAuth Setup**: [OAUTH_SETUP.md](OAUTH_SETUP.md)

## 🎯 Key Features

✅ Fully client-side (no backend)  
✅ Privacy-focused (no data sent to servers)  
✅ 10+ PDF tools  
✅ Image to PDF conversion  
✅ Cloud storage import (optional)  
✅ Dark mode support  
✅ Mobile responsive  

## 🔒 Security Notes

- All processing happens in browser
- No data sent to external servers
- OAuth tokens stored in memory only
- Security headers configured
- CORS restrictions apply to URL imports

## 📊 Performance

- Bundle size: ~2MB (537KB gzipped)
- First load: Fast with code splitting
- Caching: Configured for static assets
- Offline: Works after first load

## 🆘 Getting Help

1. Check this guide
2. Read detailed docs (DEPLOYMENT.md, etc.)
3. Search existing issues
4. Create new issue with details

---

**Quick Start:** `npm install` → `npm run dev` → Open http://localhost:3000

**Quick Deploy:** `npm run build` → Deploy `dist/` folder

**Quick Fix:** `npm run lint:fix && npm run format`
