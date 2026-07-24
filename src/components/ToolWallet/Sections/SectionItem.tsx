import React from "react";
import UIButton from "@/components/UI/UIButton";
import { Section } from "@/types";
import styles from "./Sections.module.css";

interface Props {
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
}

const SectionItem: React.FC<Props> = React.memo(({ section, onEdit, onDelete }) => (
  <div
    className={styles.sectionItem}
    style={{
      background: `${section.color || "var(--surface)"}1A`,
      border: `1px solid ${section.color || "#ccc"}`,
      borderLeft: `16px solid ${section.color || "#ccc"}`,
    }}
  >
    <div className={styles.sectionItemContent}>
      <div className={styles.sectionItemIcon}>{section.icon || "📁"}</div>
      <div>
        <h4 className={styles.sectionItemName}>{section.name}</h4>
        {section.goal && section.goal > 0 && (
          <small className={styles.sectionItemGoal}>
            🎯 Meta: ${section.goal.toLocaleString()}
          </small>
        )}
      </div>
    </div>
    <div className={styles.sectionItemActions}>
      <UIButton variant="secondary" onClick={onEdit}>
        Editar
      </UIButton>
      <UIButton variant="danger" onClick={onDelete}>
        Eliminar
      </UIButton>
    </div>
  </div>
));

SectionItem.displayName = "SectionItem";

export default SectionItem;
