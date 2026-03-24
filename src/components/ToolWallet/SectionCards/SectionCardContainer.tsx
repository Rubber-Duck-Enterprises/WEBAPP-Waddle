import React from "react";
import { Section } from "../../../types";

interface SectionCardContainerProps {
  section: Section;
  children: React.ReactNode;
}

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
  return <div style={getSectionCardStyle(section)}>{children}</div>;
};

export default SectionCardContainer;
