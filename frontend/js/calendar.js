// ==========================================================
// 日和記帳 - 固定中央偏上日曆元件 (Calendar Component)
// ==========================================================

class CalendarComponent {
  constructor() {
    this.currentDate = new Date(); // Viewing month
    this.selectedDate = new Date(); // Currently selected day (defaults to today)
    this.datesWithRecords = {}; // { 'YYYY-MM-DD': { hasExpense, hasIncome, ... } }
    this.onDateSelectedCallbacks = [];

    this.initElements();
    this.setupListeners();
  }

  initElements() {
    this.displayMonth = document.getElementById("cal-month-display");
    this.daysGrid = document.getElementById("calendar-days-grid");
    this.btnPrev = document.getElementById("cal-prev");
    this.btnNext = document.getElementById("cal-next");
    this.btnToday = document.getElementById("cal-today-btn");
  }

  setupListeners() {
    this.btnPrev.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
      this.fetchRecordMarkers();
    });

    this.btnNext.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
      this.fetchRecordMarkers();
    });

    this.btnToday.addEventListener("click", () => {
      const now = new Date();
      this.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
      this.selectedDate = new Date(now);
      this.render();
      this.fetchRecordMarkers();
      this.triggerDateSelected(this.formatDate(this.selectedDate));
    });
  }

  onDateSelected(cb) {
    this.onDateSelectedCallbacks.push(cb);
  }

  triggerDateSelected(dateStr) {
    for (const cb of this.onDateSelectedCallbacks) {
      cb(dateStr);
    }
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  getSelectedDateString() {
    return this.formatDate(this.selectedDate);
  }

  setSelectedDate(dateStr) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      this.selectedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      this.currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      this.render();
      this.fetchRecordMarkers();
      this.triggerDateSelected(dateStr);
    }
  }

  async fetchRecordMarkers() {
    if (!currentUser) {
      this.datesWithRecords = {};
      this.updateIndicators();
      return;
    }

    const year = this.currentDate.getFullYear();
    const month = String(this.currentDate.getMonth() + 1).padStart(2, "0");

    try {
      const res = await api.getDatesWithRecords(year, month);
      this.datesWithRecords = res.dates || {};
      this.updateIndicators();
    } catch {
      this.datesWithRecords = {};
    }
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth(); // 0-based

    // Format display: e.g. "2026年 11月"
    this.displayMonth.textContent = `${year}年 ${month + 1}月`;

    this.daysGrid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayStr = this.formatDate(new Date());
    const selectedStr = this.formatDate(this.selectedDate);

    // Days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = this.formatDate(prevDate);

      const cell = document.createElement("div");
      cell.className = "cal-day-cell other-month";
      cell.innerHTML = `<span class="cal-day-num">${dayNum}</span><div class="cal-indicators" data-date="${dateStr}"></div>`;
      cell.addEventListener("click", () => {
        this.selectedDate = prevDate;
        this.currentDate = new Date(prevDate.getFullYear(), prevDate.getMonth(), 1);
        this.render();
        this.fetchRecordMarkers();
        this.triggerDateSelected(dateStr);
      });
      this.daysGrid.appendChild(cell);
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const thisDate = new Date(year, month, day);
      const dateStr = this.formatDate(thisDate);

      const cell = document.createElement("div");
      cell.className = "cal-day-cell";
      cell.dataset.date = dateStr;

      if (dateStr === todayStr) {
        cell.classList.add("today");
      }
      if (dateStr === selectedStr) {
        cell.classList.add("selected");
      }

      cell.innerHTML = `<span class="cal-day-num">${day}</span><div class="cal-indicators" data-date="${dateStr}"></div>`;

      cell.addEventListener("click", () => {
        this.selectedDate = thisDate;
        const prevSelected = this.daysGrid.querySelector(".cal-day-cell.selected");
        if (prevSelected) prevSelected.classList.remove("selected");
        cell.classList.add("selected");
        this.triggerDateSelected(dateStr);
      });

      this.daysGrid.appendChild(cell);
    }

    // Trailing days from next month to complete the row
    const totalCellsFilled = firstDayIndex + totalDays;
    const nextDaysNeeded = (7 - (totalCellsFilled % 7)) % 7;
    for (let j = 1; j <= nextDaysNeeded; j++) {
      const nextDate = new Date(year, month + 1, j);
      const dateStr = this.formatDate(nextDate);

      const cell = document.createElement("div");
      cell.className = "cal-day-cell other-month";
      cell.innerHTML = `<span class="cal-day-num">${j}</span><div class="cal-indicators" data-date="${dateStr}"></div>`;
      cell.addEventListener("click", () => {
        this.selectedDate = nextDate;
        this.currentDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
        this.render();
        this.fetchRecordMarkers();
        this.triggerDateSelected(dateStr);
      });
      this.daysGrid.appendChild(cell);
    }

    this.updateIndicators();
  }

  updateIndicators() {
    const indicatorContainers = this.daysGrid.querySelectorAll(".cal-indicators");
    indicatorContainers.forEach((container) => {
      const dateStr = container.dataset.date;
      const marker = this.datesWithRecords[dateStr];
      container.innerHTML = "";

      if (marker) {
        if (marker.hasExpense) {
          const expDot = document.createElement("span");
          expDot.className = "dot dot-expense";
          expDot.title = `支出: NT$ ${marker.expenseTotal}`;
          container.appendChild(expDot);
        }
        if (marker.hasIncome) {
          const incDot = document.createElement("span");
          incDot.className = "dot dot-income";
          incDot.title = `收入: NT$ ${marker.incomeTotal}`;
          container.appendChild(incDot);
        }
      }
    });
  }
}

