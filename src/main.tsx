import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App.tsx';
import Modal from './components/Modal';
import { ModalProvider } from './context/ModalContext';

import './index.css';

registerSW({
  onNeedRefresh() {
    console.log('🔄 Hay una nueva versión disponible');
  },
  onOfflineReady() {
    console.log('✅ App lista para usar sin conexión');
  },
});

if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('🔔 Permiso de notificaciones concedido');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
      <Modal />
    </ModalProvider>
  </StrictMode>
);
