import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import OAuthCallback from './components/OAuthCallback';
import ErrorBoundary from './components/ErrorBoundary';
import { validateEnvironment } from './utils/env-validation';

// Validate environment on startup
validateEnvironment();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Simple routing based on path
const path = window.location.pathname;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {path === '/oauth/callback' ? <OAuthCallback /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);