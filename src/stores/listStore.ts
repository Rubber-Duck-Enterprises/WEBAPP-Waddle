import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { 
  TaskList, 
  Task,
  Tag 
} from "@/types";
import { createScopedStorage } from "@/lib/scopedStorage";

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

  tasks: Task[];

  addTask: (task: Omit<Task, "id" | "createdAt" | "isDone">) => void;
  updateTask: (id: string, updated: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
}

function getNextDueDate(current: string, repeat: Task["repeat"]): string {
  const date = new Date(current);
  if (repeat === "daily") date.setDate(date.getDate() + 1);
  if (repeat === "weekly") date.setDate(date.getDate() + 7);
  if (repeat === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export const useListStore = create<TaskListStore>()(
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
      name: "waddle-list",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
      partialize: (state) => ({
        taskLists: state.taskLists,
        tagsByList: state.tagsByList,
        activeListId: state.activeListId,
      }),
    }
  )
);