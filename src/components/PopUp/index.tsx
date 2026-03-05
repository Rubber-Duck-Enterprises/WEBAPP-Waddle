import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { usePopUp, PopUpVariant } from "@/context/PopUpContext";

const stylesByVariant: Record<
  PopUpVariant,
  { icon: string; bg: string; border: string }
> = {
  SUCCESS: {
    icon: "🎉",
    bg: "var(--success-bg-popup)",
    border: "var(--success-color)",
  },
  DANGER: {
    icon: "💥",
    bg: "var(--danger-bg-popup)",
    border: "var(--danger-color)",
  },
  INFO: {
    icon: "ℹ️",
    bg: "var(--information-bg-popup)",
    border: "var(--information-color)",
  },
};

type ToastProps = {
  id: string;
  variant: PopUpVariant;
  content: string;
  onClose: (id: string) => void;
  autoCloseMs?: number;
};

function Toast({ id, variant, content, onClose, autoCloseMs = 4500 }: ToastProps) {
  const s = stylesByVariant[variant];

  useEffect(() => {
    const t = window.setTimeout(() => onClose(id), autoCloseMs);
    return () => window.clearTimeout(t);
  }, [id, onClose, autoCloseMs]);

  return (
    <motion.div
      layout
      initial="closed"
      animate="open"
      exit="exit"
      variants={{
        closed: { opacity: 0, x: 20 },
        open: { opacity: 1, x: 0},
        exit: { opacity: 0, x: 20},
      }}
      transition={{
        opacity: { duration: 0.15 },
        y: { duration: 0.2 },
        width: { type: "spring", stiffness: 520, damping: 35 },
      }}
      style={{
        pointerEvents: "auto",
        height: 44,
        borderRadius: 8,
        background: s.bg,
        border: `1px solid ${s.border}`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          flex: "0 0 44px",
          fontSize: 20,
        }}
        aria-hidden
      >
        {s.icon}
      </div>

      <div
        style={{
          width: 1,
          height: "60%",
          backgroundColor: s.border,
          marginRight: "1rem",
        }}
      />

      <motion.div
        style={{
          minWidth: 0,
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingRight: 10,
        }}
      >
        <div
          style={{
            minWidth: 0,
            width: "100%",
            maxWidth: "40vw",
            flex: "1 1 auto",
            fontSize: 14,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={content}
        >
          {content}
        </div>

        <button
          onClick={() => onClose(id)}
          aria-label="Cerrar notificación"
          style={{
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            color: s.border,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
          }}
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function PopUp() {
  const { items, hidePopUp } = usePopUp();

  useEffect(() => {
    if (items.length <= 3) return;

    const oldest = items[items.length - 1];
    hidePopUp(oldest.id);
  }, [items, hidePopUp]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "calc(16px + var(--safe-area-top, 0px))",
        right: 16,
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            variant={t.variant}
            content={t.content}
            onClose={hidePopUp}
            autoCloseMs={4500}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}