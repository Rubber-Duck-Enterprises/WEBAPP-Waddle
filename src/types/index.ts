export type Section = {
  id: string;
  name: string;
  goal?: number;
  color?: string;
  icon?: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recurring?: boolean;
  notes?: string;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
};

export type Task = {
  id: string;
  title: string;
  isDone: boolean;
  createdAt: string;
  dueDate?: string;
  notes?: string;
  listId?: string;
};

export type TaskList = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
};

export type BackupMetadata = {
  id: string;
  createdAt: string;
  storageProvider: "google_drive" | "local_file";
  fileName: string;
};
