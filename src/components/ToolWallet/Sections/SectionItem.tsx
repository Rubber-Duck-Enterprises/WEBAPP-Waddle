import React from "react";
import UIButton from "@/components/UI/UIButton";
import { Section } from "@/types";

interface Props {
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
}

const SectionItem: React.FC<Props> = ({ section, onEdit, onDelete }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem",
      borderRadius: "12px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      background: `${section.color || "var(--surface)"}1A`,
      border: `1px solid ${section.color || "#ccc"}`,
      borderLeft: `16px solid ${section.color || "#ccc"}`,
      gap: "1rem",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
      <div style={{ fontSize: "2rem" }}>{section.icon || "📁"}</div>
      <div>
        <h4 style={{ margin: 0, color: "var(--text-primary)" }}>{section.name}</h4>
        <small style={{ color: "var(--text-secondary)" }}>
          {section.goal ? `🎯 Meta: $${section.goal.toLocaleString()}` : "Sin meta"}
        </small>
      </div>
    </div>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <UIButton variant="secondary" onClick={onEdit}>
        Editar
      </UIButton>
      <UIButton variant="danger" onClick={onDelete}>
        Eliminar
      </UIButton>
    </div>
  </div>
);

export default SectionItem;
