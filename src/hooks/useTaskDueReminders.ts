import { useEffect, useRef } from "react";
import { useListStore } from "@/stores/listStore";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Hook que revisa tareas con fecha de vencimiento y muestra notificaciones
 * para tareas que vencen hoy o están vencidas (no completadas).
 *
 * Se ejecuta una vez al iniciar la app y luego cada hora.
 */
export const useTaskDueReminders = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const checkDueTasks = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const { tasks } = useListStore.getState();
      const now = new Date();
      const todayStr = now.toDateString();

      const dueTodayOrOverdue = tasks.filter((task) => {
        if (task.isDone || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate <= now || dueDate.toDateString() === todayStr;
      });

      if (dueTodayOrOverdue.length === 0) return;

      const overdue = dueTodayOrOverdue.filter(
        (t) => new Date(t.dueDate!).toDateString() !== todayStr
      );
      const dueToday = dueTodayOrOverdue.filter(
        (t) => new Date(t.dueDate!).toDateString() === todayStr
      );

      let body = "";
      if (dueToday.length > 0) {
        body += `📅 ${dueToday.length} tarea${dueToday.length > 1 ? "s" : ""} vence${dueToday.length > 1 ? "n" : ""} hoy`;
      }
      if (overdue.length > 0) {
        if (body) body += "\n";
        body += `⚠️ ${overdue.length} tarea${overdue.length > 1 ? "s" : ""} vencida${overdue.length > 1 ? "s" : ""}`;
      }

      new Notification("🦆 Waddle — Recordatorio", {
        body,
        icon: "/pwa-192x192.png",
      });
    };

    // Revisar al iniciar
    const initialDelay = setTimeout(checkDueTasks, 5000);

    // Revisar cada hora
    intervalRef.current = setInterval(checkDueTasks, 60 * 60 * 1000);

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hydrated]);
};
