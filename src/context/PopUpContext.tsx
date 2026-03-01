import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type PopUpVariant = "SUCCESS" | "DANGER" | "INFO";

export type PopUpItem = {
  id: string;
  variant: PopUpVariant;
  content: string;
  createdAt: number;
};

interface PopUpContextProps {
  showPopUp: (variant: PopUpVariant, content: string) => string; // devuelve id
  hidePopUp: (id: string) => void;
  clearAll: () => void;
  items: PopUpItem[];
}

const PopUpContext = createContext<PopUpContextProps | undefined>(undefined);

const uid = () => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
};

export const PopUpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PopUpItem[]>([]);

  const showPopUp = (variant: PopUpVariant, content: string) => {
    const id = uid();
    const toast: PopUpItem = { id, variant, content, createdAt: Date.now() };
    setItems((prev) => [toast, ...prev]);
    return id;
  };

  const hidePopUp = (id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => setItems([]);

  const value = useMemo(() => ({ showPopUp, hidePopUp, clearAll, items }), [items]);

  return <PopUpContext.Provider value={value}>{children}</PopUpContext.Provider>;
};

export const usePopUp = (): PopUpContextProps => {
  const ctx = useContext(PopUpContext);
  if (!ctx) throw new Error("usePopUp debe usarse dentro de un PopUpProvider");
  return ctx;
};