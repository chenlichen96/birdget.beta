export type RecordType = "expense" | "income";

export interface RecurringItem {
  id: string;
  name: string; // e.g. "每月薪資", "房租", "定期票"
  type: RecordType;
  amount: number;
  category: string;
  dayOfMonth: number; // 1~31
}

export interface Budget {
  monthlyLimit: number; // e.g. 20000, 0 means unset
  alertThreshold: number; // percentage (e.g. 80 means 80%)
  categoryBudgets?: Record<string, number>; // 主題/分類預算，例如 { "餐飲飲食": 8000, "休閒娛樂": 3000 }
  recurringItems?: RecurringItem[]; // 每月固定收支清單
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string; // 電子郵件 (用於忘記密碼二次驗證)
  passwordHash: string;
  salt: string;
  budget: Budget;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  userId: string;
  type: RecordType;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  note: string;
  account?: string; // e.g. 現金, 信用卡, 悠遊卡, 轉帳
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  users: User[];
  records: ExpenseRecord[];
  sessions: Session[];
}

export interface StatsSummary {
  period: {
    startDate: string;
    endDate: string;
    month?: string;
  };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  budget: {
    monthlyLimit: number;
    spent: number;
    remaining: number;
    percentage: number;
    alertThreshold: number;
    isOverBudget: boolean;
    isNearBudget: boolean;
    overAmount: number;
  };
  categoryBreakdown: {
    category: string;
    type: RecordType;
    total: number;
    count: number;
    percentage: number;
  }[];
  monthlyTrends: {
    month: string; // YYYY-MM
    income: number;
    expense: number;
    balance: number;
  }[];
  dailyTrends: {
    date: string; // YYYY-MM-DD
    income: number;
    expense: number;
  }[];
  recordCount: number;
}

