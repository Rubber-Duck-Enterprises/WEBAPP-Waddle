import React, { useEffect, useState, useRef } from "react";

import { useWalletStore } from "@/stores/walletStore";
import { useDateRange } from "@/hooks/useDateRange";
import { useWalletSummary } from "@/hooks/useWalletSummary";
import { useExpensesBySection } from "@/hooks/useExpensesBySection";
import { useModal } from "@/context/ModalContext";
import { getAddIncomeModal } from "@/components/Modal/Presets/Wallet/AddIncomeModal";
import { getAddExpenseModal } from "@/components/Modal/Presets/Wallet/AddExpenseModal";

import DateFilterBar from "@/components/ToolWallet/Home/DateFilterBar";
import BalanceCard from "@/components/ToolWallet/Home/BalanceCard";
import WalletChart from "@/components/ToolWallet/Home/WalletChart";
import SectionSelector from "@/components/ToolWallet/Home/SectionSelector";
import SectionBalanceCard from "@/components/ToolWallet/SectionCards/SectionBalanceCard";

import WalletLayout from "../../layouts/WalletLayout";

const WalletHome: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const {
    sections, 
    hasFirstWallet, 
    expenses,
    setFirstWalletWasCreated,
    addSection,
    addExpense,
  } = useWalletStore();
  const initializedRef = useRef(false);

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

  // Usar el hook extraído para el cálculo del resumen
  const { income, totalExpenses, balance, latest } = useWalletSummary(expenses, startDate, endDate);

  // Pre-indexar expenses por sección para evitar O(n) lookups por cada card
  const expensesBySection = useExpensesBySection(expenses);

  const selectedSection = sections.find(
    (s) => s.id === selectedSectionId && s.type !== "card"
  );
  const selectedCard = sections.find(
    (s) => s.id === selectedCardId && s.type === "card"
  );

  const sectionExpenses = selectedSection
    ? expensesBySection.get(selectedSection.id) || []
    : [];
  const cardExpenses = selectedCard
    ? expensesBySection.get(selectedCard.id) || []
    : [];

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

  // Auto-selección de sección/tarjeta cuando cambian las secciones
  useEffect(() => {
    const defaultSection = sections.find((s) => s.type !== "card");
    const defaultCard = sections.find((s) => s.type === "card");

    // Verificar si la sección seleccionada aún existe
    if (selectedSectionId && !sections.find((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(defaultSection?.id ?? null);
    } else if (!selectedSectionId && defaultSection) {
      setSelectedSectionId(defaultSection.id);
    }

    if (selectedCardId && !sections.find((s) => s.id === selectedCardId)) {
      setSelectedCardId(defaultCard?.id ?? null);
    } else if (!selectedCardId && defaultCard) {
      setSelectedCardId(defaultCard.id);
    }
  }, [sections, selectedSectionId, selectedCardId]);

  // Auto-crear "Efectivo" en primera visita
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (hasFirstWallet || sections.length > 0) return;

    addSection({ 
      name: "Efectivo", 
      goal: null, 
      color: "#4caf50", 
      icon: "💵", 
      type: "standard", 
      cardSettings: undefined
    });

    setFirstWalletWasCreated();
  }, []);

  const nonCardSections = sections.filter((s) => s.type !== "card");
  const cardSections = sections.filter((s) => s.type === "card");

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

      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <BalanceCard
          income={income}
          totalExpenses={totalExpenses}
          balance={balance}
          latest={latest}
          sections={sections}
        />

        <WalletChart expenses={expenses} />
      </div>

      {/* Apartados */}
      {nonCardSections.length > 0 && selectedSection && (
        <div style={{ padding: "0 1rem", paddingBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>Apartados</h2>

          <SectionSelector
            sections={nonCardSections}
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
        </div>
      )}

      {/* Empty state para apartados */}
      {nonCardSections.length === 0 && (
        <div style={{
          padding: "2rem 1rem",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}>
          <span style={{ fontSize: "2rem" }}>📁</span>
          <p style={{ marginTop: "0.5rem", fontWeight: 600 }}>Sin apartados</p>
          <p style={{ fontSize: "0.85rem" }}>
            Crea tu primer apartado desde la sección de Apartados.
          </p>
        </div>
      )}

      {/* Tarjetas */}
      {cardSections.length > 0 && selectedCard && (
        <div style={{ padding: "0 1rem", paddingBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>Tarjetas</h2>

          <SectionSelector
            sections={cardSections}
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
        </div>
      )}
    </WalletLayout>
  );
};

export default WalletHome;
