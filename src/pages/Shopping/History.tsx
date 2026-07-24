import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingStore } from "@/stores/shoppingStore";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIButton from "@/components/UI/UIButton";
import UISelect from "@/components/UI/UISelect";
import type { ShoppingTrip } from "@/types/shopping";

const ITEMS_PER_PAGE = 8;

type FilterStatus = "all" | "completed" | "in_progress" | "planning";

const ShoppingHistory: React.FC = () => {
  const navigate = useNavigate();
  const { trips } = useShoppingStore();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [storeFilter, setStoreFilter] = useState("");

  // Tiendas únicas para el filtro
  const uniqueStores = useMemo(() => {
    const stores = new Set(trips.map((t) => t.store));
    return Array.from(stores);
  }, [trips]);

  // Filtrar y ordenar
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (storeFilter) {
      result = result.filter((t) => t.store === storeFilter);
    }

    // Ordenar por fecha (más reciente primero)
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [trips, statusFilter, storeFilter]);

  const paginatedTrips = filteredTrips.slice(0, (page + 1) * ITEMS_PER_PAGE);
  const hasMore = paginatedTrips.length < filteredTrips.length;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getStatusConfig = (trip: ShoppingTrip) => {
    const balance = trip.estimatedTotal - trip.actualTotal;
    const isPositive = balance >= 0;

    const configs = {
      planning: { text: "Pendiente", color: "#2196f3", borderColor: "#2196f3" },
      in_progress: { text: "En proceso", color: "#ff9800", borderColor: "#ff9800" },
      completed: {
        text: isPositive ? "En el presupuesto" : "Excedente",
        color: isPositive ? "#4caf50" : "#f44336",
        borderColor: isPositive ? "#4caf50" : "#f44336",
      },
    };
    return configs[trip.status];
  };

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "1rem" }}>
          🛒 Registro de compras
        </h2>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <UISelect
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); setPage(0); }}
            style={{ flex: 1 }}
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Compradas</option>
            <option value="in_progress">En proceso</option>
            <option value="planning">Pendientes</option>
          </UISelect>

          <UISelect
            value={storeFilter}
            onChange={(e) => { setStoreFilter(e.target.value); setPage(0); }}
            style={{ flex: 1 }}
          >
            <option value="">Todas las tiendas</option>
            {uniqueStores.map((store) => (
              <option key={store} value={store}>{store}</option>
            ))}
          </UISelect>
        </div>

        {/* Lista de compras */}
        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-secondary)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</p>
            <p>No hay compras que mostrar.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {paginatedTrips.map((trip) => {
              const config = getStatusConfig(trip);
              const balance = trip.estimatedTotal - trip.actualTotal;
              const isPositive = balance >= 0;

              return (
                <div
                  key={trip.id}
                  style={{
                    background: "var(--card-bg)",
                    borderRadius: "12px",
                    padding: "1rem",
                    borderLeft: `4px solid ${config.borderColor}`,
                    border: `1px solid var(--border-color)`,
                    borderLeftColor: config.borderColor,
                    borderLeftWidth: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    navigate(`/shopping/trip/${trip.id}`);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>⚙️</span>
                        <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>
                          {trip.store}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                        {trip.status === "planning" ? "● Pendiente" : formatDate(trip.completedAt || trip.createdAt)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {trip.status === "completed" ? (
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "1.3rem",
                            color: isPositive ? "#4caf50" : "#f44336",
                          }}
                        >
                          {isPositive ? "+" : ""}${Math.abs(balance).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ fontWeight: "bold", fontSize: "1.3rem", color: "var(--text-primary)" }}>
                          ${trip.estimatedTotal.toLocaleString()}
                        </span>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        {trip.status === "completed" ? "Presupuesto" : "Estimado"}
                      </div>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {trip.status === "completed" && (
                      <>
                        Estimado: ${trip.estimatedTotal.toLocaleString()} · Gastado: ${trip.actualTotal.toLocaleString()}
                      </>
                    )}
                    {trip.status !== "completed" && (
                      <>{trip.items.filter((i) => !i.removed).length} producto/s</>
                    )}
                  </div>

                  {/* Estado + acción */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: config.color,
                        fontWeight: "bold",
                      }}
                    >
                      {config.text}
                    </span>
                    {trip.status === "completed" && (
                      <span style={{ fontSize: "0.7rem", color: "#4caf50" }}>● Comprada</span>
                    )}
                    {trip.status !== "completed" && (
                      <UIButton
                        variant="primary"
                        style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/shopping/trip/${trip.id}`);
                        }}
                      >
                        {trip.status === "planning" ? "Comprar" : "Continuar"}
                      </UIButton>
                    )}
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <UIButton variant="default" fullWidth onClick={() => setPage((p) => p + 1)}>
                Ver más
              </UIButton>
            )}
          </div>
        )}
      </div>
    </ShoppingLayout>
  );
};

export default ShoppingHistory;
