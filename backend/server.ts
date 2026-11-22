import { db } from "./db.ts";
import { hashPassword, verifyPassword, generateToken } from "./auth.ts";
import type { RecordType, StatsSummary } from "./types.ts";

let PORT = 8000;
try {
  const envPort = Deno.env.get("PORT");
  if (envPort) PORT = Number(envPort) || 8000;
} catch {
  PORT = 8000;
}

// Helper: Response with JSON
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Helper: Extract authenticated user from Authorization header
async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const session = await db.findSession(token);
  if (!session) return null;
  const user = await db.findUserById(session.userId);
  if (!user) return null;
  return { user, session };
}

// Helper: Serve static files
async function serveStaticFile(pathname: string): Promise<Response> {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  // Prevent directory traversal
  filePath = filePath.replace(/\.\./g, "");
  const fullPath = `./frontend${filePath}`;

  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
  };

  const ext = filePath.substring(filePath.lastIndexOf("."));
  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const file = await Deno.readFile(fullPath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    // If not found and not an API call, fallback to index.html for SPA
    if (!pathname.startsWith("/api/")) {
      try {
        const indexFile = await Deno.readFile("./frontend/index.html");
        return new Response(indexFile, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch {
        return new Response("Frontend index.html not found", { status: 404 });
      }
    }
    return jsonResponse({ error: "Not Found" }, 404);
  }
}

// In-memory verification codes for forgot password secondary verification
const resetVerificationCodes = new Map<string, { code: string; email: string; expiresAt: number }>();

// Request Handler
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // --- API Routes ---
  if (pathname.startsWith("/api/")) {
    try {
      // 1. Auth: Register
      if (pathname === "/api/auth/register" && method === "POST") {
        const body = await req.json();
        const { username, password, displayName, email } = body;

        const trimmedUser = (username || "").trim();
        if (!trimmedUser || !password) {
          return jsonResponse({ error: "帳號與密碼為必填項目" }, 400);
        }
        if (trimmedUser.length < 3 || trimmedUser.length > 30) {
          return jsonResponse({ error: "帳號長度需介於 3 至 30 個字元" }, 400);
        }
        // Allowed characters: alphanumeric, underscore, dot, hyphen, at-sign, Chinese characters
        const usernameRegex = /^[a-zA-Z0-9_.@\-\u4e00-\u9fa5]+$/;
        if (!usernameRegex.test(trimmedUser)) {
          return jsonResponse({ error: "帳號格式不合：僅允許英數字、底線、減號、點、@ 或中文字" }, 400);
        }
        if (password.length < 6 || password.length > 50) {
          return jsonResponse({ error: "密碼長度需介於 6 至 50 個字元" }, 400);
        }
        if (displayName && displayName.trim().length > 20) {
          return jsonResponse({ error: "暱稱長度不能超過 20 個字元" }, 400);
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return jsonResponse({ error: "電子信箱格式不正確" }, 400);
        }

        const existing = await db.findUserByUsername(trimmedUser);
        if (existing) {
          return jsonResponse({ error: "此帳號已被註冊，請更換其他帳號" }, 409);
        }

        const { hash, salt } = await hashPassword(password);
        const newUser = {
          id: crypto.randomUUID(),
          username: trimmedUser,
          displayName: displayName?.trim() || trimmedUser,
          email: email?.trim() || undefined,
          passwordHash: hash,
          salt: salt,
          budget: {
            monthlyLimit: 20000,
            alertThreshold: 80,
          },
          createdAt: new Date().toISOString(),
        };

        await db.createUser(newUser);
        const token = generateToken();
        await db.createSession(newUser.id, token);

        return jsonResponse({
          message: "註冊成功！已為您自動登入",
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            displayName: newUser.displayName,
            email: newUser.email,
            budget: newUser.budget,
          },
        }, 201);
      }

      // 2. Auth: Login
      if (pathname === "/api/auth/login" && method === "POST") {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
          return jsonResponse({ error: "請輸入帳號與密碼" }, 400);
        }

        const user = await db.findUserByUsername(username);
        if (!user) {
          return jsonResponse({ error: "帳號或密碼錯誤，請重新確認" }, 401);
        }

        const isValid = await verifyPassword(password, user.passwordHash, user.salt);
        if (!isValid) {
          return jsonResponse({ error: "帳號或密碼錯誤，請重新確認" }, 401);
        }

        const token = generateToken();
        await db.createSession(user.id, token);

        return jsonResponse({
          message: `登入成功！歡迎回來，${user.displayName}`,
          token,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            budget: user.budget,
          },
        });
      }

      // 2.05 Auth: Send Reset Verification Code (忘記密碼 - 二次驗證碼發送)
      if (pathname === "/api/auth/send-reset-code" && method === "POST") {
        const body = await req.json();
        const { username, email } = body;
        if (!username || !username.trim()) {
          return jsonResponse({ error: "請輸入使用者帳號" }, 400);
        }
        if (!email || !email.trim()) {
          return jsonResponse({ error: "請輸入綁定的安全電子信箱以進行二次驗證" }, 400);
        }
        const trimmedUser = username.trim().toLowerCase();
        const trimmedEmail = email.trim().toLowerCase();

        const user = await db.findUserByUsername(trimmedUser);
        if (!user) {
          return jsonResponse({ error: "查無此使用者帳號，請確認帳號是否正確" }, 404);
        }

        const registeredEmail = (user.email || (user.username === "demo" ? "demo@hiyori.app" : "")).toLowerCase();
        if (registeredEmail && registeredEmail !== trimmedEmail) {
          return jsonResponse({ error: "輸入之信箱與該帳號綁定的安全信箱不符，二次驗證失敗" }, 400);
        }

        // Generate 6-digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resetVerificationCodes.set(trimmedUser, {
          code,
          email: trimmedEmail,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });

        const [namePart, domainPart] = trimmedEmail.split("@");
        const masked = namePart.length > 2
          ? `${namePart.charAt(0)}***${namePart.charAt(namePart.length - 1)}@${domainPart || ""}`
          : `${namePart.charAt(0)}***@${domainPart || ""}`;

        return jsonResponse({
          message: `安全驗證碼已發送至 ${masked} (有效時間 10 分鐘)`,
          previewCode: code,
        });
      }

      // 2.1 Auth: Reset Password (忘記密碼處理 - 需信箱二次驗證)
      if (pathname === "/api/auth/reset-password" && method === "POST") {
        const body = await req.json();
        const { username, email, code, newPassword } = body;

        if (!username || !newPassword) {
          return jsonResponse({ error: "請提供帳號與新密碼" }, 400);
        }

        const trimmedUser = username.trim().toLowerCase();
        const user = await db.findUserByUsername(trimmedUser);
        if (!user) {
          return jsonResponse({ error: "查無此使用者帳號，請確認帳號是否正確" }, 404);
        }

        if (!code || !code.trim()) {
          return jsonResponse({ error: "為確保帳號安全，請先輸入信箱驗證碼以完成二次驗證" }, 400);
        }

        const verifyRecord = resetVerificationCodes.get(trimmedUser);
        if (!verifyRecord || verifyRecord.expiresAt < Date.now()) {
          return jsonResponse({ error: "驗證碼不存在或已逾時過期，請重新發送驗證碼" }, 400);
        }

        if (verifyRecord.code !== code.trim()) {
          return jsonResponse({ error: "二次驗證碼錯誤，請重新確認" }, 400);
        }

        if (email && verifyRecord.email !== email.trim().toLowerCase()) {
          return jsonResponse({ error: "驗證信箱與發送驗證碼之信箱不符" }, 400);
        }

        if (newPassword.length < 6 || newPassword.length > 50) {
          return jsonResponse({ error: "新密碼長度需介於 6 至 50 個字元" }, 400);
        }

        resetVerificationCodes.delete(trimmedUser);

        const { hash, salt } = await hashPassword(newPassword);
        await db.updateUserPassword(user.id, hash, salt);

        // If user didn't have email saved, bind this verified email
        if (!user.email && email) {
          await db.updateUserProfile(user.id, { email: email.trim() });
        }

        // Invalidate old sessions for safety
        await db.deleteSessionsByUserId(user.id);

        // Issue new token and login
        const token = generateToken();
        await db.createSession(user.id, token);

        return jsonResponse({
          message: "密碼重設成功！已自動為您登入系統",
          token,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email || email,
            budget: user.budget,
          },
        });
      }

      // 3. Auth: Logout
      if (pathname === "/api/auth/logout" && method === "POST") {
        const auth = await authenticate(req);
        if (auth) {
          await db.deleteSession(auth.session.token);
        }
        return jsonResponse({ message: "已成功登出" });
      }

      // 4. Auth: Me (Verify Login Status)
      if (pathname === "/api/auth/me" && method === "GET") {
        const auth = await authenticate(req);
        if (!auth) {
          return jsonResponse({ error: "未登入或憑證已失效" }, 401);
        }
        return jsonResponse({
          user: {
            id: auth.user.id,
            username: auth.user.username,
            displayName: auth.user.displayName,
            email: auth.user.email,
            budget: auth.user.budget,
          },
        });
      }

      // All routes below require authentication
      const auth = await authenticate(req);
      if (!auth) {
        return jsonResponse({ error: "請先登入以存取資料" }, 401);
      }
      const userId = auth.user.id;

      // Update User Profile (displayName, email)
      if (pathname === "/api/auth/profile" && method === "PUT") {
        const body = await req.json();
        const displayName = (body.displayName || "").trim();
        const email = body.email !== undefined ? (body.email || "").trim() : undefined;
        if (!displayName) {
          return jsonResponse({ error: "用戶名稱不能為空" }, 400);
        }
        if (displayName.length > 30) {
          return jsonResponse({ error: "用戶名稱長度不可超過 30 個字元" }, 400);
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return jsonResponse({ error: "電子信箱格式不正確" }, 400);
        }
        const updated = await db.updateUserProfile(userId, { displayName, email });
        if (!updated) {
          return jsonResponse({ error: "找不到用戶" }, 404);
        }
        return jsonResponse({
          message: "用戶資料更新成功",
          user: {
            id: updated.id,
            username: updated.username,
            displayName: updated.displayName,
            email: updated.email,
            budget: updated.budget,
          },
        });
      }

      // Update User Password (for logged-in user)
      if (pathname === "/api/auth/change-password" && method === "PUT") {
        const body = await req.json();
        const { currentPassword, newPassword } = body;
        if (!newPassword || newPassword.length < 6 || newPassword.length > 50) {
          return jsonResponse({ error: "新密碼長度需介於 6 至 50 個字元" }, 400);
        }
        if (currentPassword) {
          const isValid = await verifyPassword(currentPassword, auth.user.passwordHash, auth.user.salt);
          if (!isValid) {
            return jsonResponse({ error: "原密碼不正確" }, 400);
          }
        }
        const { hash: newHash, salt: newSalt } = await hashPassword(newPassword);
        await db.updateUserPassword(userId, newHash, newSalt);
        return jsonResponse({ message: "密碼修改成功" });
      }

      // 5. Budget: GET
      if (pathname === "/api/budget" && method === "GET") {
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const records = await db.getRecords(userId, {
          startDate: `${currentMonthPrefix}-01`,
          endDate: `${currentMonthPrefix}-31`,
          type: "expense",
        });

        const currentSpent = records.reduce((sum, r) => sum + r.amount, 0);
        const limit = auth.user.budget.monthlyLimit;
        const threshold = auth.user.budget.alertThreshold || 80;
        const percentage = limit > 0 ? Math.round((currentSpent / limit) * 100) : 0;
        const isOverBudget = limit > 0 && currentSpent > limit;
        const isNearBudget = limit > 0 && !isOverBudget && percentage >= threshold;

        return jsonResponse({
          budget: auth.user.budget,
          currentMonth: currentMonthPrefix,
          spent: currentSpent,
          remaining: Math.max(0, limit - currentSpent),
          percentage,
          isOverBudget,
          isNearBudget,
          overAmount: Math.max(0, currentSpent - limit),
        });
      }

      // 6. Budget: PUT (Update Budget Setting)
      if (pathname === "/api/budget" && method === "PUT") {
        const body = await req.json();
        const monthlyLimit = Number(body.monthlyLimit);
        const alertThreshold = Number(body.alertThreshold) || 80;
        const categoryBudgets = typeof body.categoryBudgets === "object" && body.categoryBudgets !== null
          ? body.categoryBudgets
          : (auth.user.budget.categoryBudgets || {});
        const recurringItems = Array.isArray(body.recurringItems)
          ? body.recurringItems
          : (auth.user.budget.recurringItems || []);

        if (isNaN(monthlyLimit) || monthlyLimit < 0) {
          return jsonResponse({ error: "請輸入有效的預算金額" }, 400);
        }

        const updated = await db.updateUserBudget(userId, {
          monthlyLimit,
          alertThreshold: Math.min(100, Math.max(1, alertThreshold)),
          categoryBudgets,
          recurringItems,
        });

        return jsonResponse({ message: "預算設定更新成功", budget: updated });
      }

      // 7. Records: GET List
      if (pathname === "/api/records" && method === "GET") {
        const date = url.searchParams.get("date") || undefined;
        const startDate = url.searchParams.get("startDate") || undefined;
        const endDate = url.searchParams.get("endDate") || undefined;
        const category = url.searchParams.get("category") || undefined;
        const type = (url.searchParams.get("type") as RecordType) || undefined;
        const keyword = url.searchParams.get("keyword") || undefined;

        const records = await db.getRecords(userId, {
          date,
          startDate,
          endDate,
          category,
          type,
          keyword,
        });

        return jsonResponse({ records, total: records.length });
      }

      // 8. Records: Calendar Markers (Dates with records for a specific year/month)
      if (pathname === "/api/records/dates-with-records" && method === "GET") {
        const year = url.searchParams.get("year");
        const month = url.searchParams.get("month"); // "01" - "12"
        if (!year || !month) {
          return jsonResponse({ error: "請提供 year 與 month 參數" }, 400);
        }

        const prefix = `${year}-${month.padStart(2, "0")}`;
        const records = await db.getRecords(userId, {
          startDate: `${prefix}-01`,
          endDate: `${prefix}-31`,
        });

        // Group by date: { [date]: { hasExpense: boolean, hasIncome: boolean, expenseTotal: number, incomeTotal: number } }
        const map: Record<string, { hasExpense: boolean; hasIncome: boolean; expenseTotal: number; incomeTotal: number }> = {};
        for (const r of records) {
          if (!map[r.date]) {
            map[r.date] = { hasExpense: false, hasIncome: false, expenseTotal: 0, incomeTotal: 0 };
          }
          if (r.type === "expense") {
            map[r.date].hasExpense = true;
            map[r.date].expenseTotal += r.amount;
          } else {
            map[r.date].hasIncome = true;
            map[r.date].incomeTotal += r.amount;
          }
        }

        return jsonResponse({ dates: map });
      }

      // 9. Records: POST (Create Record)
      if (pathname === "/api/records" && method === "POST") {
        const body = await req.json();
        const { type, amount, date, category, note, account } = body;

        if (!type || !["expense", "income"].includes(type)) {
          return jsonResponse({ error: "收支類型無效 (需為 expense 或 income)" }, 400);
        }
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          return jsonResponse({ error: "請輸入大於 0 的有效金額" }, 400);
        }
        if (numericAmount > 99999999) {
          return jsonResponse({ error: "金額上限為 8 位數 (最高 99,999,999)" }, 400);
        }
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return jsonResponse({ error: "請提供格式正確的日期 (YYYY-MM-DD)" }, 400);
        }
        if (!category || !category.trim()) {
          return jsonResponse({ error: "請選擇或輸入分類標籤" }, 400);
        }
        if (category.trim().length > 8) {
          return jsonResponse({ error: "分類標籤不可超過 8 個字元" }, 400);
        }
        if (note && note.trim().length > 20) {
          return jsonResponse({ error: "備註文字不可超過 20 個字元" }, 400);
        }

        const newRecord = {
          id: crypto.randomUUID(),
          userId,
          type: type as RecordType,
          amount: Math.round(numericAmount),
          date,
          category: category.trim(),
          note: (note || "").trim(),
          account: account?.trim() || "現金",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const created = await db.createRecord(newRecord);

        // Check if this record triggered an overspend condition
        let overspendWarning: string | null = null;
        if (type === "expense" && auth.user.budget.monthlyLimit > 0) {
          const recordMonth = date.substring(0, 7);
          const currentExpenses = await db.getRecords(userId, {
            startDate: `${recordMonth}-01`,
            endDate: `${recordMonth}-31`,
            type: "expense",
          });
          const totalSpent = currentExpenses.reduce((sum, r) => sum + r.amount, 0);
          const limit = auth.user.budget.monthlyLimit;
          const threshold = auth.user.budget.alertThreshold || 80;
          const percentage = Math.round((totalSpent / limit) * 100);

          if (totalSpent > limit) {
            overspendWarning = `🚨 本月支出累計 NT$ ${totalSpent.toLocaleString()}，已超出預算 NT$ ${(totalSpent - limit).toLocaleString()} (${percentage}%)！`;
          } else if (percentage >= threshold) {
            overspendWarning = `⚠️ 本月支出已達預算 ${percentage}% (NT$ ${totalSpent.toLocaleString()} / NT$ ${limit.toLocaleString()})，請留意開銷！`;
          }
        }

        return jsonResponse({
          message: "記帳成功",
          record: created,
          overspendWarning,
        }, 201);
      }

      // 10. Records: PUT (Update Record)
      if (pathname.startsWith("/api/records/") && method === "PUT") {
        const id = pathname.substring("/api/records/".length);
        const body = await req.json();
        const patch: Record<string, unknown> = {};

        if (body.type && ["expense", "income"].includes(body.type)) patch.type = body.type;
        if (body.amount !== undefined) {
          const amt = Number(body.amount);
          if (isNaN(amt) || amt <= 0) return jsonResponse({ error: "金額需大於 0" }, 400);
          if (amt > 99999999) return jsonResponse({ error: "金額上限為 8 位數 (最高 99,999,999)" }, 400);
          patch.amount = Math.round(amt);
        }
        if (body.date) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return jsonResponse({ error: "日期格式錯誤" }, 400);
          patch.date = body.date;
        }
        if (body.category) {
          if (body.category.trim().length > 8) return jsonResponse({ error: "分類標籤不可超過 8 個字元" }, 400);
          patch.category = body.category.trim();
        }
        if (body.note !== undefined) {
          if (body.note.trim().length > 20) return jsonResponse({ error: "備註文字不可超過 20 個字元" }, 400);
          patch.note = body.note.trim();
        }
        if (body.account !== undefined) patch.account = body.account.trim();

        const updated = await db.updateRecord(id, userId, patch);
        if (!updated) {
          return jsonResponse({ error: "找不到該筆記帳紀錄" }, 404);
        }

        return jsonResponse({ message: "更新成功", record: updated });
      }

      // 11. Records: DELETE (Delete Record)
      if (pathname.startsWith("/api/records/") && method === "DELETE") {
        const id = pathname.substring("/api/records/".length);
        const success = await db.deleteRecord(id, userId);
        if (!success) {
          return jsonResponse({ error: "找不到該筆紀錄或已刪除" }, 404);
        }
        return jsonResponse({ message: "刪除成功" });
      }

      // 12. Stats: Consumption Statistics & Reports
      if (pathname === "/api/stats" && method === "GET") {
        const monthParam = url.searchParams.get("month"); // e.g. "2026-11"
        const startDateParam = url.searchParams.get("startDate");
        const endDateParam = url.searchParams.get("endDate");

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        const targetMonth = monthParam || `${currentYear}-${currentMonth}`;

        let startDate = startDateParam || `${targetMonth}-01`;
        let endDate = endDateParam || `${targetMonth}-31`;

        // Fetch records for the selected period
        const records = await db.getRecords(userId, { startDate, endDate });

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryMap: Record<string, { type: RecordType; total: number; count: number }> = {};
        const dailyMap: Record<string, { income: number; expense: number }> = {};

        for (const r of records) {
          if (r.type === "expense") {
            totalExpense += r.amount;
          } else {
            totalIncome += r.amount;
          }

          const catKey = `${r.type}:::${r.category}`;
          if (!categoryMap[catKey]) {
            categoryMap[catKey] = { type: r.type, total: 0, count: 0 };
          }
          categoryMap[catKey].total += r.amount;
          categoryMap[catKey].count += 1;

          if (!dailyMap[r.date]) {
            dailyMap[r.date] = { income: 0, expense: 0 };
          }
          if (r.type === "expense") dailyMap[r.date].expense += r.amount;
          else dailyMap[r.date].income += r.amount;
        }

        // Category breakdown array with percentages
        const categoryBreakdown = Object.entries(categoryMap).map(([key, item]) => {
          const category = key.split(":::")[1];
          const baseTotal = item.type === "expense" ? totalExpense : totalIncome;
          const percentage = baseTotal > 0 ? Math.round((item.total / baseTotal) * 100) : 0;
          return {
            category,
            type: item.type,
            total: item.total,
            count: item.count,
            percentage,
          };
        }).sort((a, b) => b.total - a.total);

        // Daily trend array
        const dailyTrends = Object.entries(dailyMap)
          .map(([date, val]) => ({ date, ...val }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Monthly trends (past 6 months)
        const allRecords = await db.getRecords(userId);
        const monthlyTrendsMap: Record<string, { income: number; expense: number }> = {};

        // Generate past 6 months keys
        const past6Months: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentYear, now.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const key = `${y}-${m}`;
          past6Months.push(key);
          monthlyTrendsMap[key] = { income: 0, expense: 0 };
        }

        for (const r of allRecords) {
          const mKey = r.date.substring(0, 7);
          if (monthlyTrendsMap[mKey]) {
            if (r.type === "expense") monthlyTrendsMap[mKey].expense += r.amount;
            else monthlyTrendsMap[mKey].income += r.amount;
          }
        }

        const monthlyTrends = past6Months.map((m) => ({
          month: m,
          income: monthlyTrendsMap[m].income,
          expense: monthlyTrendsMap[m].expense,
          balance: monthlyTrendsMap[m].income - monthlyTrendsMap[m].expense,
        }));

        // Budget summary for current/selected month
        const monthlyLimit = auth.user.budget.monthlyLimit;
        const alertThreshold = auth.user.budget.alertThreshold || 80;
        const percentage = monthlyLimit > 0 ? Math.round((totalExpense / monthlyLimit) * 100) : 0;
        const isOverBudget = monthlyLimit > 0 && totalExpense > monthlyLimit;
        const isNearBudget = monthlyLimit > 0 && !isOverBudget && percentage >= alertThreshold;

        const summary: StatsSummary = {
          period: { startDate, endDate, month: targetMonth },
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          budget: {
            monthlyLimit,
            spent: totalExpense,
            remaining: Math.max(0, monthlyLimit - totalExpense),
            percentage,
            alertThreshold,
            isOverBudget,
            isNearBudget,
            overAmount: Math.max(0, totalExpense - monthlyLimit),
          },
          categoryBreakdown,
          monthlyTrends,
          dailyTrends,
          recordCount: records.length,
        };

        return jsonResponse(summary);
      }

      return jsonResponse({ error: "Endpoint not found" }, 404);
    } catch (err: unknown) {
      console.error("API error:", err);
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return jsonResponse({ error: message }, 500);
    }
  }

  // --- Static Files ---
  return await serveStaticFile(pathname);
}

// Startup
await db.init();
console.log(`🌸 日和記帳 (Hiyori Book) 伺服器已成功啟動！`);
console.log(`💻 電腦本地瀏覽網址：http://localhost:${PORT}`);
console.log(`📱 手機熱點請瀏覽：http://172.20.10.2:${PORT}`);
console.log(`📡 伺服器監聽中 (連接埠: ${PORT})，請保持此視窗開啟...`);

Deno.serve({
  port: PORT,
  hostname: "0.0.0.0",
  onListen({ port, hostname }) {
    // 抑制 Deno 預設的英文 Listening 輸出，改為上方中文提示
  }
}, handler);

