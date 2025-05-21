import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { Task } from "../types";

function getNextDueDate(current: string, repeat: Task["repeat"]): string {
  const date = new Date(current);
  if (repeat === "daily") date.setDate(date.getDate() + 1);
  if (repeat === "weekly") date.setDate(date.getDate() + 7);
  if (repeat === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "isDone">) => void;
  updateTask: (id: string, updated: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) => {
        const newTask: Task = {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          ...task,
          isDone: false,
        };
        set({ tasks: [...get().tasks, newTask] });
      },

      updateTask: (id, updated) => {
        set({
          tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        });
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },

      toggleTaskDone: (id) => {
        const currentTasks = get().tasks;
        const task = currentTasks.find((t) => t.id === id);
        if (!task) return;

        const updated = { ...task, isDone: !task.isDone };
        const updatedTasks = currentTasks.map((t) =>
          t.id === id ? updated : t
        );

        if (!task.isDone && task.repeat) {
          const newTask: Task = {
            ...task,
            id: nanoid(),
            createdAt: new Date().toISOString(),
            dueDate: getNextDueDate(task.dueDate || new Date().toISOString(), task.repeat),
            isDone: false,
            completedAt: undefined,
          };
          updatedTasks.push(newTask);
        }

        set({ tasks: updatedTasks });
      },
    }),
    {
      name: "waddle-tasks",
      storage: createJSONStorage(() => localforage),
    }
  )
);
