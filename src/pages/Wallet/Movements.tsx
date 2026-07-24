import React, { useMemo, useState, useCallback, useRef } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Expense } from "@/types";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import { useWalletStore } from "@/stores/walletStore";
import MovementItem from "@/components/ToolWallet/Movements/MovementItem";
import TransferItem from "@/components/ToolWallet/Movements/TransferItem";
import EditExpenseModal from "@/components/Modal/Presets/Wallet/EditExpenseModal";
import UIBulletItem from "@/components/UI/UIBulletItem";

import WalletLayout from "@/layouts/WalletLayout";
import styles from "@/components/ToolWallet/Movements/Movements.module.css";

const UNDO_DELAY_MS = 4500;

type FilterType = "all" | "income" | "expense" | "transfer";

/** Elemento aplanado para la lista virtualizada */
type FlatRow =
  | { type: "header"; label: string; key: string }
  | { type: "expense"; expense: Expense; key: string }
  | { type: "transfer"; expense: Expense; pair: Expense | undefined; key: string };

const Movements: React.FC = () => {
  const { sections, expenses, deleteExpense, updateExpense } = useWalletStore();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterSectionId, setFilterSectionId] = useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isTransfer = (expense: Expense): boolean => {
    if (expense.transferId) return true;
    return (
      expense.description.startsWith("Transferencia a ") ||
      expense.description.startsWith("Transferencia desde ")
    );
  };

  const findTransferPair = useCallback((expense: Expense): Expense | undefined => {
    if (expense.transferId) {
      return expenses.find(
        (e) => e.transferId === expense.transferId && e.id !== expense.id
      );
    }
    return expenses.find(
      (e) =>
        e.notes === expense.notes &&
        e.id !== expense.id &&
        isTransfer(e)
    );
  }, [expenses]);

  // Filtrar movimientos
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (pendingDeleteIds.size > 0) {
      result = result.filter((e) => !pendingDeleteIds.has(e.id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          (e.notes && e.notes.toLowerCase().includes(query))
      );
    }

    if (filterType === "income") {
      result = result.filter((e) => e.amount > 0 && !isTransfer(e));
    } else if (filterType === "expense") {
      result = result.filter((e) => e.amount < 0 && !isTransfer(e));
    } else if (filterType === "transfer") {
      result = result.filter((e) => isTransfer(e));
    }

    if (filterSectionId) {
      result = result.filter(
        (e) => e.category === filterSectionId || e.source === filterSectionId
      );
    }

    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [expenses, searchQuery, filterType, filterSectionId, pendingDeleteIds]);

  // Aplanar en rows virtualizables (headers + items)
  const flatRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = [];
    const renderedTransfers = new Set<string>();
    let currentLabel = "";

    for (const expense of filteredExpenses) {
      // Determinar el label de fecha
      const date = parseISO(expense.date);
      let label: string;
      if (isToday(date)) {
        label = "Hoy";
      } else if (isYesterday(date)) {
        label = "Ayer";
      } else {
        label = format(date, "d 'de' MMMM, yyyy", { locale: es });
      }

      // Insertar header si cambió la fecha
      if (label !== currentLabel) {
        currentLabel = label;
        rows.push({ type: "header", label, key: `header-${label}` });
      }

      // Manejar transferencias (agrupar pares)
      if (isTransfer(expense)) {
        const groupKey = expense.transferId || expense.notes || expense.id;
        if (renderedTransfers.has(groupKey)) continue;
        renderedTransfers.add(groupKey);

        const pair = findTransferPair(expense);
        rows.push({ type: "transfer", expense, pair, key: `transfer-${groupKey}` });
      } else {
        rows.push({ type: "expense", expense, key: `expense-${expense.id}` });
      }
    }

    return rows;
  }, [filteredExpenses, findTransferPair]);

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const row = flatRows[index];
      if (row.type === "header") return 36;
      if (row.type === "transfer") return 130;
      return 120;
    },
    overscan: 5,
  });

  // Handlers
  const handleDelete = useCallback((id: string) => {
    setPendingDeleteIds((prev) => new Set(prev).add(id));

    const timer = setTimeout(() => {
      deleteExpense(id);
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, UNDO_DELAY_MS);

    showPopUp("DANGER", "Movimiento eliminado", {
      label: "Deshacer",
      onClick: () => {
        clearTimeout(timer);
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  }, [deleteExpense, showPopUp]);

  const handleDeleteTransfer = useCallback((expense: Expense) => {
    const pair = findTransferPair(expense);
    const ids = [expense.id, ...(pair ? [pair.id] : [])];

    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    const timer = setTimeout(() => {
      ids.forEach((id) => deleteExpense(id));
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, UNDO_DELAY_MS);

    showPopUp("DANGER", "Transferencia eliminada", {
      label: "Deshacer",
      onClick: () => {
        clearTimeout(timer);
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      },
    });
  }, [deleteExpense, showPopUp, findTransferPair]);

  const handleEdit = useCallback((expenseToEdit: Expense) => {
    showModal(
      <EditExpenseModal
        expense={expenseToEdit}
        sections={sections}
        onCancel={hideModal}
        onConfirm={(updatedData) => {
          updateExpense(expenseToEdit.id, updatedData);
          hideModal();
        }}
      />
    );
  }, [showModal, hideModal, sections, updateExpense]);

  // Render de un row virtualizado
  const renderRow = (row: FlatRow) => {
    if (row.type === "header") {
      return <div className={styles.dateGroupHeader}>{row.label}</div>;
    }

    if (row.type === "transfer") {
      const { expense, pair } = row;
      const from = expense.amount < 0 ? expense : (pair || expense);
      const to = expense.amount > 0 ? expense : (pair || expense);

      const fromLabel = from.category === "general"
        ? "General"
        : `${sections.find(s => s.id === from.category)?.icon || "📁"} ${sections.find(s => s.id === from.category)?.name || "Desconocido"}`;

      const toLabel = to.category === "general"
        ? "General"
        : `${sections.find(s => s.id === to.category)?.icon || "📁"} ${sections.find(s => s.id === to.category)?.name || "Desconocido"}`;

      return (
        <TransferItem
          amount={Math.abs(expense.amount)}
          fromLabel={fromLabel}
          toLabel={toLabel}
          date={expense.date}
          notes={expense.notes}
          onDelete={() => handleDeleteTransfer(expense)}
        />
      );
    }

    // type === "expense"
    const section = sections.find((s) => s.id === row.expense.category);
    return (
      <MovementItem
        expense={row.expense}
        section={section}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    );
  };

  return (
    <WalletLayout>
      <div className={styles.container}>
        {/* Barra de búsqueda y filtros */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar movimientos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar movimientos"
          />

          <div className={styles.filters}>
            {(["all", "income", "expense", "transfer"] as const).map((type) => (
              <UIBulletItem
                key={type}
                onClick={() => setFilterType(type)}
                active={filterType === type}
                color="#ffcd00"
              >
                {type === "all" && "Todos"}
                {type === "income" && "Ingresos"}
                {type === "expense" && "Gastos"}
                {type === "transfer" && "Transferencias"}
              </UIBulletItem>
            ))}
          </div>

          {sections.length > 0 && (
            <div className={styles.filters}>
              <UIBulletItem
                onClick={() => setFilterSectionId(null)}
                active={!filterSectionId}
                color="#ffcd00"
              >
                Todas
              </UIBulletItem>
              {sections.map((s) => (
                <UIBulletItem
                  key={s.id}
                  onClick={() => setFilterSectionId(s.id)}
                  active={filterSectionId === s.id}
                  color={s.color}
                >
                  {s.icon || "📁"} {s.name}
                </UIBulletItem>
              ))}
            </div>
          )}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🧾</span>
            <p className={styles.emptyTitle}>
              {expenses.length === 0 ? "Sin movimientos" : "Sin resultados"}
            </p>
            <p className={styles.emptySubtitle}>
              {expenses.length === 0
                ? "Agrega ingresos o gastos desde el inicio para verlos aquí."
                : "Intenta con otros filtros o términos de búsqueda."}
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className={styles.virtualContainer}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = flatRows[virtualRow.index];
                return (
                  <div
                    key={row.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderRow(row)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </WalletLayout>
  );
};

export default Movements;
