import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { Task } from "../types";

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
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, isDone: !t.isDone } : t
          ),
        });
      },
    }),
    {
      name: "waddle-tasks",
      storage: createJSONStorage(() => localforage),
    }
  )
);
