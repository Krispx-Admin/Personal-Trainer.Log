import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import './index.css';

// Restore theme preference before render to avoid a flash of the wrong mode.
// No saved preference → follow the device's color scheme.
try {
  const t = localStorage.getItem('fitats:theme');
  if (t === 'light') {
    document.documentElement.dataset.theme = 'light';
  } else if (t !== 'dark') {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      document.documentElement.dataset.theme = 'light';
    }
  }
} catch {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
