import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingStore } from "@/stores/shoppingStore";
import { useModal } from "@/context/ModalContext";
import { usePopUp } from "@/context/PopUpContext";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";
import TripCard from "@/components/Shopping/TripCard";

const ITEMS_PER_PAGE = 5;
type RangeType = "todo" | "semana" | "mes";

const ShoppingHome: React.FC = () => {
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const { showPopUp } = usePopUp();
  const { trips, monthlyBudget, setMonthlyBudget, cancelTrip } = useShoppingStore();
  const [page, setPage] = useState(0);
  const [rangeType, setRangeType] = useState<RangeType>("mes");
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget || ""));

  // Calcular fechas del filtro
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (rangeType) {
      case "semana": {
        const day = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        start.setHours(0, 0, 0, 0);
        break;
      }
      case "mes":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "todo":
      default:
        start = new Date(0);
        break;
    }
    return { startDate: start, endDate: end };
  }, [rangeType]);

  // Filtrar trips completados en rango
  const tripsInRange = useMemo(() => {
    return trips.filter((t) => {
      if (t.status !== "completed") return false;
      const date = new Date(t.completedAt || t.createdAt);
      return date >= startDate && date <= endDate;
    });
  }, [trips, startDate, endDate]);

  // Cálculos del resumen
  const usedBudget = tripsInRange.reduce((acc, t) => acc + t.actualTotal, 0);
  const remainingBudget = monthlyBudget - usedBudget;
  const isOverBudget = remainingBudget < 0;
  const exceedAmount = isOverBudget ? Math.abs(remainingBudget) : 0;

  // Ordenar todas las compras: en proceso > planning > completados por fecha
  const sortedTrips = useMemo(() => {
    const statusOrder: Record<string, number> = {
      in_progress: 0,
      planning: 1,
      completed: 2,
      cancelled: 3,
    };
    return [...trips].sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [trips]);

  const paginatedTrips = sortedTrips.slice(0, (page + 1) * ITEMS_PER_PAGE);
  const hasMore = paginatedTrips.length < sortedTrips.length;

  // Guardar presupuesto
  const handleSaveBudget = () => {
    const value = Number(budgetInput) || 0;
    setMonthlyBudget(value);
    setEditingBudget(false);
  };

  const handleCancelTrip = (tripId: string, storeName: string) => {
    showModal(
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: "2rem" }}>🚫</div>
        <h3 style={{ color: "var(--text-primary)" }}>Cancelar compra</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Estás seguro de que quieres cancelar la compra en {storeName}?
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <UIButton variant="default" onClick={hideModal}>Volver</UIButton>
          <UIButton
            variant="danger"
            onClick={() => {
              cancelTrip(tripId);
              hideModal();
              showPopUp("INFO", "Compra cancelada.");
            }}
          >
            Cancelar compra
          </UIButton>
        </div>
      </div>
    );
  };

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", paddingBottom: "5rem" }}>
        {/* Filtro de rango */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["todo", "semana", "mes"] as RangeType[]).map((type) => (
            <button
              key={type}
              onClick={() => setRangeType(type)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "999px",
                border: `1px solid ${rangeType === type ? "var(--btn-primary-bg)" : "var(--border-color)"}`,
                background: rangeType === type ? "var(--success-bg)" : "var(--bullet-bg)",
                color: rangeType === type ? "var(--text-primary)" : "var(--text-primary)",
                fontSize: "0.85rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {type === "todo" ? "Todo" : type === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        {/* Tarjeta de resumen */}
        <div
          style={{
            background: "var(--success-bg)",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.5rem",
            border: "1px solid var(--success-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Resumen
          </h2>

          {/* Monto principal: Total presupuesto - usado */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
            <span
              style={{
                fontSize: "2.2rem",
                fontWeight: "bold",
                color: monthlyBudget === 0
                  ? "var(--text-primary)"
                  : isOverBudget ? "#f44336" : "#4caf50",
              }}
            >
              {monthlyBudget > 0 ? `$${remainingBudget.toLocaleString()}` : "$—"}
            </span>
            {monthlyBudget > 0 && isOverBudget && (
              <span style={{ fontSize: "1rem", color: "#f44336", fontWeight: "bold" }}>
                -${exceedAmount.toLocaleString()}
              </span>
            )}
          </div>

          {monthlyBudget > 0 ? (
            <>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.15rem" }}>
                + Presupuesto total: ${monthlyBudget.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#f44336", marginBottom: "0.75rem" }}>
                - Presupuesto usado: ${usedBudget.toLocaleString()}
              </div>

              {/* Barra gráfica de 3 segmentos */}
              <BudgetBar
                spent={usedBudget}
                budget={monthlyBudget}
                exceed={exceedAmount}
              />
            </>
          ) : (
            <div style={{ marginTop: "0.5rem" }}>
              {editingBudget ? (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <UITextInput
                    type="number"
                    placeholder="Ej: 6000"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    min={0}
                    style={{ flex: 1 }}
                  />
                  <UIButton variant="primary" onClick={handleSaveBudget}>
                    Guardar
                  </UIButton>
                </div>
              ) : (
                <button
                  onClick={() => setEditingBudget(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Configura tu presupuesto mensual para ver el seguimiento.
                </button>
              )}
            </div>
          )}

          {/* Editar presupuesto si ya existe */}
          {monthlyBudget > 0 && (
            <button
              onClick={() => { setEditingBudget(!editingBudget); setBudgetInput(String(monthlyBudget)); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "0.7rem",
                cursor: "pointer",
                marginTop: "0.5rem",
                textDecoration: "underline",
              }}
            >
              {editingBudget ? "Cancelar" : "Editar presupuesto"}
            </button>
          )}
          {monthlyBudget > 0 && editingBudget && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}>
              <UITextInput
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                min={0}
                style={{ flex: 1 }}
              />
              <UIButton variant="primary" onClick={handleSaveBudget} style={{ fontSize: "0.8rem" }}>
                Guardar
              </UIButton>
            </div>
          )}
        </div>

        {/* Compras recientes */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "1rem" }}>
          🛒 Compras recientes
        </h2>

        {sortedTrips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🛍️</p>
            <p>No tienes compras aún.</p>
            <p style={{ fontSize: "0.85rem" }}>Crea tu primera lista de compras.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {paginatedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onAction={() => navigate(`/shopping/trip/${trip.id}`)}
                onEdit={() => navigate(`/shopping/edit/${trip.id}`)}
                onViewDetails={() => navigate(`/shopping/trip/${trip.id}`)}
                onCancel={() => handleCancelTrip(trip.id, trip.store)}
              />
            ))}
            {hasMore && (
              <UIButton
                variant="default"
                fullWidth
                onClick={() => setPage((p) => p + 1)}
              >
                Ver más
              </UIButton>
            )}
          </div>
        )}
      </div>

      {/* FAB: Botón flotante "+ Nueva compra" */}
      <button
        onClick={() => navigate("/shopping/new")}
        style={{
          position: "fixed",
          bottom: "calc(70px + var(--safe-area-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 2rem)",
          maxWidth: "400px",
          padding: "0.85rem",
          borderRadius: "12px",
          border: "none",
          background: "var(--btn-primary-bg)",
          color: "var(--btn-text-color)",
          fontWeight: "bold",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          zIndex: 100,
        }}
      >
        + Nueva compra
      </button>
    </ShoppingLayout>
  );
};

// --- Barra gráfica de presupuesto (Rojo=Gastado, Verde=Disponible, Naranja=Excedente) ---
const BudgetBar: React.FC<{ spent: number; budget: number; exceed: number }> = ({ spent, budget, exceed }) => {
  const total = Math.max(budget, spent);
  const spentPercent = Math.min(100, (Math.min(spent, budget) / total) * 100);
  const availablePercent = spent < budget ? ((budget - spent) / total) * 100 : 0;
  const exceedPercent = exceed > 0 ? (exceed / total) * 100 : 0;

  return (
    <div>
      <div
        style={{
          width: "100%",
          height: "16px",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          background: "var(--progress-bg)",
        }}
      >
        {/* Rojo: Gastado */}
        {spentPercent > 0 && (
          <div style={{ width: `${spentPercent}%`, background: "#f44336", transition: "width 0.3s" }} />
        )}
        {/* Verde: Disponible */}
        {availablePercent > 0 && (
          <div style={{ width: `${availablePercent}%`, background: "#4caf50", transition: "width 0.3s" }} />
        )}
        {/* Naranja: Excedente */}
        {exceedPercent > 0 && (
          <div style={{ width: `${exceedPercent}%`, background: "#ff9800", transition: "width 0.3s" }} />
        )}
      </div>
      {/* Leyenda */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.4rem", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f44336", display: "inline-block" }} />
          Gastado
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#4caf50", display: "inline-block" }} />
          Presupuesto
        </span>
        {exceed > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#ff9800", display: "inline-block" }} />
            Excedente
          </span>
        )}
      </div>
    </div>
  );
};

export default ShoppingHome;
