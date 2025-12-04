<div align="center">
<img width="1200" height="475" alt="GHBanner" src="/logo_small.jpeg" />
</div>

# DataBits Convert

A powerful, client-side PDF and image conversion tool built with React, TypeScript, and Vite.

## ✨ Features

- **PDF Tools**: Merge, split, compress, crop, organize, sign PDFs
- **Image Conversion**: Convert various image formats to PDF
- **Cloud Storage**: Import from Google Drive, OneDrive, Dropbox (optional)
- **Fully Client-Side**: All processing happens in your browser
- **Privacy-Focused**: No data sent to servers
- **Modern UI**: Responsive design with dark mode support

## 🚀 Quick Start

**Prerequisites:**  Node.js 20+

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd databits-convert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
```

## 🔧 Configuration

### Optional: Cloud Storage OAuth

To enable cloud storage import features, see [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed instructions.

Copy `.env.example` to `.env.local` and add your OAuth credentials:

```bash
cp .env.example .env.local
```

The app works fully without OAuth configuration - users can still upload files locally.

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - How to deploy to various platforms
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- [OAuth Setup](OAUTH_SETUP.md) - Configure cloud storage integrations
- [OAuth Integration](OAUTH_INTEGRATION.md) - Technical OAuth details

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **PDF.js** - PDF rendering
- **pdf-lib** - PDF manipulation
- **Tesseract.js** - OCR functionality
- **TailwindCSS** - Styling (via index.css)

## 📄 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/yourusername/databits-convert/issues)
