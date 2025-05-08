// Waddle Wallet
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
  source?: string;
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

// Waddle List
export type Task = {
  id: string;
  title: string;
  isDone: boolean;
  createdAt: string;
  dueDate?: string;
  notes?: string;
  listId?: string;
  priority?: "low" | "medium" | "high";
  reminders?: string[];
  subtasks?: Task[];
  repeat?: "daily" | "weekly" | "monthly" | null;
  completedAt?: string;
  tags?: string[];
};

export type TaskList = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder?: "manual" | "dueDate" | "priority";
  isArchived?: boolean;
};

export type Tag = {
  id: string;
  name: string;
  color?: string;
};

// Backups
export type BackupMetadata = {
  id: string;
  createdAt: string;
  storageProvider: "google_drive" | "local_file";
  fileName: string;
};
