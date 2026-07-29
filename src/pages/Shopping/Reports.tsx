import React, { useMemo } from "react";
import { useShoppingStore } from "@/stores/shoppingStore";
import ShoppingLayout from "@/layouts/ShoppingLayout";
import UIProgressBar from "@/components/UI/UIProgressBar";

const ShoppingReports: React.FC = () => {
  const { trips } = useShoppingStore();

  const completedTrips = useMemo(
    () => trips.filter((t) => t.status === "completed"),
    [trips]
  );

  // --- Métricas generales ---
  const totalSpent = completedTrips.reduce((acc, t) => acc + t.actualTotal, 0);
  const totalEstimated = completedTrips.reduce((acc, t) => acc + t.estimatedTotal, 0);
  const totalSaved = totalEstimated - totalSpent;
  const avgPerTrip = completedTrips.length > 0 ? totalSpent / completedTrips.length : 0;

  // --- Gasto por tienda ---
  const spendByStore = useMemo(() => {
    const map: Record<string, { spent: number; estimated: number; count: number }> = {};
    completedTrips.forEach((trip) => {
      if (!map[trip.store]) {
        map[trip.store] = { spent: 0, estimated: 0, count: 0 };
      }
      map[trip.store].spent += trip.actualTotal;
      map[trip.store].estimated += trip.estimatedTotal;
      map[trip.store].count += 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.spent - a.spent);
  }, [completedTrips]);

  // --- Gasto por categoría (de items) ---
  const spendByCategory = useMemo(() => {
    const map: Record<string, { spent: number; items: number }> = {};
    completedTrips.forEach((trip) => {
      trip.items
        .filter((i) => i.inCart && !i.removed)
        .forEach((item) => {
          const cat = item.category || "Sin categoría";
          if (!map[cat]) map[cat] = { spent: 0, items: 0 };
          map[cat].spent += (item.actualPrice ?? item.estimatedPrice) * item.quantity;
          map[cat].items += item.quantity;
        });
    });
    return Object.entries(map).sort(([, a], [, b]) => b.spent - a.spent);
  }, [completedTrips]);

  // --- Tendencia mensual (últimos 6 meses) ---
  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    completedTrips.forEach((trip) => {
      const month = (trip.completedAt || trip.createdAt).slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + trip.actualTotal;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [completedTrips]);

  // --- Productos más comprados ---
  const topProducts = useMemo(() => {
    const map: Record<string, { count: number; totalSpent: number; avgPrice: number }> = {};
    completedTrips.forEach((trip) => {
      trip.items
        .filter((i) => i.inCart && !i.removed)
        .forEach((item) => {
          if (!map[item.name]) map[item.name] = { count: 0, totalSpent: 0, avgPrice: 0 };
          map[item.name].count += item.quantity;
          map[item.name].totalSpent += (item.actualPrice ?? item.estimatedPrice) * item.quantity;
        });
    });
    // Calcular precio promedio
    Object.values(map).forEach((v) => {
      v.avgPrice = v.count > 0 ? v.totalSpent / v.count : 0;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10);
  }, [completedTrips]);

  // --- Precisión de estimación ---
  const estimationAccuracy = useMemo(() => {
    if (completedTrips.length === 0) return 0;
    const accuracies = completedTrips.map((t) => {
      if (t.estimatedTotal === 0) return 100;
      const diff = Math.abs(t.estimatedTotal - t.actualTotal);
      return Math.max(0, 100 - (diff / t.estimatedTotal) * 100);
    });
    return accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  }, [completedTrips]);

  const maxStoreSpend = spendByStore.length > 0 ? spendByStore[0][1].spent : 1;
  const maxCategorySpend = spendByCategory.length > 0 ? spendByCategory[0][1].spent : 1;
  const maxMonthly = monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map(([, v]) => v)) : 1;

  // --- Tiempos de compra ---
  const tripsWithDuration = useMemo(
    () => completedTrips.filter((t) => t.durationMinutes !== undefined && t.durationMinutes > 0),
    [completedTrips]
  );

  const avgDuration = tripsWithDuration.length > 0
    ? tripsWithDuration.reduce((acc, t) => acc + t.durationMinutes!, 0) / tripsWithDuration.length
    : 0;

  const avgDurationByStore = useMemo(() => {
    const map: Record<string, { totalMinutes: number; count: number }> = {};
    tripsWithDuration.forEach((trip) => {
      if (!map[trip.store]) map[trip.store] = { totalMinutes: 0, count: 0 };
      map[trip.store].totalMinutes += trip.durationMinutes!;
      map[trip.store].count += 1;
    });
    return Object.entries(map)
      .map(([store, data]) => ({ store, avg: data.totalMinutes / data.count }))
      .sort((a, b) => a.avg - b.avg);
  }, [tripsWithDuration]);

  const avgItemsPerMinute = useMemo(() => {
    if (tripsWithDuration.length === 0) return 0;
    const totalItems = tripsWithDuration.reduce(
      (acc, t) => acc + t.items.filter((i) => i.inCart && !i.removed).length,
      0
    );
    const totalMinutes = tripsWithDuration.reduce((acc, t) => acc + t.durationMinutes!, 0);
    return totalMinutes > 0 ? totalItems / totalMinutes : 0;
  }, [tripsWithDuration]);

  // --- Productos por tienda ---
  const avgProductsByStore = useMemo(() => {
    const map: Record<string, { totalItems: number; count: number }> = {};
    completedTrips.forEach((trip) => {
      if (!map[trip.store]) map[trip.store] = { totalItems: 0, count: 0 };
      map[trip.store].totalItems += trip.items.filter((i) => i.inCart && !i.removed).length;
      map[trip.store].count += 1;
    });
    return Object.entries(map)
      .map(([store, data]) => ({ store, avg: data.totalItems / data.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [completedTrips]);

  // --- Compras de más por tienda (items agregados con "¿Algo más?") ---
  const impulseByStore = useMemo(() => {
    const map: Record<string, { impulseItems: number; impulseSpent: number; tripCount: number }> = {};
    completedTrips.forEach((trip) => {
      const impulse = trip.items.filter((i) => i.addedDuringTrip && i.inCart && !i.removed);
      if (!map[trip.store]) map[trip.store] = { impulseItems: 0, impulseSpent: 0, tripCount: 0 };
      map[trip.store].impulseItems += impulse.length;
      map[trip.store].impulseSpent += impulse.reduce((acc, i) => acc + (i.actualPrice ?? i.estimatedPrice) * i.quantity, 0);
      map[trip.store].tripCount += 1;
    });
    return Object.entries(map)
      .filter(([, data]) => data.impulseItems > 0)
      .map(([store, data]) => ({
        store,
        totalItems: data.impulseItems,
        totalSpent: data.impulseSpent,
        avgPerTrip: data.impulseItems / data.tripCount,
      }))
      .sort((a, b) => b.totalItems - a.totalItems);
  }, [completedTrips]);

  const totalImpulseItems = impulseByStore.reduce((acc, s) => acc + s.totalItems, 0);
  const totalImpulseSpent = impulseByStore.reduce((acc, s) => acc + s.totalSpent, 0);

  // --- Precisión del presupuesto (qué tan cerca estamos del gasto real) ---
  const budgetAnalysis = useMemo(() => {
    const tripsWithBudget = completedTrips.filter((t) => t.budget > 0);
    if (tripsWithBudget.length === 0) return null;

    const diffs = tripsWithBudget.map((t) => {
      const diff = t.budget - t.actualTotal;
      const percentDiff = (diff / t.budget) * 100;
      return { diff, percentDiff, overBudget: diff < 0 };
    });

    const avgPercentDiff = diffs.reduce((acc, d) => acc + d.percentDiff, 0) / diffs.length;
    const overBudgetCount = diffs.filter((d) => d.overBudget).length;
    const underBudgetCount = diffs.filter((d) => !d.overBudget).length;
    const avgAbsPercent = diffs.reduce((acc, d) => acc + Math.abs(d.percentDiff), 0) / diffs.length;

    // Determinar diagnóstico
    let diagnosis: "ideal" | "excedente_frecuente" | "presupuesto_alto" = "ideal";
    if (avgAbsPercent <= 15) {
      diagnosis = "ideal";
    } else if (avgPercentDiff < -5) {
      diagnosis = "excedente_frecuente"; // Se pasa del presupuesto
    } else if (avgPercentDiff > 15) {
      diagnosis = "presupuesto_alto"; // Presupuesta de más
    }

    return {
      avgPercentDiff,
      avgAbsPercent,
      overBudgetCount,
      underBudgetCount,
      total: tripsWithBudget.length,
      diagnosis,
    };
  }, [completedTrips]);

  // --- Top tiendas donde tardas más ---
  const slowestStores = useMemo(() => {
    return [...avgDurationByStore].sort((a, b) => b.avg - a.avg);
  }, [avgDurationByStore]);

  if (completedTrips.length === 0) {
    return (
      <ShoppingLayout>
        <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📊</p>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>Sin datos aún</h2>
          <p>Completa tu primera compra para ver reportes y análisis de tus gastos.</p>
        </div>
      </ShoppingLayout>
    );
  }

  return (
    <ShoppingLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)" }}>
          📊 Reportes
        </h2>

        {/* Resumen general */}
        <div
          style={{
            background: "var(--success-bg)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--success-color)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Resumen general
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <MetricCard label="Total gastado" value={`$${totalSpent.toLocaleString()}`} color="#f44336" />
            <MetricCard label="Total estimado" value={`$${totalEstimated.toLocaleString()}`} color="var(--text-primary)" />
            <MetricCard
              label={totalSaved >= 0 ? "Ahorro total" : "Excedente total"}
              value={`${totalSaved >= 0 ? "+" : ""}$${Math.abs(totalSaved).toLocaleString()}`}
              color={totalSaved >= 0 ? "#4caf50" : "#f44336"}
            />
            <MetricCard label="Promedio por compra" value={`$${Math.round(avgPerTrip).toLocaleString()}`} color="var(--text-primary)" />
            <MetricCard label="Compras realizadas" value={String(completedTrips.length)} color="var(--text-primary)" />
            <MetricCard label="Precisión estimación" value={`${Math.round(estimationAccuracy)}%`} color={estimationAccuracy > 80 ? "#4caf50" : "#ff9800"} />
          </div>
        </div>

        {/* Precisión del presupuesto */}
        {budgetAnalysis && (
          <div
            style={{
              background: budgetAnalysis.diagnosis === "ideal" ? "#4caf501A"
                : budgetAnalysis.diagnosis === "excedente_frecuente" ? "#f443361A"
                : "#ff98001A",
              borderRadius: "12px",
              padding: "1rem",
              border: `1px solid ${
                budgetAnalysis.diagnosis === "ideal" ? "#4caf50"
                  : budgetAnalysis.diagnosis === "excedente_frecuente" ? "#f44336"
                  : "#ff9800"
              }`,
            }}
          >
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              🎯 Precisión de presupuesto
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <MetricCard
                label="Desviación promedio"
                value={`${Math.round(budgetAnalysis.avgAbsPercent)}%`}
                color={budgetAnalysis.avgAbsPercent <= 15 ? "#4caf50" : budgetAnalysis.avgAbsPercent <= 30 ? "#ff9800" : "#f44336"}
              />
              <MetricCard
                label="Tendencia"
                value={budgetAnalysis.avgPercentDiff > 0 ? `+${Math.round(budgetAnalysis.avgPercentDiff)}% sobra` : `${Math.round(budgetAnalysis.avgPercentDiff)}% falta`}
                color={budgetAnalysis.avgPercentDiff > 0 ? "#ff9800" : "#f44336"}
              />
              <MetricCard
                label="Veces sobre presupuesto"
                value={`${budgetAnalysis.overBudgetCount}/${budgetAnalysis.total}`}
                color="#f44336"
              />
              <MetricCard
                label="Veces bajo presupuesto"
                value={`${budgetAnalysis.underBudgetCount}/${budgetAnalysis.total}`}
                color="#4caf50"
              />
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-primary)",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                background: "var(--bullet-bg)",
                border: "1px solid var(--border-color)",
              }}
            >
              {budgetAnalysis.diagnosis === "ideal" && (
                <span>✅ Tus presupuestos son bastante precisos. Sigue así.</span>
              )}
              {budgetAnalysis.diagnosis === "excedente_frecuente" && (
                <span>⚠️ Sueles gastar más de lo presupuestado. Esto puede significar que los precios subieron o que presupuestas muy ajustado. Intenta agregar un 10-15% de margen.</span>
              )}
              {budgetAnalysis.diagnosis === "presupuesto_alto" && (
                <span>💡 Tus presupuestos suelen sobrar bastante. Podrías ajustarlos a la baja para tener un control más real de tus finanzas.</span>
              )}
            </div>
          </div>
        )}

        {/* Gasto por tienda */}
        <div
          style={{
            background: "#2196f31A",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid #2196f3",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            💰 Gasto por tienda
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {spendByStore.map(([store, data]) => (
              <div key={store}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    🏬 {store} ({data.count} compras)
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                    ${data.spent.toLocaleString()}
                  </span>
                </div>
                <UIProgressBar value={data.spent} max={maxStoreSpend} color="#2196f3" />
              </div>
            ))}
          </div>
        </div>

        {/* Gasto por categoría */}
        <div
          style={{
            background: "#9c27b01A",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid #9c27b0",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            🏷️ Gasto por categoría
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {spendByCategory.map(([category, data]) => (
              <div key={category}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    {category} ({data.items} items)
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                    ${data.spent.toLocaleString()}
                  </span>
                </div>
                <UIProgressBar value={data.spent} max={maxCategorySpend} color="#9c27b0" />
              </div>
            ))}
          </div>
        </div>

        {/* Tendencia mensual */}
        {monthlyTrend.length > 1 && (
          <div
            style={{
              background: "#ff98001A",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid #ff9800",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              📈 Tendencia mensual
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {monthlyTrend.map(([month, amount]) => {
                const [year, m] = month.split("-");
                const monthName = new Date(Number(year), Number(m) - 1).toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
                return (
                  <div key={month}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                        {monthName}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                    <UIProgressBar value={amount} max={maxMonthly} color="#ff9800" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Productos más comprados */}
        <div
          style={{
            background: "#4caf501A",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid #4caf50",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            ⭐ Productos más comprados
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {topProducts.map(([name, data], idx) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  background: idx === 0 ? "rgba(76, 175, 80, 0.1)" : "transparent",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    {idx + 1}. {name}
                  </span>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    Precio promedio: ${Math.round(data.avgPrice).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                    x{data.count}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    ${data.totalSpent.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tiempos de compra */}
        {tripsWithDuration.length > 0 && (
          <div
            style={{
              background: "#6070801A",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid #607080",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              ⏱️ Tiempos de compra
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <MetricCard
                label="Tiempo promedio"
                value={`${Math.round(avgDuration)} min`}
                color="var(--text-primary)"
              />
              <MetricCard
                label="Productos/minuto"
                value={avgItemsPerMinute.toFixed(1)}
                color="var(--text-primary)"
              />
            </div>
            {avgDurationByStore.length > 0 && (
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  🐢 Donde más tardas comprando:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {slowestStores.map(({ store, avg }, idx) => (
                    <div
                      key={store}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.4rem 0.5rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        background: idx === 0 ? "rgba(244, 67, 54, 0.08)" : "transparent",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏬"} {store}
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: idx === 0 ? "#f44336" : "var(--text-primary)" }}>
                        {Math.round(avg)} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Productos por tienda */}
        {avgProductsByStore.length > 0 && (
          <div
            style={{
              background: "#2196f31A",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid #2196f3",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              📦 Productos por tienda
            </h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Promedio de productos por compra:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {avgProductsByStore.map(({ store, avg }) => (
                <div
                  key={store}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.4rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    🏬 {store}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                    {avg.toFixed(1)} productos
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compras de más por tienda */}
        {impulseByStore.length > 0 && (
          <div
            style={{
              background: "#ff98001A",
              borderRadius: "12px",
              padding: "1rem",
              border: "1px solid #ff9800",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              🛍️ Compras de más por tienda
            </h3>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Productos agregados con &quot;¿Algo más?&quot; durante la compra
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <MetricCard
                label="Total productos extra"
                value={String(totalImpulseItems)}
                color="#ff9800"
              />
              <MetricCard
                label="Gasto extra total"
                value={`$${totalImpulseSpent.toLocaleString()}`}
                color="#ff9800"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {impulseByStore.map(({ store, totalItems, totalSpent, avgPerTrip }) => (
                <div
                  key={store}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                      🏬 {store}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#ff9800" }}>
                      {totalItems} extras
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    ${totalSpent.toLocaleString()} gastado de más · ~{avgPerTrip.toFixed(1)} extras/compra
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ShoppingLayout>
  );
};

// --- Componente auxiliar ---
const MetricCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{label}</div>
    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color }}>{value}</div>
  </div>
);

export default ShoppingReports;
