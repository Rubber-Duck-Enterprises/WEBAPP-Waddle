import React, { createContext, useContext, useState, ReactNode } from "react";

type ModalContent = ReactNode | null;

interface ModalContextProps {
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
  content: ModalContent;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<ModalContent>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showModal = (modalContent: ReactNode) => {
    setContent(modalContent);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, content, isOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextProps => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal debe usarse dentro de un ModalProvider");
  }
  return context;
};
