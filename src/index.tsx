import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function logDatabaseStatus() {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch('/api/db-status', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const status = await response.json();
    console.info('🔍 Database status', status);
  } catch (error) {
    console.error('❌ Unable to confirm database status', error);
  }
}

logDatabaseStatus();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 