import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { TaskList, Tag } from "@/types";

type ListId = string | "all";

interface TaskListStore {
  taskLists: TaskList[];
  tagsByList: Record<string, Tag[]>;
  activeListId: ListId;

  addTaskList: (list: Omit<TaskList, "id">) => void;
  updateTaskList: (id: string, updated: Partial<TaskList>) => void;
  deleteTaskList: (id: string) => void;

  setActiveListId: (id: ListId) => void;

  addTagToList: (listId: string, tag: Tag) => void;
  getTagsForList: (listId: string) => Tag[];
}

export const useTaskListStore = create<TaskListStore>()(
  persist(
    (set, get) => ({
      taskLists: [],
      tagsByList: {},
      activeListId: "all",

      addTaskList: (list) => {
        const newList: TaskList = { id: nanoid(), ...list };
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

        const remaining = get().taskLists.filter((l) => l.id !== id);

        set((state) => ({
          taskLists: remaining,
          tagsByList,
          activeListId: state.activeListId === id ? "all" : state.activeListId,
        }));
      },

      setActiveListId: (id) => set({ activeListId: id }),

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
      partialize: (state) => ({
        taskLists: state.taskLists,
        tagsByList: state.tagsByList,
        activeListId: state.activeListId,
      }),
    }
  )
);