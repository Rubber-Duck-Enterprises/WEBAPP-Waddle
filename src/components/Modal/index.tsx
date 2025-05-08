import { createPortal } from "react-dom";
import { useModal } from "../../context/ModalContext";
import { AnimatePresence, motion } from "framer-motion";

const Modal = () => {
  const { isOpen, content, hideModal } = useModal();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro con fade */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={hideModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 1000,
            }}
          />

          {/* Contenedor centrado con contenido animado */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1001,
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "var(--background)",
                color: "var(--text-primary)",
                padding: "24px",
                borderRadius: "12px",
                minWidth: "300px",
                maxWidth: "90vw",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
                pointerEvents: "auto",
              }}
            >
              {content}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
