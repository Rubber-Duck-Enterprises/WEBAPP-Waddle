// Waddle Wallet
export type SectionType = "standard" | "passive" | "card" | "savings";
export type CardMode = "debit" | "credit" | "both";
export type ExpenseKind = "expense" | "income" | "debt" | "payment";

export type Section = {
  id: string;
  name: string;
  goal?: number | null;
  color?: string;
  icon?: string;
  createdAt: string;
  type?: SectionType;
  cardSettings?: {
    mode: CardMode;
    cutoffDate?: string;
    paymentDate?: string;
    creditLimit?: number;
  };
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  source?: string;
  date: string;
  kind?: ExpenseKind;
  recurring?: boolean;
  notes?: string;
  adjustment?: boolean;
  /** Shared ID between the two expenses of a transfer pair */
  transferId?: string;
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
  blockId?: string;
  blockCategory?: string;
  lastCompletedAt?: string;
  isOverdueFromPreviousPeriod?: boolean;
};

export type TimeBlock = {
  id: string;
  name: string;
  startTime: string; // HH:mm format, e.g. "09:00"
  endTime: string;   // HH:mm format, e.g. "14:00"
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  color?: string;
  icon?: string;
  listId?: string;
  categoryKey?: string;
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
