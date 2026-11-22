import type { DatabaseSchema, User, ExpenseRecord, Session, Budget } from "./types.ts";
import { hashPassword } from "./auth.ts";

const DATA_DIR = "./backend/data";
const DB_FILE = `${DATA_DIR}/db.json`;

class Database {
  private data: DatabaseSchema = {
    users: [],
    records: [],
    sessions: [],
  };
  private isLoaded = false;
  private saveLock: Promise<void> = Promise.resolve();

  async init(): Promise<void> {
    try {
      await Deno.mkdir(DATA_DIR, { recursive: true });
    } catch {
      // directory already exists or created
    }

    try {
      const fileContent = await Deno.readTextFile(DB_FILE);
      this.data = JSON.parse(fileContent);
      this.isLoaded = true;
    } catch {
      // Database does not exist yet; initialize and seed demo data
      this.isLoaded = true;
      await this.seedInitialData();
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    // Chain saves to avoid concurrent file write issues
    this.saveLock = this.saveLock.then(async () => {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      const json = JSON.stringify(this.data, null, 2);
      await Deno.writeTextFile(tempFile, json);
      await Deno.rename(tempFile, DB_FILE);
    }).catch((err) => {
      console.error("Failed to persist database:", err);
    });
    return this.saveLock;
  }

  private async seedInitialData(): Promise<void> {
    const { hash, salt } = await hashPassword("password123");
    const demoUser: User = {
      id: "demo-user-id",
      username: "demo",
      displayName: "小晴 (日和記帳)",
      email: "demo@hiyori.app",
      passwordHash: hash,
      salt: salt,
      budget: {
        monthlyLimit: 22000,
        alertThreshold: 80,
      },
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(demoUser);

    // Generate sample records around current month and previous month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based

    const sampleExpenses = [
      { day: 1, type: "income", amount: 48000, category: "薪水收入", note: "每月本薪入帳", account: "銀行轉帳" },
      { day: 2, type: "expense", amount: 12000, category: "居家生活", note: "房屋租金與管理費", account: "銀行轉帳" },
      { day: 3, type: "expense", amount: 160, category: "餐飲飲食", note: "早餐培根蛋餅與溫豆漿", account: "悠遊卡" },
      { day: 3, type: "expense", amount: 1280, category: "日常交通", note: "雙北都會通定期票", account: "悠遊卡" },
      { day: 5, type: "expense", amount: 320, category: "餐飲飲食", note: "午餐日式豚骨拉麵", account: "LINE Pay" },
      { day: 6, type: "expense", amount: 560, category: "休閒娛樂", note: "誠品書店購買書籍《簡單生活》", account: "信用卡" },
      { day: 8, type: "expense", amount: 1450, category: "購物消費", note: "MUJI 無印良品日式收納盒", account: "信用卡" },
      { day: 10, type: "income", amount: 5000, category: "副業收入", note: "設計稿費入帳", account: "銀行轉帳" },
      { day: 10, type: "expense", amount: 220, category: "餐飲飲食", note: "全家便利商店 輕食午餐與手沖咖啡", account: "悠遊卡" },
      { day: 12, type: "expense", amount: 880, category: "休閒娛樂", note: "威秀影城日系動畫電影", account: "信用卡" },
      { day: 13, type: "expense", amount: 420, category: "餐飲飲食", note: "晚餐日式定食套餐", account: "現金" },
      { day: 15, type: "expense", amount: 650, category: "醫療健康", note: "綜合維他命與常備藥品", account: "信用卡" },
      { day: 17, type: "expense", amount: 180, category: "餐飲飲食", note: "午後焙茶生乳捲與玄米茶", account: "LINE Pay" },
      { day: 20, type: "expense", amount: 980, category: "學習成長", note: "線上日語學習月費", account: "信用卡" },
      { day: 22, type: "expense", amount: 450, category: "餐飲飲食", note: "與朋友居酒屋小酌聚會", account: "現金" },
    ];

    // Seed for current month
    for (const item of sampleExpenses) {
      const recordDate = new Date(currentYear, currentMonth, Math.min(item.day, 28));
      const dateStr = recordDate.toISOString().slice(0, 10);
      this.data.records.push({
        id: crypto.randomUUID(),
        userId: demoUser.id,
        type: item.type as "expense" | "income",
        amount: item.amount,
        date: dateStr,
        category: item.category,
        note: item.note,
        account: item.account,
        createdAt: recordDate.toISOString(),
        updatedAt: recordDate.toISOString(),
      });
    }

    // Also seed a few records for previous month to make monthly trends look great
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevExpenses = [
      { day: 1, type: "income", amount: 48000, category: "薪水收入", note: "本薪入帳", account: "銀行轉帳" },
      { day: 2, type: "expense", amount: 12000, category: "居家生活", note: "房租", account: "銀行轉帳" },
      { day: 8, type: "expense", amount: 3500, category: "餐飲飲食", note: "上月飲食總結支出", account: "信用卡" },
      { day: 15, type: "expense", amount: 1280, category: "日常交通", note: "捷運月票", account: "悠遊卡" },
      { day: 22, type: "expense", amount: 2800, category: "購物消費", note: "換季衣物購買", account: "信用卡" },
    ];
    for (const item of prevExpenses) {
      const recordDate = new Date(prevYear, prevMonth, item.day);
      const dateStr = recordDate.toISOString().slice(0, 10);
      this.data.records.push({
        id: crypto.randomUUID(),
        userId: demoUser.id,
        type: item.type as "expense" | "income",
        amount: item.amount,
        date: dateStr,
        category: item.category,
        note: item.note,
        account: item.account,
        createdAt: recordDate.toISOString(),
        updatedAt: recordDate.toISOString(),
      });
    }
  }

  // --- User Operations ---
  async findUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
  }

  async findUserById(id: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.id === id);
  }

  async createUser(user: User): Promise<User> {
    this.data.users.push(user);
    await this.persist();
    return user;
  }

  async updateUserBudget(userId: string, budget: Budget): Promise<Budget | null> {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.budget = budget;
    await this.persist();
    return user.budget;
  }

  async updateUserProfile(userId: string, updates: { displayName?: string; email?: string }): Promise<User | null> {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    if (updates.displayName !== undefined) {
      user.displayName = updates.displayName.trim();
    }
    if (updates.email !== undefined) {
      user.email = updates.email.trim();
    }
    await this.persist();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string, salt: string): Promise<User | null> {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.passwordHash = passwordHash;
    user.salt = salt;
    await this.persist();
    return user;
  }

  // --- Session Operations ---
  async createSession(userId: string, token: string): Promise<Session> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    const session: Session = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    this.data.sessions.push(session);
    await this.persist();
    return session;
  }

  async findSession(token: string): Promise<Session | undefined> {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt) < new Date()) {
      // expired
      await this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    await this.persist();
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    await this.persist();
  }

  // --- Expense Record Operations ---
  async getRecords(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      date?: string;
      category?: string;
      type?: "expense" | "income";
      keyword?: string;
    }
  ): Promise<ExpenseRecord[]> {
    let list = this.data.records.filter((r) => r.userId === userId);

    if (filters?.date) {
      list = list.filter((r) => r.date === filters.date);
    }
    if (filters?.startDate) {
      list = list.filter((r) => r.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((r) => r.date <= filters.endDate!);
    }
    if (filters?.category && filters.category !== "all") {
      list = list.filter((r) => r.category === filters.category);
    }
    if (filters?.type) {
      list = list.filter((r) => r.type === filters.type);
    }
    if (filters?.keyword && filters.keyword.trim()) {
      const kw = filters.keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.note.toLowerCase().includes(kw) ||
          r.category.toLowerCase().includes(kw) ||
          (r.account && r.account.toLowerCase().includes(kw))
      );
    }

    // Sort descending by date, then createdAt
    return list.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  async getRecordById(id: string, userId: string): Promise<ExpenseRecord | undefined> {
    return this.data.records.find((r) => r.id === id && r.userId === userId);
  }

  async createRecord(record: ExpenseRecord): Promise<ExpenseRecord> {
    this.data.records.push(record);
    await this.persist();
    return record;
  }

  async updateRecord(id: string, userId: string, patch: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
    const idx = this.data.records.findIndex((r) => r.id === id && r.userId === userId);
    if (idx === -1) return null;

    const existing = this.data.records[idx];
    const updated: ExpenseRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      userId: existing.userId,
      updatedAt: new Date().toISOString(),
    };
    this.data.records[idx] = updated;
    await this.persist();
    return updated;
  }

  async deleteRecord(id: string, userId: string): Promise<boolean> {
    const initialLen = this.data.records.length;
    this.data.records = this.data.records.filter((r) => !(r.id === id && r.userId === userId));
    if (this.data.records.length !== initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }
}

export const db = new Database();

