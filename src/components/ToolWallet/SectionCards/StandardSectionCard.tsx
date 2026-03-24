import React from "react";
import { Section, Expense } from "@/types";
import { useSectionFinancials } from "@/hooks/useSectionFinancials";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "@/components/UI/UIIncomeExpenseSummary";
import UIProgressBar from "@/components/UI/UIProgressBar";
import UIButton from "@/components/UI/UIButton";
import TransactionList from "@/components/ToolWallet/Home/TransactionList";
import { getTransferFundsModal } from "@/components/Modal/Presets/Wallet/TransferFundsModal";
import { createTransferExpenses, createAdjustBalanceHandler } from "@/utils/walletUtils";

import { useModal } from "@/context/ModalContext";
import { useWalletStore } from "@/stores/walletStore";
import SectionCardContainer from "./SectionCardContainer";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string) => void;
}

const StandardSectionCard: React.FC<Props> = ({
  section,
  expenses,
  startDate,
  endDate,
  onAdd,
}) => {
  const { showModal, hideModal } = useModal();
  const { sections, addExpense } = useWalletStore();

  const { income, totalExpenses, balance, goal, progress, latest } = useSectionFinancials({
    section,
    expenses,
    startDate,
    endDate,
  });

  const handleAdjust = createAdjustBalanceHandler({ balance, sectionId: section.id, addExpense, showModal, hideModal });

  return (
    <SectionCardContainer section={section}>
      <h2>
        {section.icon || "📁"} {section.name}
      </h2>

      {goal && goal > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Progreso</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
              ${balance.toLocaleString()} / ${goal.toLocaleString()}
            </span>
          </div>
          <UIProgressBar value={progress} max={100} />
        </>
      )}

      <UIBalanceAmount amount={balance} />
      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />
      <TransactionList latest={latest} sections={[]} />

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            width: "100%",
          }}
        >
          <UIButton variant="primary" fullWidth onClick={() => onAdd("income", section.id)}>
            + Ingreso
          </UIButton>
          <UIButton variant="danger" fullWidth onClick={() => onAdd("expense", section.id)}>
            - Gasto
          </UIButton>
        </div>
        <UIButton
          variant="secondary"
          fullWidth
          onClick={() =>
            showModal(
              getTransferFundsModal({
                fromSection: section,
                onCancel: hideModal,
                onConfirm: ({ toId, amount, notes }) => {
                  const toSection = sections.find((s) => s.id === toId);
                  if (toSection) {
                    createTransferExpenses(section, toSection, amount, notes ?? "", addExpense);
                  }
                  hideModal();
                },
              })
            )
          }
        >
          Transferir
        </UIButton>
        <UIButton variant="default" fullWidth onClick={handleAdjust}>
          Ajustar balance
        </UIButton>
      </div>
    </SectionCardContainer>
  );
};

export default StandardSectionCard;
