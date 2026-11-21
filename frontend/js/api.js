// ==========================================================
// 日和記帳 - 前端 API 客戶端模組
// 支援 RESTful 後端連線與本機離線回退 (雙軌容錯保證)
// ==========================================================

let API_BASE = "";
if (window.location.protocol === "file:") {
  API_BASE = "http://localhost:8000";
} else if (window.location.port && window.location.port !== "8000") {
  API_BASE = `http://${window.location.hostname}:8000`;
}

// Token Storage
const TOKEN_KEY = "hiyori_auth_token";
const CURRENT_USER_KEY = "hiyori_current_user";
let isOfflineMode = window.location.protocol === "file:";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Global Toast System (輕量、可點擊立即關閉、時間縮短)
function showToast(message, type = "info", duration = 1600) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // Clear previous identical toasts to avoid stacking
  const existingToasts = container.querySelectorAll(".toast");
  if (existingToasts.length >= 2) {
    existingToasts[0].remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "🌿",
    error: "🌧️",
    warning: "⚠️",
    info: "🌸",
  };
  const icon = iconMap[type] || "🌸";

  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-msg">${message}</span><span class="toast-close">✕</span>`;
  container.appendChild(toast);

  let timer = null;
  const dismiss = () => {
    if (timer) clearTimeout(timer);
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px) scale(0.96)";
    toast.style.transition = "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)";
    setTimeout(() => toast.remove(), 180);
  };

  // Click or tap to instantly close
  toast.addEventListener("click", dismiss);

  // Automatically dismiss after shorter duration
  timer = setTimeout(dismiss, duration);
}

// ==========================================================
// 本機資料引擎 (當後端未啟動或直接開啟 HTML 時自動接管)
// ==========================================================
class LocalFallbackEngine {
  constructor() {
    this.storageKey = "hiyori_offline_db_v1";
    this.initData();
  }

  initData() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const initialDb = this.generateSeedData();
      localStorage.setItem(this.storageKey, JSON.stringify(initialDb));
    }
  }

  getDb() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : this.generateSeedData();
    } catch {
      return this.generateSeedData();
    }
  }

  saveDb(db) {
    localStorage.setItem(this.storageKey, JSON.stringify(db));
  }

  generateSeedData() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

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

    const records = [];
    sampleExpenses.forEach((item, idx) => {
      const rDate = new Date(y, m, Math.min(item.day, 28));
      records.push({
        id: `seed_${idx}`,
        userId: "demo-user-id",
        type: item.type,
        amount: item.amount,
        date: rDate.toISOString().slice(0, 10),
        category: item.category,
        note: item.note,
        account: item.account,
        createdAt: rDate.toISOString(),
      });
    });

    // Previous month records
    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const prevExpenses = [
      { day: 1, type: "income", amount: 48000, category: "薪水收入", note: "上月本薪", account: "銀行轉帳" },
      { day: 2, type: "expense", amount: 12000, category: "居家生活", note: "房租", account: "銀行轉帳" },
      { day: 8, type: "expense", amount: 3500, category: "餐飲飲食", note: "飲食累積", account: "信用卡" },
      { day: 15, type: "expense", amount: 1280, category: "日常交通", note: "捷運月票", account: "悠遊卡" },
      { day: 22, type: "expense", amount: 2800, category: "購物消費", note: "換季衣物", account: "信用卡" },
    ];
    prevExpenses.forEach((item, idx) => {
      const rDate = new Date(prevY, prevM, item.day);
      records.push({
        id: `prev_seed_${idx}`,
        userId: "demo-user-id",
        type: item.type,
        amount: item.amount,
        date: rDate.toISOString().slice(0, 10),
        category: item.category,
        note: item.note,
        account: item.account,
        createdAt: rDate.toISOString(),
      });
    });

    return {
      users: [
        {
          id: "demo-user-id",
          username: "demo",
          displayName: "小晴 (日和記帳)",
          password: "password123",
          budget: { monthlyLimit: 22000, alertThreshold: 80 },
        },
      ],
      records,
    };
  }

  // Auth
  login(username, password) {
    const db = this.getDb();
    const user = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error("帳號或密碼錯誤");
    }
    const token = `local_${Date.now()}`;
    setToken(token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return {
      message: "登入成功 (本機模式)",
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName, budget: user.budget },
    };
  }

  register(username, password, displayName) {
    const db = this.getDb();
    const existing = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (existing) {
      throw new Error("此帳號已被註冊");
    }
    const newUser = {
      id: `user_${Date.now()}`,
      username: username.trim(),
      displayName: displayName?.trim() || username.trim(),
      password,
      budget: { monthlyLimit: 20000, alertThreshold: 80 },
    };
    db.users.push(newUser);
    this.saveDb(db);

    const token = `local_${Date.now()}`;
    setToken(token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return {
      message: "註冊成功 (本機模式)",
      token,
      user: { id: newUser.id, username: newUser.username, displayName: newUser.displayName, budget: newUser.budget },
    };
  }

  getMe() {
    const token = getToken();
    if (!token) return null;
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return { user };
    } catch {
      return null;
    }
  }

  logout() {
    setToken(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  resetPassword(username, newPassword) {
    const db = this.getDb();
    const user = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      throw new Error("查無此使用者帳號，請確認帳號是否正確");
    }
    user.password = newPassword;
    this.saveDb(db);
    const token = `local_${Date.now()}`;
    setToken(token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return {
      message: "密碼重設成功！已自動為您登入系統",
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName, budget: user.budget },
    };
  }

  // Records
  getRecords(params = {}) {
    const me = this.getMe();
    if (!me) return { records: [], total: 0 };
    const db = this.getDb();
    let list = db.records.filter((r) => r.userId === me.user.id);

    if (params.date) list = list.filter((r) => r.date === params.date);
    if (params.startDate) list = list.filter((r) => r.date >= params.startDate);
    if (params.endDate) list = list.filter((r) => r.date <= params.endDate);
    if (params.category && params.category !== "all") list = list.filter((r) => r.category === params.category);
    if (params.type && params.type !== "all") list = list.filter((r) => r.type === params.type);
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      list = list.filter((r) => (r.note || "").toLowerCase().includes(kw) || r.category.toLowerCase().includes(kw));
    }

    list.sort((a, b) => b.date.localeCompare(a.date));
    return { records: list, total: list.length };
  }

  getDatesWithRecords(year, month) {
    const me = this.getMe();
    if (!me) return { dates: {} };
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const db = this.getDb();
    const records = db.records.filter((r) => r.userId === me.user.id && r.date.startsWith(prefix));

    const map = {};
    records.forEach((r) => {
      if (!map[r.date]) map[r.date] = { hasExpense: false, hasIncome: false, expenseTotal: 0, incomeTotal: 0 };
      if (r.type === "expense") {
        map[r.date].hasExpense = true;
        map[r.date].expenseTotal += r.amount;
      } else {
        map[r.date].hasIncome = true;
        map[r.date].incomeTotal += r.amount;
      }
    });
    return { dates: map };
  }

  createRecord(record) {
    const me = this.getMe();
    if (!me) throw new Error("請先登入");
    const db = this.getDb();

    const newRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: me.user.id,
      ...record,
      createdAt: new Date().toISOString(),
    };
    db.records.push(newRecord);
    this.saveDb(db);

    // Overspend calculation
    let overspendWarning = null;
    if (record.type === "expense" && me.user.budget?.monthlyLimit > 0) {
      const mPrefix = record.date.slice(0, 7);
      const mExpenses = db.records.filter((r) => r.userId === me.user.id && r.type === "expense" && r.date.startsWith(mPrefix));
      const spent = mExpenses.reduce((s, r) => s + r.amount, 0);
      const limit = me.user.budget.monthlyLimit;
      const threshold = me.user.budget.alertThreshold || 80;
      const pct = Math.round((spent / limit) * 100);

      if (spent > limit) {
        overspendWarning = `🚨 本月支出累計 NT$ ${spent.toLocaleString()}，已超出預算 NT$ ${(spent - limit).toLocaleString()} (${pct}%)！`;
      } else if (pct >= threshold) {
        overspendWarning = `⚠️ 本月支出已達預算 ${pct}% (NT$ ${spent.toLocaleString()} / NT$ ${limit.toLocaleString()})，請留意開銷！`;
      }
    }

    return { message: "記帳成功", record: newRecord, overspendWarning };
  }

  updateRecord(id, patch) {
    const me = this.getMe();
    if (!me) throw new Error("請先登入");
    const db = this.getDb();
    const idx = db.records.findIndex((r) => r.id === id && r.userId === me.user.id);
    if (idx === -1) throw new Error("找不到該筆記帳紀錄");

    db.records[idx] = { ...db.records[idx], ...patch };
    this.saveDb(db);
    return { message: "更新成功", record: db.records[idx] };
  }

  deleteRecord(id) {
    const me = this.getMe();
    if (!me) throw new Error("請先登入");
    const db = this.getDb();
    db.records = db.records.filter((r) => !(r.id === id && r.userId === me.user.id));
    this.saveDb(db);
    return { message: "刪除成功" };
  }

  getBudget() {
    const me = this.getMe();
    if (!me) return null;
    const now = new Date();
    const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const db = this.getDb();
    const monthExpenses = db.records.filter(
      (r) => r.userId === me.user.id && r.type === "expense" && r.date.startsWith(curMonthPrefix)
    );
    const spent = monthExpenses.reduce((sum, r) => sum + r.amount, 0);
    const limit = me.user.budget?.monthlyLimit || 0;
    const threshold = me.user.budget?.alertThreshold || 80;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const isOverBudget = limit > 0 && spent > limit;
    const isNearBudget = limit > 0 && !isOverBudget && percentage >= threshold;

    return {
      budget: me.user.budget,
      currentMonth: curMonthPrefix,
      spent,
      remaining: Math.max(0, limit - spent),
      percentage,
      isOverBudget,
      isNearBudget,
      overAmount: Math.max(0, spent - limit),
    };
  }

  updateBudget(monthlyLimit, alertThreshold) {
    const me = this.getMe();
    if (!me) throw new Error("請先登入");
    const db = this.getDb();
    const user = db.users.find((u) => u.id === me.user.id);
    if (user) {
      user.budget = { monthlyLimit, alertThreshold };
      this.saveDb(db);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    return { message: "預算設定更新成功", budget: user.budget };
  }

  getStats(params = {}) {
    const me = this.getMe();
    if (!me) throw new Error("請先登入");
    const db = this.getDb();
    const userRecords = db.records.filter((r) => r.userId === me.user.id);

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const targetMonth = params.month || `${y}-${m}`;
    const startDate = params.startDate || `${targetMonth}-01`;
    const endDate = params.endDate || `${targetMonth}-31`;

    const filtered = userRecords.filter((r) => r.date >= startDate && r.date <= endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap = {};
    filtered.forEach((r) => {
      if (r.type === "expense") totalExpense += r.amount;
      else totalIncome += r.amount;

      const catKey = `${r.type}:::${r.category}`;
      if (!categoryMap[catKey]) categoryMap[catKey] = { type: r.type, total: 0, count: 0 };
      categoryMap[catKey].total += r.amount;
      categoryMap[catKey].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([key, item]) => {
      const category = key.split(":::")[1];
      const baseTotal = item.type === "expense" ? totalExpense : totalIncome;
      const percentage = baseTotal > 0 ? Math.round((item.total / baseTotal) * 100) : 0;
      return { category, type: item.type, total: item.total, count: item.count, percentage };
    }).sort((a, b) => b.total - a.total);

    // Monthly trends (past 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, now.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mRecs = userRecords.filter((r) => r.date.startsWith(mKey));
      let mExp = 0, mInc = 0;
      mRecs.forEach((r) => {
        if (r.type === "expense") mExp += r.amount;
        else mInc += r.amount;
      });
      monthlyTrends.push({ month: mKey, income: mInc, expense: mExp, balance: mInc - mExp });
    }

    const limit = me.user.budget?.monthlyLimit || 0;
    const threshold = me.user.budget?.alertThreshold || 80;
    const percentage = limit > 0 ? Math.round((totalExpense / limit) * 100) : 0;
    const isOverBudget = limit > 0 && totalExpense > limit;
    const isNearBudget = limit > 0 && !isOverBudget && percentage >= threshold;

    return {
      period: { startDate, endDate, month: targetMonth },
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      budget: {
        monthlyLimit: limit,
        spent: totalExpense,
        remaining: Math.max(0, limit - totalExpense),
        percentage,
        alertThreshold: threshold,
        isOverBudget,
        isNearBudget,
        overAmount: Math.max(0, totalExpense - limit),
      },
      categoryBreakdown,
      monthlyTrends,
      recordCount: filtered.length,
    };
  }
}

const localEngine = new LocalFallbackEngine();

// Generic Request Helper with Auto-Fallback
async function request(endpoint, options = {}) {
  // If in pure file:// protocol, route directly to local engine
  if (window.location.protocol === "file:") {
    return handleLocalRoute(endpoint, options);
  }

  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (networkErr) {
    // Only real network failure (fetch throws) triggers offline fallback!
    console.warn(`[日和記帳] 後端尚未啟動 (${endpoint})，切換至本機離線模式:`, networkErr.message);
    if (!isOfflineMode) {
      isOfflineMode = true;
      showToast("🌸 目前為本機離線模式，可正常記帳！執行 start.bat 即可啟用跨裝置同步。", "info", 2200);
    }
    return handleLocalRoute(endpoint, options);
  }

  // Server responded!
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `請求失敗 (${res.status})`);
  }
  return data;
}

// Router for Local Fallback Engine
function handleLocalRoute(endpoint, options) {
  const method = (options.method || "GET").toUpperCase();
  const path = endpoint.split("?")[0];
  const qs = new URLSearchParams(endpoint.includes("?") ? endpoint.split("?")[1] : "");
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === "/api/auth/login" && method === "POST") {
    return localEngine.login(body.username, body.password);
  }
  if (path === "/api/auth/register" && method === "POST") {
    return localEngine.register(body.username, body.password, body.displayName);
  }
  if (path === "/api/auth/reset-password" && method === "POST") {
    return localEngine.resetPassword(body.username, body.newPassword);
  }
  if (path === "/api/auth/logout" && method === "POST") {
    localEngine.logout();
    return { message: "已成功登出" };
  }
  if (path === "/api/auth/me" && method === "GET") {
    const me = localEngine.getMe();
    if (!me) throw new Error("未登入");
    return me;
  }
  if (path === "/api/budget" && method === "GET") {
    return localEngine.getBudget();
  }
  if (path === "/api/budget" && method === "PUT") {
    return localEngine.updateBudget(body.monthlyLimit, body.alertThreshold);
  }
  if (path === "/api/records/dates-with-records" && method === "GET") {
    return localEngine.getDatesWithRecords(qs.get("year"), qs.get("month"));
  }
  if (path === "/api/records" && method === "GET") {
    return localEngine.getRecords({
      date: qs.get("date"),
      startDate: qs.get("startDate"),
      endDate: qs.get("endDate"),
      category: qs.get("category"),
      type: qs.get("type"),
      keyword: qs.get("keyword"),
    });
  }
  if (path === "/api/records" && method === "POST") {
    return localEngine.createRecord(body);
  }
  if (path.startsWith("/api/records/") && method === "PUT") {
    const id = path.substring("/api/records/".length);
    return localEngine.updateRecord(id, body);
  }
  if (path.startsWith("/api/records/") && method === "DELETE") {
    const id = path.substring("/api/records/".length);
    return localEngine.deleteRecord(id);
  }
  if (path === "/api/stats" && method === "GET") {
    return localEngine.getStats({
      month: qs.get("month"),
      startDate: qs.get("startDate"),
      endDate: qs.get("endDate"),
    });
  }

  throw new Error(`找不到路由: ${path}`);
}

// API Methods
const api = {
  async register(username, password, displayName) {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, displayName }),
    });
    if (data.token) setToken(data.token);
    return data;
  },

  async login(username, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token) setToken(data.token);
    return data;
  },

  async resetPassword(username, newPassword) {
    const data = await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ username, newPassword }),
    });
    if (data.token) setToken(data.token);
    return data;
  },

  async logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setToken(null);
    }
  },

  async getMe() {
    if (!getToken()) return null;
    try {
      return await request("/api/auth/me");
    } catch {
      setToken(null);
      return null;
    }
  },

  async getRecords(params = {}) {
    const query = new URLSearchParams();
    if (params.date) query.set("date", params.date);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.category && params.category !== "all") query.set("category", params.category);
    if (params.type && params.type !== "all") query.set("type", params.type);
    if (params.keyword) query.set("keyword", params.keyword);

    const qs = query.toString();
    return await request(`/api/records${qs ? `?${qs}` : ""}`);
  },

  async getDatesWithRecords(year, month) {
    return await request(`/api/records/dates-with-records?year=${year}&month=${month}`);
  },

  async createRecord(record) {
    return await request("/api/records", {
      method: "POST",
      body: JSON.stringify(record),
    });
  },

  async updateRecord(id, record) {
    return await request(`/api/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(record),
    });
  },

  async deleteRecord(id) {
    return await request(`/api/records/${id}`, {
      method: "DELETE",
    });
  },

  async getBudget() {
    return await request("/api/budget");
  },

  async updateBudget(monthlyLimit, alertThreshold = 80) {
    return await request("/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyLimit, alertThreshold }),
    });
  },

  async getStats(params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.set("month", params.month);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);

    const qs = query.toString();
    return await request(`/api/stats${qs ? `?${qs}` : ""}`);
  },
};
