import React from "react";
import { Section } from "@/types";
import styles from "./SectionCards.module.css";

interface SectionCardContainerProps {
  section: Section;
  children: React.ReactNode;
}

/**
 * Genera estilos dinámicos basados en el color de la sección.
 * Exportado para uso en tests de propiedades.
 */
export function getSectionCardStyle(section: Section): React.CSSProperties {
  const color = section.color;
  return {
    background: `${color || "var(--surface)"}1A`,
    borderRadius: "12px",
    padding: "1rem",
    border: `1px solid ${color || "var(--border-color)"}`,
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    color: "var(--text-primary)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };
}

const SectionCardContainer: React.FC<SectionCardContainerProps> = ({
  section,
  children,
}) => {
  const dynamicStyle: React.CSSProperties = {
    background: `${section.color || "var(--surface)"}1A`,
    border: `1px solid ${section.color || "var(--border-color)"}`,
  };

  return (
    <div className={styles.container} style={dynamicStyle}>
      {children}
    </div>
  );
};

export default SectionCardContainer;
