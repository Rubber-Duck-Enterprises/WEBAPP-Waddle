import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Expense } from "@/types";

interface Props {
  expenses: Expense[];
}

/**
 * Gráfica de barras que muestra ingresos vs gastos de los últimos 6 meses.
 */
const WalletChart: React.FC<Props> = ({ expenses }) => {
  const data = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 5),
      end: endOfMonth(now),
    });

    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const monthExpenses = expenses.filter((e) => {
        const date = parseISO(e.date);
        return date >= start && date <= end;
      });

      const income = monthExpenses
        .filter((e) => e.amount > 0 && !e.transferId && !e.description.startsWith("Transferencia desde "))
        .reduce((acc, e) => acc + e.amount, 0);

      const spent = monthExpenses
        .filter((e) => e.amount < 0 && !e.transferId && !e.description.startsWith("Transferencia a "))
        .reduce((acc, e) => acc + Math.abs(e.amount), 0);

      return {
        month: format(month, "MMM", { locale: es }),
        ingresos: income,
        gastos: spent,
      };
    });
  }, [expenses]);

  const hasData = data.some((d) => d.ingresos > 0 || d.gastos > 0);

  if (!hasData) {
    return null;
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h4 style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>Tendencia (6 meses)</h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name === "ingresos" ? "Ingresos" : "Gastos",
            ]}
          />
          <Bar dataKey="ingresos" radius={[4, 4, 0, 0]} maxBarSize={20}>
            {data.map((_, index) => (
              <Cell key={`income-${index}`} fill="var(--success-color)" />
            ))}
          </Bar>
          <Bar dataKey="gastos" radius={[4, 4, 0, 0]} maxBarSize={20}>
            {data.map((_, index) => (
              <Cell key={`expense-${index}`} fill="var(--danger-color)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WalletChart;
