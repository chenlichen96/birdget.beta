export type RecordType = "expense" | "income";

export interface Budget {
  monthlyLimit: number; // e.g. 20000, 0 means unset
  alertThreshold: number; // percentage (e.g. 80 means 80%)
}

export interface User {
  id: string;
  username: string;
  displayName: string;
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

