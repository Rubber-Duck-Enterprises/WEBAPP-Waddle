import React from "react";
import { parseISO, isWithinInterval, differenceInCalendarDays } from "date-fns";
import { Section, Expense } from "@/types";

import UICreditInfoSummary from "@/components/UI/UICreditInfoSummary";
import TransactionList from "@/components/ToolWallet/Home/TransactionList";
import UIButton from "@/components/UI/UIButton";

import { useModal } from "@/context/ModalContext";
import { useExpenseStore } from "@/stores/expenseStore";
import { useSectionStore } from "@/stores/sectionStore";
import { getPayCreditCardModal } from "@/components/Modal/Presets/Wallet/PayCreditCardModal";
import { getAddCreditCardExpenseModal } from "@/components/Modal/Presets/Wallet/AddCreditCardExpenseModal";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
}

const CreditCardSectionCard: React.FC<Props> = ({
  section,
  expenses,
  startDate,
  endDate,
}) => {
  const creditLimit = section.cardSettings?.creditLimit || 0;
  const cutoffDay = Number(section.cardSettings?.cutoffDate) || 1;
  const paymentDay = Number(section.cardSettings?.paymentDate) || 10;

  const { showModal, hideModal } = useModal();
  const { addExpense } = useExpenseStore();
  const { sections } = useSectionStore();

  const today = new Date();
  const cutoffDate = new Date(today.getFullYear(), today.getMonth(), cutoffDay);
  const paymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);

  const cutoffDays = differenceInCalendarDays(cutoffDate, today);
  const paymentDays = differenceInCalendarDays(paymentDate, today);

  const filteredExpenses = expenses.filter((e) => {
    const date = parseISO(e.date);
    return isWithinInterval(date, { start: startDate, end: endDate }) &&
      (e.category === section.id || e.source === section.id);
  });

  const creditUsed = filteredExpenses
  .filter((e) => e.category === section.id && (e.kind === "debt" || e.kind === "payment"))
  .reduce((acc, e) => {
    const value = e.kind === "debt"
      ? Math.abs(e.amount)
      : -Math.abs(e.amount);
    return acc + value;
  }, 0);

  const available = Math.max(creditLimit - creditUsed, 0);

  const handlePayCreditCard = () => {
    showModal(
      getPayCreditCardModal({
        section,
        onCancel: hideModal,
        onConfirm: ({ sourceId, amount, notes }) => {
          const now = new Date().toISOString();
          const source = sections.find((s) => s.id === sourceId);

          addExpense({
            description: `Pago a tarjeta ${section.name}`,
            amount: -Math.abs(amount),
            category: sourceId,
            kind: "payment",
            notes,
            date: now,
          });

          addExpense({
            description: `Pago desde ${source?.name}`,
            amount: Math.abs(amount),
            category: section.id,
            kind: "payment",
            notes,
            date: now,
          });

          hideModal();
        },
      })
    );
  };

  const handleAddExpense = () => {
    showModal(
      getAddCreditCardExpenseModal({
        section,
        available,
        onCancel: hideModal,
        onConfirm: ({ amount, description, notes }) => {
          addExpense({
            description,
            amount: -Math.abs(amount),
            category: section.id,
            notes,
            kind: "debt",
            date: new Date().toISOString(),
          });
          hideModal();
        },
      })
    );
  };

  return (
    <div
      style={{
        background: `${section.color || "var(--surface)"}1A`,
        borderRadius: "12px",
        padding: "1rem",
        border: `1px solid ${section.color || "var(--border-color)"}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h2>{section.icon || "💳"} {section.name}</h2>

      <UICreditInfoSummary
        amount={available}
        used={creditUsed}
        limit={creditLimit}
        cutoffDays={cutoffDays < 0 ? 30 + cutoffDays : cutoffDays}
        paymentDays={paymentDays < 0 ? 30 + paymentDays : paymentDays}
      />
      <TransactionList
        latest={filteredExpenses
          .filter((e) => e.kind === "debt" || e.kind === "payment")
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 3)}
        sections={sections}
      />

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            width: "100%",
          }}
        >
          <UIButton variant="danger" fullWidth onClick={handleAddExpense}>
            - Gasto
          </UIButton>
          <UIButton variant="primary" fullWidth onClick={handlePayCreditCard}>
            Pagar tarjeta
          </UIButton>
        </div>
      </div>
    </div>
  );
};

export default CreditCardSectionCard;
