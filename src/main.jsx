// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
      },
      (error) => {
        console.log('Échec de l\'enregistrement du Service Worker:', error);
      }
    );
  });
}

// Gestion de l'installation PWA
let deferredPrompt;
const installNotification = document.getElementById('pwa-install-notification');
const installButton = document.getElementById('pwa-install-btn');
const dismissButton = document.getElementById('pwa-dismiss-btn');

if (installNotification && installButton && dismissButton) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Afficher la notification après un délai
    setTimeout(() => {
      installNotification.style.display = 'block';
      installNotification.classList.add('show');
    }, 3000);
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Application installée');
    }
    
    deferredPrompt = null;
    installNotification.classList.remove('show');
    setTimeout(() => {
      installNotification.style.display = 'none';
    }, 300);
  });

  dismissButton.addEventListener('click', () => {
    installNotification.classList.remove('show');
    setTimeout(() => {
      installNotification.style.display = 'none';
    }, 300);
  });
}

// Détection du mode hors ligne
window.addEventListener('online', () => {
  console.log('Vous êtes en ligne');
  // Vous pourriez ajouter une notification ici
});

window.addEventListener('offline', () => {
  console.log('Vous êtes hors ligne');
  // Vous pourriez ajouter une notification ici
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);