import React from "react";
import { Section, Expense } from "@/types";
import { useSectionFinancials } from "@/hooks/useSectionFinancials";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";
import TransactionList from "@/components/ToolWallet/Home/TransactionList";
import UIButton from "@/components/UI/UIButton";
import SectionCardContainer from "./SectionCardContainer";
import styles from "./SectionCards.module.css";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string) => void;
}

const PassiveSectionCard: React.FC<Props> = ({
  section,
  expenses,
  startDate,
  endDate,
  onAdd,
}) => {

  const { balance, latest } = useSectionFinancials({ section, expenses, startDate, endDate });

  return (
    <SectionCardContainer section={section}>
      <h2>
        {section.icon || "📁"} {section.name}
      </h2>

      <UIBalanceAmount amount={balance} />
      <TransactionList latest={latest} sections={[]} />

      <div className={styles.actions}>
        <UIButton variant="danger" fullWidth onClick={() => onAdd("expense", section.id)}>
          - Gasto
        </UIButton>
      </div>
    </SectionCardContainer>
  );
};

export default PassiveSectionCard;
