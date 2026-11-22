// ==========================================================
// 日和記帳 (Hiyori Book) - 主應用程式控制邏輯
// ==========================================================

// 分類定義與精緻線性向量 SVG 圖示 (低飽和色調)
const CATEGORIES = {
  expense: [
    {
      name: "餐飲飲食",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
    },
    {
      name: "日常交通",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>`
    },
    {
      name: "居家生活",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
    },
    {
      name: "休閒娛樂",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
    },
    {
      name: "購物消費",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
    },
    {
      name: "醫療健康",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`
    },
    {
      name: "學習成長",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
    },
    {
      name: "其他支出",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    },
  ],
  income: [
    {
      name: "薪水收入",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`
    },
    {
      name: "獎金紅利",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>`
    },
    {
      name: "投資理財",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`
    },
    {
      name: "副業收入",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
    },
    {
      name: "其他收入",
      icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>`
    },
  ],
};

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

let calendar = null;
let currentRecordType = "expense";
let selectedCategory = "餐飲飲食";
let selectedAccount = "現金";
let currentStatsData = null;
let donutChartCurrentType = "expense";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Calendar
  calendar = new CalendarComponent();
  calendar.render();

  // Initialize Auth
  initAuth();

  // Listen for date change on calendar
  calendar.onDateSelected((dateStr) => {
    updateSelectedDateUI(dateStr);
    loadDayRecords(dateStr);
  });

  // Listen for auth state change
  onAuthChanged((user) => {
    updateBudgetBadge();
    if (user) {
      calendar.fetchRecordMarkers();
      loadDayRecords(calendar.getSelectedDateString());
    } else {
      calendar.fetchRecordMarkers();
      renderDayRecords([]);
    }
  });

  // Setup UI components and handlers
  setupRecordModalHandlers();
  setupStatsModalHandlers();
  setupBudgetHeaderHandler();

  // Initial load
  const initialDate = calendar.getSelectedDateString();
  updateSelectedDateUI(initialDate);
});

// Update the Date badge under calendar
function updateSelectedDateUI(dateStr) {
  const badgeDate = document.getElementById("selected-date-badge");
  const badgeWeekday = document.getElementById("selected-weekday-badge");

  badgeDate.textContent = dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    badgeWeekday.textContent = WEEKDAYS[d.getDay()] || "";
  }
}

// Load records for the specific selected date
async function loadDayRecords(dateStr) {
  if (!currentUser) {
    renderDayRecords([]);
    return;
  }

  try {
    const res = await api.getRecords({ date: dateStr });
    renderDayRecords(res.records || []);
  } catch (err) {
    console.error("Failed to load records for date:", err);
    renderDayRecords([]);
  }
}

// Render records into the day-details card
function renderDayRecords(records) {
  const container = document.getElementById("day-record-list");
  const expenseTotalPill = document.getElementById("day-expense-total");
  const incomeTotalPill = document.getElementById("day-income-total");

  let totalExpense = 0;
  let totalIncome = 0;

  records.forEach((r) => {
    if (r.type === "expense") totalExpense += r.amount;
    else totalIncome += r.amount;
  });

  expenseTotalPill.textContent = `支出: NT$ ${totalExpense.toLocaleString()}`;
  incomeTotalPill.textContent = `收入: NT$ ${totalIncome.toLocaleString()}`;

  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <p class="empty-text">本日尚無紀錄，點擊右下角「+」開始記帳</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  records.forEach((record) => {
    const isIncome = record.type === "income";
    const sign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "income" : "expense";

    // Find category icon
    const catList = isIncome ? CATEGORIES.income : CATEGORIES.expense;
    const catObj = catList.find((c) => c.name === record.category);
    const catIcon = catObj ? catObj.icon : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    const card = document.createElement("div");
    card.className = "record-item-card";
    const fullNote = record.note ? record.note.trim() : "";
    const isLongNote = fullNote.length > 8;
    const truncatedNote = isLongNote ? `${fullNote.slice(0, 8)}…` : fullNote;
    const displayTitle = fullNote || record.category;

    card.innerHTML = `
      <div class="record-item-left">
        <span class="record-cat-icon ${isIncome ? "is-income" : ""}">${catIcon}</span>
        <div class="record-item-info">
          <span class="record-item-title ${isLongNote ? "can-expand" : ""}" 
                data-full="${escapeHtml(displayTitle)}" 
                data-short="${escapeHtml(isLongNote ? truncatedNote : displayTitle)}"
                title="${escapeHtml(displayTitle)}">
            ${escapeHtml(isLongNote ? truncatedNote : displayTitle)}
          </span>
          <div class="record-item-meta">
            <span class="record-category-badge">${escapeHtml(record.category)}</span>
            <span>${escapeHtml(record.account || "現金")}</span>
          </div>
        </div>
      </div>
      <div class="record-item-right">
        <span class="record-item-amount ${amountClass}">${sign}NT$ ${record.amount.toLocaleString()}</span>
        <div class="record-actions">
          <button class="btn-icon-action edit-btn" title="編輯此筆紀錄" aria-label="編輯">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon-action delete delete-btn" title="刪除此筆紀錄" aria-label="刪除">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // 點擊長文字展開/收合
    if (isLongNote) {
      const titleSpan = card.querySelector(".record-item-title");
      titleSpan.addEventListener("click", () => {
        titleSpan.classList.toggle("expanded");
        if (titleSpan.classList.contains("expanded")) {
          titleSpan.textContent = titleSpan.dataset.full;
        } else {
          titleSpan.textContent = titleSpan.dataset.short;
        }
      });
    }

    // Edit handler
    card.querySelector(".edit-btn").addEventListener("click", () => {
      openRecordModalForEdit(record);
    });

    // Delete handler
    card.querySelector(".delete-btn").addEventListener("click", async () => {
      if (confirm(`確定要刪除這筆「${record.note || record.category}」NT$ ${record.amount} 的紀錄嗎？`)) {
        try {
          await api.deleteRecord(record.id);
          showToast("已刪除該筆紀錄", "info");
          loadDayRecords(calendar.getSelectedDateString());
          calendar.fetchRecordMarkers();
          updateBudgetBadge();
        } catch (err) {
          showToast(err.message, "error");
        }
      }
    });

    container.appendChild(card);
  });
}

// ==================== 記帳區域彈窗 (+ 號，畫面右下角) ====================
function setupRecordModalHandlers() {
  const btnOpenRecord = document.getElementById("btn-open-record");
  const modal = document.getElementById("modal-record");
  const btnClose = document.getElementById("btn-close-record-modal");
  const form = document.getElementById("record-form");
  const segExpense = document.getElementById("seg-expense");
  const segIncome = document.getElementById("seg-income");
  const customCatInput = document.getElementById("custom-cat-input");
  const quickAmtBtns = document.querySelectorAll(".quick-amt-btn");

  // Open Record Modal
  btnOpenRecord.addEventListener("click", () => {
    if (!currentUser) {
      showToast("請先登入後開始記帳", "warning");
      openAuthModal("login");
      return;
    }
    openRecordModalForCreate();
  });

  btnClose.addEventListener("click", closeRecordModal);
  // 大面積彈窗：停用點擊背景遮罩關閉，僅允許右上角 ✕ 按鈕關閉，防止誤觸
  // modal.addEventListener("click", (e) => {
  //   if (e.target === modal) closeRecordModal();
  // });

  // Switch Expense / Income
  segExpense.addEventListener("click", () => {
    setRecordType("expense");
  });
  segIncome.addEventListener("click", () => {
    setRecordType("income");
  });

  // Quick Amount Buttons (+50, +100, etc.)
  quickAmtBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amtInput = document.getElementById("record-amount");
      const addVal = Number(btn.dataset.amt);
      const currentVal = Number(amtInput.value) || 0;
      const nextVal = currentVal + addVal;
      if (String(nextVal).length <= 8) {
        amtInput.value = nextVal;
      } else {
        amtInput.value = 99999999;
      }
    });
  });

  // Limit amount input to 8 characters max
  const recordAmtInput = document.getElementById("record-amount");
  recordAmtInput.addEventListener("input", () => {
    if (recordAmtInput.value.length > 8) {
      recordAmtInput.value = recordAmtInput.value.slice(0, 8);
    }
  });

  // Custom Category Input
  customCatInput.addEventListener("input", (e) => {
    if (e.target.value.trim()) {
      selectedCategory = e.target.value.trim();
      document.getElementById("current-cat-display").textContent = selectedCategory;
      // unselect pills
      document.querySelectorAll(".category-pill-btn").forEach((p) => p.classList.remove("active"));
    }
  });

  // Payment Account Pills
  const accPills = document.querySelectorAll(".acc-pill");
  accPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      accPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      selectedAccount = pill.dataset.acc;
    });
  });

  // Form Submit (Create or Update)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const recordId = document.getElementById("record-id-input").value;
    const amount = Number(document.getElementById("record-amount").value);
    const date = document.getElementById("record-date").value;
    const note = document.getElementById("record-note").value.trim();

    if (!amount || amount <= 0) {
      showToast("請輸入大於 0 的有效金額", "warning");
      return;
    }
    if (String(Math.round(amount)).length > 8 || amount > 99999999) {
      showToast("金額不可超過 8 位數 (最高 99,999,999)", "warning");
      return;
    }
    if (!date) {
      showToast("請選擇日期", "warning");
      return;
    }
    if (!selectedCategory) {
      showToast("請選擇分類", "warning");
      return;
    }

    const payload = {
      type: currentRecordType,
      amount,
      date,
      category: selectedCategory,
      note,
      account: selectedAccount,
    };

    const submitBtn = document.getElementById("btn-save-record");
    const headerSubmitBtn = document.getElementById("btn-header-save-record");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "儲存中...";
    }
    if (headerSubmitBtn) {
      headerSubmitBtn.disabled = true;
      headerSubmitBtn.textContent = "儲存中...";
    }

    try {
      let resp;
      if (recordId) {
        resp = await api.updateRecord(recordId, payload);
        showToast("紀錄更新成功", "success");
      } else {
        resp = await api.createRecord(payload);
        showToast("記帳成功！", "success");

        // Overspend Alert check
        if (resp.overspendWarning) {
          setTimeout(() => {
            showToast(resp.overspendWarning, "warning", 2600);
          }, 400);
        }
      }

      closeRecordModal();

      // Refresh calendar & day details
      calendar.setSelectedDate(date);
      await calendar.fetchRecordMarkers();
      await loadDayRecords(date);
      await updateBudgetBadge();
    } catch (err) {
      showToast(err.message || "儲存失敗", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "確認儲存";
      }
      if (headerSubmitBtn) {
        headerSubmitBtn.disabled = false;
        headerSubmitBtn.textContent = "確認";
      }
    }
  });
}

function openRecordModalForCreate() {
  const modal = document.getElementById("modal-record");
  document.getElementById("record-modal-title").textContent = "記一筆日常";
  document.getElementById("record-id-input").value = "";
  document.getElementById("record-amount").value = "";
  document.getElementById("record-note").value = "";
  document.getElementById("custom-cat-input").value = "";

  // Set date to current calendar selection
  document.getElementById("record-date").value = calendar.getSelectedDateString();

  setRecordType("expense");
  modal.classList.remove("hidden");
  setTimeout(() => document.getElementById("record-amount").focus(), 100);
}

function openRecordModalForEdit(record) {
  const modal = document.getElementById("modal-record");
  document.getElementById("record-modal-title").textContent = "修改紀錄";
  document.getElementById("record-id-input").value = record.id;
  document.getElementById("record-amount").value = record.amount;
  document.getElementById("record-date").value = record.date;
  document.getElementById("record-note").value = record.note || "";
  document.getElementById("custom-cat-input").value = "";

  setRecordType(record.type, record.category);

  // Set account pill
  selectedAccount = record.account || "現金";
  document.querySelectorAll(".acc-pill").forEach((pill) => {
    if (pill.dataset.acc === selectedAccount) pill.classList.add("active");
    else pill.classList.remove("active");
  });

  modal.classList.remove("hidden");
}

function closeRecordModal() {
  document.getElementById("modal-record").classList.add("hidden");
}

function setRecordType(type, initialCategory = null) {
  currentRecordType = type;
  const segExpense = document.getElementById("seg-expense");
  const segIncome = document.getElementById("seg-income");

  if (type === "expense") {
    segExpense.classList.add("active");
    segIncome.classList.remove("active");
  } else {
    segIncome.classList.add("active");
    segExpense.classList.remove("active");
  }

  // Populate categories
  const catList = CATEGORIES[type] || [];
  const grid = document.getElementById("category-selector-grid");
  grid.innerHTML = "";

  selectedCategory = initialCategory || catList[0]?.name || "其他";
  document.getElementById("current-cat-display").textContent = selectedCategory;

  let matchedPill = false;
  catList.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-pill-btn";
    if (cat.name === selectedCategory) {
      btn.classList.add("active");
      matchedPill = true;
    }

    btn.innerHTML = `
      <span class="cat-btn-icon">${cat.icon}</span>
      <span class="cat-btn-text">${cat.name}</span>
    `;

    btn.addEventListener("click", () => {
      grid.querySelectorAll(".category-pill-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCategory = cat.name;
      document.getElementById("current-cat-display").textContent = cat.name;
      document.getElementById("custom-cat-input").value = "";
    });

    grid.appendChild(btn);
  });

  if (!matchedPill && initialCategory) {
    document.getElementById("custom-cat-input").value = initialCategory;
  }
}

// ==================== 消費統計報表彈窗 (畫面左下角按鈕) ====================
function setupStatsModalHandlers() {
  const btnOpenStats = document.getElementById("btn-open-stats");
  const modal = document.getElementById("modal-stats");
  const btnClose = document.getElementById("btn-close-stats-modal");

  btnOpenStats.addEventListener("click", () => {
    if (!currentUser) {
      showToast("請先登入後查看統計報表", "warning");
      openAuthModal("login");
      return;
    }
    openStatsModal();
  });

  btnClose.addEventListener("click", () => modal.classList.add("hidden"));
  // 大面積彈窗：停用點擊背景遮罩關閉，僅允許右上角 ✕ 按鈕關閉，防止誤觸
  // modal.addEventListener("click", (e) => {
  //   if (e.target === modal) modal.classList.add("hidden");
  // });

  // Chart Tab switching (Donut vs Line Trend)
  const tabBtnDonut = document.getElementById("tab-btn-donut");
  const tabBtnTrend = document.getElementById("tab-btn-trend");
  const paneDonut = document.getElementById("pane-donut");
  const paneTrend = document.getElementById("pane-trend");

  tabBtnDonut.addEventListener("click", () => {
    tabBtnDonut.classList.add("active");
    tabBtnTrend.classList.remove("active");
    paneDonut.classList.add("active");
    paneTrend.classList.remove("active");
  });

  tabBtnTrend.addEventListener("click", () => {
    tabBtnTrend.classList.add("active");
    tabBtnDonut.classList.remove("active");
    paneTrend.classList.add("active");
    paneDonut.classList.remove("active");
    if (currentStatsData) {
      charts.renderMonthlyLineChart("trend-chart-container", currentStatsData.monthlyTrends);
    }
  });

  // Donut chart type toggle (Expense vs Income breakdown)
  const donutExpBtn = document.getElementById("donut-type-expense");
  const donutIncBtn = document.getElementById("donut-type-income");

  donutExpBtn.addEventListener("click", () => {
    donutExpBtn.classList.add("active");
    donutIncBtn.classList.remove("active");
    donutChartCurrentType = "expense";
    renderDonutFromCurrentData();
  });

  donutIncBtn.addEventListener("click", () => {
    donutIncBtn.classList.add("active");
    donutExpBtn.classList.remove("active");
    donutChartCurrentType = "income";
    renderDonutFromCurrentData();
  });

  // Period Filter Pills (本月, 上月, 近30天, 今年)
  const periodPills = document.querySelectorAll("#stats-period-filters .filter-pill");
  periodPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      periodPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      loadStatsReport();
    });
  });

  // Secondary Filters (Type, Category, Keyword)
  document.getElementById("stats-type-select").addEventListener("change", filterStatsTable);
  document.getElementById("stats-category-select").addEventListener("change", filterStatsTable);
  document.getElementById("stats-keyword-input").addEventListener("input", filterStatsTable);

  // Budget Adjust toggle drawer
  const btnToggleBudget = document.getElementById("btn-edit-budget-toggle");
  const drawer = document.getElementById("budget-setting-drawer");
  const btnCancelBudget = document.getElementById("btn-cancel-budget-edit");
  const budgetForm = document.getElementById("budget-setting-form");
  const btnAddRecurring = document.getElementById("btn-add-recurring");
  const catBudgetGrid = document.getElementById("cat-budget-grid");
  const recurringList = document.getElementById("recurring-items-list");

  // 初始化主題預算分類輸入項
  function renderCatBudgetInputs(categoryBudgets = {}) {
    catBudgetGrid.innerHTML = "";
    CATEGORIES.expense.forEach((cat) => {
      const val = categoryBudgets[cat.name] || "";
      const div = document.createElement("div");
      div.className = "cat-budget-item";
      div.innerHTML = `
        <span class="cat-budget-label">${cat.name}</span>
        <input type="number" class="form-input cat-budget-input" data-category="${escapeHtml(cat.name)}" 
               placeholder="未設" min="0" step="500" value="${val}">
      `;
      catBudgetGrid.appendChild(div);
    });
  }

  // 初始化固定收支列
  function addRecurringRow(item = { id: "", name: "", type: "expense", amount: "", category: "餐飲飲食", dayOfMonth: 1 }) {
    const row = document.createElement("div");
    row.className = "recurring-row";
    row.dataset.id = item.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const catOptions = (item.type === "income" ? CATEGORIES.income : CATEGORIES.expense)
      .map(c => `<option value="${c.name}" ${c.name === item.category ? "selected" : ""}>${c.name}</option>`)
      .join("");

    row.innerHTML = `
      <input type="text" class="form-input recurring-name" placeholder="項目 (如:房租/薪水)" value="${escapeHtml(item.name || "")}">
      <select class="form-select recurring-type">
        <option value="expense" ${item.type === "expense" ? "selected" : ""}>支出</option>
        <option value="income" ${item.type === "income" ? "selected" : ""}>收入</option>
      </select>
      <select class="form-select recurring-cat">
        ${catOptions}
      </select>
      <input type="number" class="form-input recurring-amount" placeholder="金額" min="1" value="${item.amount || ""}">
      <button type="button" class="btn btn-ghost btn-xs btn-del-recurring" title="刪除">✕</button>
    `;

    // 類型切換時連帶更新分類下拉選單
    const typeSelect = row.querySelector(".recurring-type");
    const catSelect = row.querySelector(".recurring-cat");
    typeSelect.addEventListener("change", () => {
      const isInc = typeSelect.value === "income";
      const list = isInc ? CATEGORIES.income : CATEGORIES.expense;
      catSelect.innerHTML = list.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
    });

    row.querySelector(".btn-del-recurring").addEventListener("click", () => row.remove());
    recurringList.appendChild(row);
  }

  btnAddRecurring.addEventListener("click", () => addRecurringRow());

  btnToggleBudget.addEventListener("click", () => {
    drawer.classList.toggle("hidden");
    if (!drawer.classList.contains("hidden")) {
      const curLimit = currentUser?.budget?.monthlyLimit || 20000;
      const curThresh = currentUser?.budget?.alertThreshold || 80;
      document.getElementById("budget-limit-input").value = curLimit;
      document.getElementById("budget-threshold-input").value = curThresh;

      renderCatBudgetInputs(currentUser?.budget?.categoryBudgets || {});
      recurringList.innerHTML = "";
      const recurrings = currentUser?.budget?.recurringItems || [];
      if (recurrings.length === 0) {
        addRecurringRow({ name: "每月薪資", type: "income", amount: 45000, category: "薪水收入", dayOfMonth: 5 });
        addRecurringRow({ name: "房屋租金", type: "expense", amount: 12000, category: "居家生活", dayOfMonth: 1 });
      } else {
        recurrings.forEach(item => addRecurringRow(item));
      }
    }
  });

  btnCancelBudget.addEventListener("click", () => drawer.classList.add("hidden"));

  budgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const limit = Number(document.getElementById("budget-limit-input").value);
    const threshold = Number(document.getElementById("budget-threshold-input").value);

    // 蒐集主題分類預算
    const categoryBudgets = {};
    document.querySelectorAll(".cat-budget-input").forEach(input => {
      const amt = Number(input.value);
      if (!isNaN(amt) && amt > 0) {
        categoryBudgets[input.dataset.category] = amt;
      }
    });

    // 蒐集每月固定收支
    const recurringItems = [];
    document.querySelectorAll(".recurring-row").forEach(row => {
      const name = row.querySelector(".recurring-name").value.trim();
      const type = row.querySelector(".recurring-type").value;
      const category = row.querySelector(".recurring-cat").value;
      const amount = Number(row.querySelector(".recurring-amount").value);
      if (name && !isNaN(amount) && amount > 0) {
        recurringItems.push({
          id: row.dataset.id,
          name,
          type,
          category,
          amount,
          dayOfMonth: 1,
        });
      }
    });

    try {
      const resp = await api.updateBudget(limit, threshold, { categoryBudgets, recurringItems });
      if (currentUser) {
        currentUser.budget = resp.budget;
      }
      showToast("預算與每月固定收支已更新", "success");
      drawer.classList.add("hidden");
      loadStatsReport();
      updateBudgetBadge();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // Export CSV
  document.getElementById("btn-export-csv").addEventListener("click", exportRecordsToCSV);
  const btnToggleLegend = document.getElementById("btn-toggle-mobile-legend");
  const legendWrapper = document.querySelector(".donut-legend-wrapper");
  const legendToggleText = document.getElementById("legend-toggle-text");
  if (btnToggleLegend && legendWrapper) {
    // 預設為收起狀態
    legendWrapper.classList.add("collapsed");
    btnToggleLegend.addEventListener("click", () => {
      legendWrapper.classList.toggle("collapsed");
      const isCollapsed = legendWrapper.classList.contains("collapsed");
      legendToggleText.textContent = isCollapsed ? "展開分類圖例" : "收合分類圖例";
    });
  }
}

async function openStatsModal() {
  const modal = document.getElementById("modal-stats");
  modal.classList.remove("hidden");
  await loadStatsReport();
}

async function loadStatsReport() {
  const activePeriodBtn = document.querySelector("#stats-period-filters .filter-pill.active");
  const period = activePeriodBtn?.dataset?.period || "this-month";

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based

  let startDate, endDate, monthParam;

  if (period === "this-month") {
    const curMStr = String(m + 1).padStart(2, "0");
    monthParam = `${y}-${curMStr}`;
    startDate = `${y}-${curMStr}-01`;
    endDate = `${y}-${curMStr}-31`;
  } else if (period === "last-month") {
    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const prevMStr = String(prevM + 1).padStart(2, "0");
    monthParam = `${prevY}-${prevMStr}`;
    startDate = `${prevY}-${prevMStr}-01`;
    endDate = `${prevY}-${prevMStr}-31`;
  } else if (period === "recent-30") {
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate = d30.toISOString().slice(0, 10);
    endDate = now.toISOString().slice(0, 10);
  } else if (period === "all-year") {
    startDate = `${y}-01-01`;
    endDate = `${y}-12-31`;
  }

  try {
    const data = await api.getStats({ month: monthParam, startDate, endDate });
    currentStatsData = data;

    // Render KPIs
    document.getElementById("stats-total-expense").textContent = `NT$ ${data.totalExpense.toLocaleString()}`;
    document.getElementById("stats-total-income").textContent = `NT$ ${data.totalIncome.toLocaleString()}`;
    const balanceSign = data.balance >= 0 ? "+" : "-";
    document.getElementById("stats-net-balance").textContent = `${balanceSign}NT$ ${Math.abs(data.balance).toLocaleString()}`;

    // Render Budget & Overspend Alert
    renderBudgetCard(data.budget);

    // Populate Category select options
    populateCategoryFilterOptions(data.categoryBreakdown);

    // Render Donut Chart
    renderDonutFromCurrentData();

    // Render Monthly Line Chart
    charts.renderMonthlyLineChart("trend-chart-container", data.monthlyTrends);

    // Fetch and render Table records
    const recordsResp = await api.getRecords({ startDate, endDate });
    window._cachedStatsRecords = recordsResp.records || [];
    filterStatsTable();
  } catch (err) {
    console.error("Failed to load stats:", err);
    showToast("載入報表失敗: " + err.message, "error");
  }
}

function renderBudgetCard(budget) {
  const budgetCard = document.getElementById("budget-card");
  const statusPill = document.getElementById("budget-status-pill");
  const limitsText = document.getElementById("budget-limits-text");
  const progressBar = document.getElementById("budget-progress-bar");
  const percentText = document.getElementById("budget-percent-text");
  const remainText = document.getElementById("budget-remain-text");
  const alertBox = document.getElementById("overspend-alert-box");
  const alertMsg = document.getElementById("overspend-alert-msg");

  budgetCard.classList.remove("is-warning", "is-over");
  alertBox.classList.add("hidden");

  const limit = budget.monthlyLimit || 0;
  const spent = budget.spent || 0;
  const pct = budget.percentage || 0;

  limitsText.textContent = `本月預算: NT$ ${limit.toLocaleString()} / 已支出 NT$ ${spent.toLocaleString()}`;
  percentText.textContent = `已使用 ${pct}%`;
  progressBar.style.width = `${Math.min(100, pct)}%`;

  if (limit <= 0) {
    statusPill.textContent = "未設定上限";
    remainText.textContent = "尚未設定預算上限";
    return;
  }

  if (budget.isOverBudget) {
    budgetCard.classList.add("is-over");
    statusPill.textContent = "已超支";
    remainText.textContent = `已超支 NT$ ${(budget.overAmount || spent - limit).toLocaleString()}`;
    alertBox.classList.remove("hidden");
    alertMsg.textContent = `注意：本月支出累計 NT$ ${spent.toLocaleString()}，已超出預算 NT$ ${(spent - limit).toLocaleString()} (${pct}%)！`;
  } else if (budget.isNearBudget) {
    budgetCard.classList.add("is-warning");
    statusPill.textContent = "接近預算上限";
    remainText.textContent = `剩餘 NT$ ${(budget.remaining).toLocaleString()}`;
    alertBox.classList.remove("hidden");
    alertMsg.textContent = `提示：本月支出已達預算 ${pct}%，剩餘可支配金額 NT$ ${budget.remaining.toLocaleString()}`;
  } else {
    statusPill.textContent = "掌控良好";
    remainText.textContent = `剩餘 NT$ ${budget.remaining.toLocaleString()}`;
  }
}

function renderDonutFromCurrentData() {
  if (!currentStatsData) return;
  const filtered = currentStatsData.categoryBreakdown.filter((c) => c.type === donutChartCurrentType);
  charts.renderDonutChart(
    "donut-chart-container",
    "donut-legend-container",
    filtered,
    donutChartCurrentType === "expense" ? "支出" : "收入"
  );
}

function populateCategoryFilterOptions(breakdown) {
  const select = document.getElementById("stats-category-select");
  const curVal = select.value;
  select.innerHTML = '<option value="all">全部分類</option>';

  const uniqueCats = Array.from(new Set(breakdown.map((b) => b.category)));
  uniqueCats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  if (uniqueCats.includes(curVal)) {
    select.value = curVal;
  }
}

function filterStatsTable() {
  const records = window._cachedStatsRecords || [];
  const typeFilter = document.getElementById("stats-type-select").value;
  const categoryFilter = document.getElementById("stats-category-select").value;
  const keyword = document.getElementById("stats-keyword-input").value.trim().toLowerCase();

  let filtered = records;
  if (typeFilter !== "all") {
    filtered = filtered.filter((r) => r.type === typeFilter);
  }
  if (categoryFilter !== "all") {
    filtered = filtered.filter((r) => r.category === categoryFilter);
  }
  if (keyword) {
    filtered = filtered.filter(
      (r) =>
        r.note.toLowerCase().includes(keyword) ||
        r.category.toLowerCase().includes(keyword) ||
        (r.account && r.account.toLowerCase().includes(keyword))
    );
  }

  renderStatsTable(filtered);
}

function renderStatsTable(records) {
  const tbody = document.getElementById("stats-table-body");
  const countSpan = document.getElementById("stats-record-count");
  countSpan.textContent = records.length;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">
          <div style="margin-bottom: 6px; display: inline-flex; justify-content: center;">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div>沒有符合條件的紀錄</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";
  records.forEach((r) => {
    const tr = document.createElement("tr");
    const isIncome = r.type === "income";
    const typeLabel = isIncome ? "收入" : "支出";
    const typeClass = isIncome ? "pill-income" : "pill-expense";
    const sign = isIncome ? "+" : "-";

    tr.innerHTML = `
      <td>${r.date}</td>
      <td><span class="pill ${typeClass}">${typeLabel}</span></td>
      <td><strong>${escapeHtml(r.category)}</strong></td>
      <td>${escapeHtml(r.note || "-")}</td>
      <td>${escapeHtml(r.account || "現金")}</td>
      <td class="text-right" style="font-weight: 700; color: var(${isIncome ? "--color-income" : "--color-expense"});">
        ${sign}NT$ ${r.amount.toLocaleString()}
      </td>
      <td class="text-center">
        <button class="btn-icon-action edit-btn" title="編輯" aria-label="編輯">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon-action delete delete-btn" title="刪除" aria-label="刪除">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </td>
    `;

    tr.querySelector(".edit-btn").addEventListener("click", () => {
      document.getElementById("modal-stats").classList.add("hidden");
      openRecordModalForEdit(r);
    });

    tr.querySelector(".delete-btn").addEventListener("click", async () => {
      if (confirm(`確定刪除「${r.note || r.category}」NT$ ${r.amount} 嗎？`)) {
        try {
          await api.deleteRecord(r.id);
          showToast("已刪除紀錄", "info");
          loadStatsReport();
          calendar.fetchRecordMarkers();
          loadDayRecords(calendar.getSelectedDateString());
          updateBudgetBadge();
        } catch (err) {
          showToast(err.message, "error");
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function exportRecordsToCSV() {
  const records = window._cachedStatsRecords || [];
  if (records.length === 0) {
    showToast("目前沒有可匯出的紀錄", "warning");
    return;
  }

  let csv = "\uFEFF日期,類型,分類,項目說明,支付方式,金額\n";
  records.forEach((r) => {
    const typeText = r.type === "income" ? "收入" : "支出";
    const noteSafe = (r.note || "").replace(/"/g, '""');
    csv += `"${r.date}","${typeText}","${r.category}","${noteSafe}","${r.account || "現金"}",${r.amount}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `日和記帳明細_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("已匯出 CSV 檔", "success");
}

// ==================== 頂部預算 Mini 標籤 ====================
function setupBudgetHeaderHandler() {
  const badge = document.getElementById("header-budget-badge");
  badge.addEventListener("click", () => {
    openStatsModal();
    // open drawer
    setTimeout(() => {
      const drawer = document.getElementById("budget-setting-drawer");
      drawer.classList.remove("hidden");
    }, 200);
  });
}

async function updateBudgetBadge() {
  const badge = document.getElementById("header-budget-badge");
  const text = document.getElementById("header-budget-text");

  if (!currentUser) {
    badge.classList.add("hidden");
    return;
  }

  try {
    const data = await api.getBudget();
    badge.classList.remove("hidden");

    if (data.budget.monthlyLimit > 0) {
      if (data.isOverBudget) {
        text.textContent = `超支 NT$ ${data.overAmount.toLocaleString()} (${data.percentage}%)`;
        badge.style.background = "var(--color-expense-light)";
        badge.style.color = "var(--color-expense)";
      } else if (data.isNearBudget) {
        text.textContent = `預算已用 ${data.percentage}%`;
        badge.style.background = "var(--color-warning-light)";
        badge.style.color = "var(--color-warning)";
      } else {
        text.textContent = `剩餘 NT$ ${data.remaining.toLocaleString()}`;
        badge.style.background = "var(--color-primary-blue-light)";
        badge.style.color = "var(--color-primary-blue-hover)";
      }
    } else {
      text.textContent = `本月支出 NT$ ${data.spent.toLocaleString()}`;
      badge.style.background = "var(--color-purple-gray-light)";
      badge.style.color = "var(--color-purple-gray)";
    }
  } catch {
    badge.classList.add("hidden");
  }
}

// Security Helper
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

