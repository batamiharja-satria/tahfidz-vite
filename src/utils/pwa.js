// src/utils/pwa.js
import { Workbox } from 'workbox-window';

export function registerSW() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');
    
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        if (confirm('Aplikasi memiliki update baru. Muat ulang untuk mendapatkan fitur terbaru?')) {
          window.location.reload();
        }
      }
    });

    wb.register();
  }
}

// Fungsi untuk menampilkan install prompt
export function showInstallPrompt() {
  // Event listener untuk beforeinstallprompt
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Tampilkan custom install button di app lo
    const installButton = document.createElement('button');
    installButton.textContent = '📲 Install App';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    installButton.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installButton.remove();
      }
    };
    
    document.body.appendChild(installButton);
  });
}