import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        
      })
      .catch(() => {
        
      });
  });
}



const rootElement = document.getElementById('root');
if (!rootElement) {
  
} else {
  
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  
} 