import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from '@/App.tsx';
import Modal from '@/components/Modal';
import { ModalProvider } from '@/context/ModalContext';

import { Capacitor } from '@capacitor/core';
import { SafeArea } from 'capacitor-plugin-safe-area';

import './index.css';

if (Capacitor.isNativePlatform()) {
  (async () => {
    try {
      const result = await SafeArea.getSafeAreaInsets();
      console.log('SafeArea result:', result);

      const { top, bottom } = result.insets;

      document.documentElement.style.setProperty('--safe-area-top', `${top}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${bottom}px`);
    } catch (err) {
      console.warn('Error obteniendo SafeArea:', err);
    }
  })();
}

registerSW({
  onNeedRefresh() {
    console.log('🔄 Hay una nueva versión disponible');
  },
  onOfflineReady() {
    console.log('✅ App lista para usar sin conexión');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
      <Modal />
    </ModalProvider>
  </StrictMode>
);
