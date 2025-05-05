import React, {useEffect} from "react";
import { isWithinInterval, parseISO } from "date-fns";

import { useSectionStore } from "../stores/sectionStore";
import { useExpenseStore } from "../stores/expenseStore";
import { useDateRange } from "../hooks/useDateRange";
import { useModal } from "../context/ModalContext";
import { getAddGeneralExpenseModal } from "../components/Modal/Presets/AddGeneralExpenseModal";

import DefaultLayout from "../layouts/DefaultLayout";
import DateFilterBar from "../components/Home/DateFilterBar";
import BalanceCard from "../components/Home/BalanceCard";
import SectionSelector from "../components/Home/SectionSelector";
import SectionBalanceCard from "../components/Home/SectionBalanceCard";

const Home: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const { addExpense, expenses } = useExpenseStore();
  const [onlyGeneral, setOnlyGeneral] = React.useState<boolean>(false);

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

  const { sections } = useSectionStore();
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const sectionExpenses = expenses.filter((e) => e.category === selectedSection?.id);

  const allExpensesInRange = expenses.filter((e) => {
    const date = parseISO(e.date);
    const isInRange = isWithinInterval(date, { start: startDate, end: endDate });
    const isGeneral = e.category === "general";
    return isInRange && (!onlyGeneral ? true : isGeneral);
  });

  const income = allExpensesInRange.filter((e) => e.amount > 0).reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = allExpensesInRange.filter((e) => e.amount < 0).reduce((acc, e) => acc + e.amount, 0);
  const balance = income + totalExpenses;
  const latest = [...allExpensesInRange].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const openModal = (type: "income" | "expense") => {
    showModal(
      getAddGeneralExpenseModal({
        type,
        onCancel: hideModal,
        onConfirm: ({ description, amount, notes }) => {
          addExpense({
            description,
            amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
            category: "general",
            date: new Date().toISOString(),
            notes,
          });
          hideModal();
        },
      })
    );
  };

  const openSectionModal = (type: "income" | "expense", sectionId: string) => {
    showModal(
      getAddGeneralExpenseModal({
        type,
        onCancel: hideModal,
        onConfirm: ({ description, amount, notes }) => {
          addExpense({
            description,
            amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
            category: sectionId,
            date: new Date().toISOString(),
            notes,
          });
          hideModal();
        },
      })
    );
  };

  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  return (
    <DefaultLayout>
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

      {sections.length > 0 && (
        <div style={{ padding: "0 1rem", paddingBottom: "1rem" }}>
          <SectionSelector
            sections={sections}
            selectedId={selectedSectionId}
            onSelect={setSelectedSectionId}
          />

          {selectedSection && (
            <SectionBalanceCard 
              section={selectedSection}
              expenses={sectionExpenses}
              onAdd={openSectionModal}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </div>
      )}

    </DefaultLayout>
  );
};

export default Home;
