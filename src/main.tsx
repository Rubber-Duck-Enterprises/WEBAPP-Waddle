import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import Modal from './components/Modal';
import { ModalProvider } from './context/ModalContext';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
      <Modal />
    </ModalProvider>
  </StrictMode>
);
