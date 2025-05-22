import React, { useEffect, useState } from "react";
import { isWithinInterval, parseISO } from "date-fns";

import { useSectionStore } from "@/stores/sectionStore";
import { useExpenseStore } from "@/stores/expenseStore";
import { useDateRange } from "@/hooks/useDateRange";
import { useModal } from "@/context/ModalContext";
import { getAddIncomeModal } from "@/components/Modal/Presets/Wallet/AddIncomeModal";
import { getAddExpenseModal } from "@/components/Modal/Presets/Wallet/AddExpenseModal";

import DateFilterBar from "@/components/ToolWallet/Home/DateFilterBar";
import BalanceCard from "@/components/ToolWallet/Home/BalanceCard";
import SectionSelector from "@/components/ToolWallet/Home/SectionSelector";
import SectionBalanceCard from "@/components/ToolWallet/SectionCards/SectionBalanceCard";

import WalletLayout from "../../layouts/WalletLayout";

const WalletHome: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const { addExpense, expenses } = useExpenseStore();
  const { sections } = useSectionStore();

  const [onlyGeneral, setOnlyGeneral] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const {
    rangeType,
    setRangeType,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    startDate,
    endDate,
  } = useDateRange();

  const selectedSection = sections.find(
    (s) => s.id === selectedSectionId && s.type !== "card"
  );
  const selectedCard = sections.find(
    (s) => s.id === selectedCardId && s.type === "card"
  );

  const sectionExpenses = selectedSection
    ? expenses.filter(
        (e) => e.category === selectedSection.id || e.source === selectedSection.id
      )
    : [];
  const cardExpenses = selectedCard
    ? expenses.filter(
        (e) => e.category === selectedCard.id || e.source === selectedCard.id
      )
    : [];

  const allExpensesInRange = expenses.filter((e) => {
    const date = parseISO(e.date);
    const isInRange = isWithinInterval(date, { start: startDate, end: endDate });
    const isGeneral = e.category === "general";
    return isInRange && (!onlyGeneral ? true : isGeneral);
  });

  const income = allExpensesInRange
    .filter((e) => e.amount > 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const realExpenses = allExpensesInRange.filter((e) => {
    if (e.amount >= 0) return false;
    return !e.source || e.source !== e.category;
  });

  const totalExpenses = realExpenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = income + totalExpenses;

  const latest = [...allExpensesInRange]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const openModal = (type: "income" | "expense") => {
    const commonProps = {
      sectionId: "general",
      onCancel: hideModal,
    };

    if (type === "income") {
      showModal(
        getAddIncomeModal({
          ...commonProps,
          onConfirm: ({ description, amount, notes, category }) => {
            addExpense({ description, amount, notes, category, date: new Date().toISOString() });
            hideModal();
          },
        })
      );
    } else {
      showModal(
        getAddExpenseModal({
          ...commonProps,
          onConfirm: ({ description, amount, notes, source }) => {
            addExpense({ description, amount, notes, source, category: "general", date: new Date().toISOString() });
            hideModal();
          },
        })
      );
    }
  };

  const openSectionModal = (type: "income" | "expense", sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const needsSource =
      section.type === "passive" || section.cardSettings?.mode === "credit";

    if (type === "income") {
      showModal(
        getAddIncomeModal({
          sectionId,
          onCancel: hideModal,
          onConfirm: ({ description, amount, notes, category }) => {
            addExpense({ description, amount, notes, category, date: new Date().toISOString() });
            hideModal();
          },
        })
      );
    } else {
      showModal(
        getAddExpenseModal({
          sectionId,
          needsSource,
          onCancel: hideModal,
          onConfirm: ({ description, amount, notes, source }) => {
            addExpense({ description, amount, notes, source, category: sectionId, date: new Date().toISOString() });
            hideModal();
          },
        })
      );
    }
  };

  useEffect(() => {
    const defaultSection = sections.find((s) => s.type !== "card");
    const defaultCard = sections.find((s) => s.type === "card");
    if (!selectedSectionId && defaultSection) setSelectedSectionId(defaultSection.id);
    if (!selectedCardId && defaultCard) setSelectedCardId(defaultCard.id);
  }, [sections]);

  return (
    <WalletLayout>
      <DateFilterBar
        rangeType={rangeType}
        setRangeType={setRangeType}
        customStart={customStart}
        customEnd={customEnd}
        setCustomStart={setCustomStart}
        setCustomEnd={setCustomEnd}
      />

      <div style={{ padding: "1rem" }}>
        <BalanceCard
          income={income}
          totalExpenses={totalExpenses}
          balance={balance}
          latest={latest}
          sections={sections}
          onlyGeneral={onlyGeneral}
          expenses={allExpensesInRange}
          setOnlyGeneral={setOnlyGeneral}
          openModal={openModal}
        />
      </div>

      {/* Apartados */}
      <div style={{ padding: "0 1rem", paddingBottom: "2rem" }}>
        {selectedSection && (
          <>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>Apartados</h2>

            <SectionSelector
              sections={sections.filter((s) => s.type !== "card")}
              selectedId={selectedSectionId}
              onSelect={setSelectedSectionId}
            />

            <SectionBalanceCard
              section={selectedSection}
              expenses={sectionExpenses}
              startDate={startDate}
              endDate={endDate}
              onAdd={openSectionModal}
            />
          </>
        )}
      </div>

      {/* Tarjetas */}
      <div style={{ padding: "0 1rem", paddingBottom: "2rem" }}>
        {selectedCard && (
          <>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>Tarjetas</h2>

            <SectionSelector
              sections={sections.filter((s) => s.type === "card")}
              selectedId={selectedCardId}
              onSelect={setSelectedCardId}
            />

            <SectionBalanceCard
              section={selectedCard}
              expenses={cardExpenses}
              startDate={startDate}
              endDate={endDate}
              onAdd={openSectionModal}
            />
          </>
        )}
      </div>
    </WalletLayout>
  );
};

export default WalletHome;
