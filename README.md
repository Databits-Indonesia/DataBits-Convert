<div align="center">
<img width="1200" height="475" alt="GHBanner" src="/logo_small.jpeg" />
</div>

# DataBits Convert

A powerful, client-side PDF and image conversion tool built with React, TypeScript, and Next.js.

## ✨ Features

- **PDF Tools**: Merge, split, compress, crop, organize, sign PDFs
- **Image Conversion**: Convert various image formats to PDF
- **Local File Uploads**: Import files directly from your device
- **Fully Client-Side**: All processing happens in your browser
- **Privacy-Focused**: No data sent to servers
- **Modern UI**: Responsive design with dark mode support

## 🚀 Quick Start

**Prerequisites:** Node.js 20+

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
npm run dev          # Start Next.js development server
npm run build        # Build for production (static export)
npm run start        # Start Next.js production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
```

## 🔧 Configuration

No OAuth or cloud storage setup is required.
All conversions run client-side with local file uploads.

## 📚 Documentation

- [Migration Guide](MIGRATION.md) - Vite to Next.js migration details
- [Deployment Guide](DEPLOYMENT.md) - How to deploy to various platforms
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

## 🛠️ Tech Stack

- **Next.js 16** - React framework with App Router (Static Export mode)
- **React 19** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling framework
- **PDF.js** - PDF rendering
- **pdf-lib** - PDF manipulation
- **Tesseract.js** - OCR functionality

## 📄 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/yourusername/databits-convert/issues)
