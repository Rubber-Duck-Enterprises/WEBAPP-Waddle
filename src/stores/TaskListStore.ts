import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { TaskList, Tag } from "../types";

interface TaskListStore {
  taskLists: TaskList[];
  tagsByList: Record<string, Tag[]>;
  addTaskList: (list: Omit<TaskList, "id">) => void;
  updateTaskList: (id: string, updated: Partial<TaskList>) => void;
  deleteTaskList: (id: string) => void;
  addTagToList: (listId: string, tag: Tag) => void;
  getTagsForList: (listId: string) => Tag[];
}

export const useTaskListStore = create<TaskListStore>()(
  persist(
    (set, get) => ({
      taskLists: [],
      tagsByList: {},

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
        const tagsByList = { ...get().tagsByList };
        delete tagsByList[id];
        set({
          taskLists: get().taskLists.filter((l) => l.id !== id),
          tagsByList,
        });
      },

      addTagToList: (listId, tag) => {
        const existing = get().tagsByList[listId] || [];
        const alreadyExists = existing.some((t) => t.name === tag.name);
        if (alreadyExists) return;
        set((state) => ({
          tagsByList: {
            ...state.tagsByList,
            [listId]: [...existing, tag],
          },
        }));
      },

      getTagsForList: (listId) => get().tagsByList[listId] || [],
    }),
    {
      name: "waddle-task-lists",
      storage: createJSONStorage(() => localforage),
    }
  )
);
