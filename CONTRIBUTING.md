# Contributing to DataBits Convert

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/databits-convert.git
   cd databits-convert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
databits-convert/
├── components/          # React components
├── tools/              # PDF processing tools
├── utils/              # Helper utilities
├── config/             # Configuration files
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── state.ts            # Global state
├── types.ts            # TypeScript types
└── ui.ts               # UI utilities
```

---

## 🔧 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow existing code style
- Write clean, readable code
- Add comments for complex logic
- Keep functions small and focused

### 3. Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### 4. Test Your Changes

- Test all affected features
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test responsive design on mobile
- Ensure no console errors

### 5. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new PDF tool"
git commit -m "fix: resolve merge issue"
git commit -m "docs: update README"
git commit -m "style: format code"
git commit -m "refactor: improve performance"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 6. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

---

## 📝 Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use type inference where appropriate

```typescript
// Good
interface ToolConfig {
  id: string;
  name: string;
  icon: string;
}

// Avoid
const config: any = { ... };
```

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ onClick, label, disabled }) => {
  // ...
};
```

### File Organization

- One component per file
- Co-locate related files
- Use index files for cleaner imports
- Keep files under 300 lines

### Naming Conventions

- **Components**: PascalCase (`FileUploader.tsx`)
- **Utilities**: camelCase (`helpers.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types**: PascalCase (`FileState`, `Tool`)

### Error Handling

- Always handle errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Use try-catch for async operations

```typescript
try {
  await processFile(file);
} catch (error) {
  console.error('Error processing file:', error);
  showAlert('Failed to process file. Please try again.');
}
```

---

## 🎨 Adding New Features

### Adding a New PDF Tool

1. **Create tool file** in `tools/` directory:
   ```typescript
   // tools/my-new-tool.ts
   export async function myNewTool() {
     // Implementation
   }
   ```

2. **Update constants** in `config/constants.ts`:
   ```typescript
   { 
     id: 'my-tool', 
     name: 'My Tool', 
     icon: 'icon_name', 
     description: 'Tool description' 
   }
   ```

3. **Add to App.tsx** switch statement:
   ```typescript
   case 'my-tool':
     await myNewTool();
     break;
   ```

4. **Test thoroughly**

### Adding a New Component

1. Create component file in `components/`
2. Export component
3. Import and use in parent component
4. Add proper TypeScript types

---

## 🐛 Bug Reports

When reporting bugs, include:

- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS information
- Screenshots if applicable
- Console errors if any

---

## 💡 Feature Requests

When requesting features:

- Describe the feature clearly
- Explain the use case
- Provide examples if possible
- Consider implementation complexity

---

## 🧪 Testing

While we don't have automated tests yet, please:

- Manually test all changes
- Test edge cases
- Test error scenarios
- Verify on multiple browsers
- Check mobile responsiveness

---

## 📚 Documentation

- Update README.md if adding features
- Update DEPLOYMENT.md if changing build process
- Add JSDoc comments for complex functions
- Update OAUTH_SETUP.md if changing OAuth

---

## ⚖️ Code Review Process

1. All PRs require review
2. Address review comments
3. Keep PRs focused and small
4. Squash commits before merging
5. Delete branch after merge

---

## 🎯 Performance Guidelines

- Keep bundle size small
- Lazy load when possible
- Optimize images and assets
- Avoid unnecessary re-renders
- Use proper React keys

---

## 🔒 Security Guidelines

- Never commit secrets or API keys
- Validate user input
- Sanitize file names
- Handle errors securely
- Keep dependencies updated

---

## 📞 Questions?

- Open an issue for questions
- Join discussions
- Check existing issues first

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing! 🎉
