import React from "react";
import { Section, Expense } from "@/types";

import StandardSectionCard from "./StandardSectionCard";
import PassiveSectionCard from "./PassiveSectionCard";
import SavingsSectionCard from "./SavingsSectionCard";
import CreditCardSectionCard from "./CreditCardSectionCard";
import DebitCardSectionCard from "./DebitCardSectionCard";
import BothCardSectionCard from "./BothCardSectionCard";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string, mode?: "credit" | "debit") => void;
}

const SectionBalanceCard: React.FC<Props> = (props) => {
  const { section } = props;
  const { type, cardSettings } = section;

  if (type === "passive") {
    return <PassiveSectionCard {...props} />;
  }

  if (type === "savings") {
    return <SavingsSectionCard {...props} />;
  }

  if (type === "card") {
    if (cardSettings?.mode === "credit") {
      return <CreditCardSectionCard {...props} />;
    }

    if (cardSettings?.mode === "debit") {
      return <DebitCardSectionCard {...props} />;
    }

    if (cardSettings?.mode === "both") {
      return <BothCardSectionCard {...props} />;
    }
  }

  // Por defecto: estándar
  return <StandardSectionCard {...props} />;
};

export default SectionBalanceCard;
