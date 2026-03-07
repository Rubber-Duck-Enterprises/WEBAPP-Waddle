import { useEffect, useRef } from "react";
import { useListStore } from "@/stores/listStore";
import { useSettingsStore } from "@/stores/settingsStore";

export const useScheduledTaskCleanup = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const getNextDelay = (deleteTime: string, frequency: string, dayOfWeek: number): number => {
      const now = new Date();
      const [hour, minute] = deleteTime.split(":").map(Number);
      const target = new Date();
      target.setHours(hour, minute, 0, 0);

      if (frequency === "weekly") {
        const dayDiff = (dayOfWeek - now.getDay() + 7) % 7 || 7;
        target.setDate(now.getDate() + dayDiff);
      } else if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      return target.getTime() - now.getTime();
    };

    const showNotification = (completedCount: number) => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const title = completedCount > 0
        ? "🎉 ¡Buen trabajo!"
        : "⏳ Toca motivarse...";

      const body = completedCount > 0
        ? `Has completado ${completedCount} ${completedCount === 1 ? 'tarea' : 'tareas'}. ¡Sigue así! 💪`
        : "¡Aún estás a tiempo de tachar una tarea hoy! Tú puedes. ✨";

      new Notification(title, {
        body,
        icon: "/pwa-192x192.png",
      });
    };

    const scheduleCleanup = () => {
      const {
        autoDeleteDoneTasks,
        deleteTime,
        deleteFrequency,
        deleteDayOfWeek,
      } = useSettingsStore.getState();

      if (!autoDeleteDoneTasks) {
        console.log("🧹 Limpieza automática desactivada.");
        return;
      }

      const delay = getNextDelay(deleteTime, deleteFrequency, deleteDayOfWeek);
      console.log(`🕐 Próxima limpieza en ${Math.round(delay / 1000)} segundos`);

      timeoutRef.current = setTimeout(() => {
        const { tasks, deleteTask } = useListStore.getState();
        const completed = tasks.filter((t) => t.isDone);

        if (completed.length > 0) {
          completed.forEach((task) => deleteTask(task.id));
          console.log(`🧹 Eliminadas ${completed.length} tareas completadas`);
        } else {
          console.log("✅ No hay tareas completadas para eliminar");
        }

        showNotification(completed.length);
        scheduleCleanup();
      }, delay);
    };

    const unsubscribe = useSettingsStore.subscribe(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      scheduleCleanup();
    });

    scheduleCleanup();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [hydrated]);
};
