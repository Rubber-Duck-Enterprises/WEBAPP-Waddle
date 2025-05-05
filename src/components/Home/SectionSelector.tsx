import { Section } from "../../types";
import UIBulletItem from "../UI/UIBulletItem";

interface Props {
  sections: Section[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SectionSelector: React.FC<Props> = ({ sections, selectedId, onSelect }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "1rem 0" }}>
    {sections.map((section) => (
      <UIBulletItem
        key={section.id}
        onClick={() => onSelect(section.id)}
        active={selectedId === section.id}
        color={section.color}
      >
        <span>{section.icon || "📁"}</span>
        {section.name}
      </UIBulletItem>
    ))}
  </div>
);

export default SectionSelector;
