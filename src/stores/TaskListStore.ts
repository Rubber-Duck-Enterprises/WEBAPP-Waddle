import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { TaskList } from "../types";

interface TaskListStore {
  taskLists: TaskList[];
  addTaskList: (list: Omit<TaskList, "id">) => void;
  updateTaskList: (id: string, updated: Partial<TaskList>) => void;
  deleteTaskList: (id: string) => void;
}

export const useTaskListStore = create<TaskListStore>()(
  persist(
    (set, get) => ({
      taskLists: [],
      addTaskList: (list) => {
        const newList: TaskList = {
          id: nanoid(),
          ...list,
        };
        set({ taskLists: [...get().taskLists, newList] });
      },
      updateTaskList: (id, updated) => {
        set({
          taskLists: get().taskLists.map((l) =>
            l.id === id ? { ...l, ...updated } : l
          ),
        });
      },
      deleteTaskList: (id) => {
        set({ taskLists: get().taskLists.filter((l) => l.id !== id) });
      },
    }),
    {
      name: "waddle-task-lists",
      storage: createJSONStorage(() => localforage),
    }
  )
);
