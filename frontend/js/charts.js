// ==========================================================
// 日和記帳 - 簡約日系視覺圖表模組 (純原生 SVG 圓餅圖與折線圖)
// 免外部 CDN，低飽和度日系配色，流暢自適應
// ==========================================================

const JAPANESE_PALETTE = [
  "#7392B7", // 薄花藍
  "#7D788B", // 藤鼠紫灰
  "#B86B6B", // 撫子落櫻
  "#5C8D78", // 青瓷苔綠
  "#B88942", // 琥珀金
  "#8FA89B", // 淺草青
  "#9590A4", // 鳩羽紫
  "#C28D8D", // 灰粉
  "#7B8FA1", // 藍灰
  "#A4B8CD", // 雲藍
];

const charts = {
  /**
   * 繪製各分類收支圓餅圖 (SVG Donut Chart)
   * @param {string} containerId - 容器 ID
   * @param {string} legendContainerId - 圖例容器 ID
   * @param {Array<{ category: string, total: number, percentage: number }>} data - 資料
   * @param {string} typeLabel - "支出" 或 "收入"
   */
  renderDonutChart(containerId, legendContainerId, data, typeLabel = "支出") {
    const container = document.getElementById(containerId);
    const legendContainer = document.getElementById(legendContainerId);
    if (!container || !legendContainer) return;

    container.innerHTML = "";
    legendContainer.innerHTML = "";

    const total = data.reduce((sum, item) => sum + item.total, 0);

    if (!data || data.length === 0 || total === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 30px;">
          <div style="margin-bottom: 8px; display: inline-flex; justify-content: center;">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div>此區間尚無${typeLabel}分類資料</div>
        </div>
      `;
      legendContainer.innerHTML = "";
      return;
    }

    const size = 220;
    const center = size / 2;
    const radius = 80;
    const innerRadius = 52; // Donut hole

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.maxWidth = `${size}px`;
    svg.style.maxHeight = `${size}px`;

    let cumulativeAngle = -Math.PI / 2; // Start from top (12 o'clock)

    // Center Summary Text in Donut Hole
    const centerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    centerGroup.setAttribute("text-anchor", "middle");

    const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerLabel.setAttribute("x", `${center}`);
    centerLabel.setAttribute("y", `${center - 6}`);
    centerLabel.setAttribute("font-size", "11");
    centerLabel.setAttribute("fill", "var(--text-secondary)");
    centerLabel.setAttribute("font-family", "inherit");
    centerLabel.textContent = `總${typeLabel}`;

    const centerVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerVal.setAttribute("x", `${center}`);
    centerVal.setAttribute("y", `${center + 14}`);
    centerVal.setAttribute("font-size", "14");
    centerVal.setAttribute("font-weight", "700");
    centerVal.setAttribute("fill", "var(--text-main)");
    centerVal.setAttribute("font-family", "inherit");
    centerVal.textContent = `$${total > 99999 ? Math.round(total / 1000) + "k" : total.toLocaleString()}`;

    centerGroup.appendChild(centerLabel);
    centerGroup.appendChild(centerVal);

    // Render Slices
    data.forEach((item, index) => {
      const sliceColor = JAPANESE_PALETTE[index % JAPANESE_PALETTE.length];
      const sliceAngle = (item.total / total) * 2 * Math.PI;

      // Handle single item 100% full circle edge case
      if (data.length === 1 || sliceAngle >= 2 * Math.PI - 0.001) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", `${center}`);
        circle.setAttribute("cy", `${center}`);
        circle.setAttribute("r", `${(radius + innerRadius) / 2}`);
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", sliceColor);
        circle.setAttribute("stroke-width", `${radius - innerRadius}`);
        svg.appendChild(circle);
      } else {
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + sliceAngle;

        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);

        const x3 = center + innerRadius * Math.cos(endAngle);
        const y3 = center + innerRadius * Math.sin(endAngle);
        const x4 = center + innerRadius * Math.cos(startAngle);
        const y4 = center + innerRadius * Math.sin(startAngle);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${x3} ${y3}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
          "Z",
        ].join(" ");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", sliceColor);
        path.style.transition = "transform 0.2s ease, opacity 0.2s ease";
        path.style.cursor = "pointer";

        path.addEventListener("mouseenter", () => {
          path.style.opacity = "0.85";
          centerLabel.textContent = item.category;
          centerVal.textContent = `$${item.total.toLocaleString()}`;
        });
        path.addEventListener("mouseleave", () => {
          path.style.opacity = "1";
          centerLabel.textContent = `總${typeLabel}`;
          centerVal.textContent = `$${total > 99999 ? Math.round(total / 1000) + "k" : total.toLocaleString()}`;
        });

        svg.appendChild(path);
        cumulativeAngle += sliceAngle;
      }

      // Add item to legend
      const legendRow = document.createElement("div");
      legendRow.className = "legend-row";
      legendRow.innerHTML = `
        <div class="legend-left">
          <span class="legend-color-box" style="background-color: ${sliceColor}"></span>
          <span class="legend-name">${item.category}</span>
        </div>
        <div class="legend-right">
          <span class="legend-amt">NT$ ${item.total.toLocaleString()}</span>
          <span class="legend-pct">${item.percentage}%</span>
        </div>
      `;
      legendContainer.appendChild(legendRow);
    });

    svg.appendChild(centerGroup);
    container.appendChild(svg);
  },

  /**
   * 繪製月消費走勢折線圖 (SVG Monthly Expense Trend Line Chart)
   * @param {string} containerId - 容器 ID
   * @param {Array<{ month: string, expense: number, income: number }>} data - 近六個月資料
   */
  renderMonthlyLineChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 40px;">
          尚無趨勢數據
        </div>
      `;
      return;
    }

    const width = 640;
    const height = 240;
    const padLeft = 55;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Find maximum amount for scale
    const maxVal = Math.max(...data.map((d) => Math.max(d.expense, d.income, 1000)));
    const roundedMax = Math.ceil(maxVal / 5000) * 5000 || 5000;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.overflow = "visible";

    // Gradient definition for area fill
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="expGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#B86B6B" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#B86B6B" stop-opacity="0.02" />
      </linearGradient>
      <linearGradient id="incGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5C8D78" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#5C8D78" stop-opacity="0.02" />
      </linearGradient>
    `;
    svg.appendChild(defs);

    // Horizontal Grid Lines & Y-Axis Labels (4 ticks)
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((roundedMax / 4) * i);
      const y = padTop + chartH - (i / 4) * chartH;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", `${padLeft}`);
      line.setAttribute("y1", `${y}`);
      line.setAttribute("x2", `${padLeft + chartW}`);
      line.setAttribute("y2", `${y}`);
      line.setAttribute("stroke", "#E8ECF1");
      line.setAttribute("stroke-dasharray", i === 0 ? "none" : "3,3");
      svg.appendChild(line);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", `${padLeft - 10}`);
      text.setAttribute("y", `${y + 4}`);
      text.setAttribute("font-size", "10");
      text.setAttribute("text-anchor", "end");
      text.setAttribute("fill", "var(--text-muted)");
      text.setAttribute("font-family", "inherit");
      text.textContent = val >= 1000 ? `${val / 1000}k` : `${val}`;
      svg.appendChild(text);
    }

    // Calculate Points
    const stepX = chartW / Math.max(1, data.length - 1);

    const expensePoints = data.map((d, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + chartH - (d.expense / roundedMax) * chartH;
      return { x, y, val: d.expense, month: d.month };
    });

    const incomePoints = data.map((d, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + chartH - (d.income / roundedMax) * chartH;
      return { x, y, val: d.income, month: d.month };
    });

    // Helper: Build SVG Path Data
    const buildPath = (pts) => pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // 1. Draw Income Line & Area (Green / Soft Sage)
    const incomeLinePath = buildPath(incomePoints);
    const incomeAreaPath = `${incomeLinePath} L ${incomePoints[incomePoints.length - 1].x} ${padTop + chartH} L ${incomePoints[0].x} ${padTop + chartH} Z`;

    const incomeArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    incomeArea.setAttribute("d", incomeAreaPath);
    incomeArea.setAttribute("fill", "url(#incGradient)");
    svg.appendChild(incomeArea);

    const incomeLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    incomeLine.setAttribute("d", incomeLinePath);
    incomeLine.setAttribute("fill", "none");
    incomeLine.setAttribute("stroke", "#5C8D78");
    incomeLine.setAttribute("stroke-width", "2.5");
    svg.appendChild(incomeLine);

    // 2. Draw Expense Line & Area (Soft Muted Rose Red)
    const expenseLinePath = buildPath(expensePoints);
    const expenseAreaPath = `${expenseLinePath} L ${expensePoints[expensePoints.length - 1].x} ${padTop + chartH} L ${expensePoints[0].x} ${padTop + chartH} Z`;

    const expenseArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    expenseArea.setAttribute("d", expenseAreaPath);
    expenseArea.setAttribute("fill", "url(#expGradient)");
    svg.appendChild(expenseArea);

    const expenseLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    expenseLine.setAttribute("d", expenseLinePath);
    expenseLine.setAttribute("fill", "none");
    expenseLine.setAttribute("stroke", "#B86B6B");
    expenseLine.setAttribute("stroke-width", "2.5");
    svg.appendChild(expenseLine);

    // 3. Draw Nodes & X-Axis Labels
    data.forEach((d, i) => {
      const expPt = expensePoints[i];
      const incPt = incomePoints[i];

      // X-Axis Month label (e.g. "11月" or "2026/11")
      const monthLabel = d.month.includes("-") ? `${d.month.split("-")[1]}月` : d.month;
      const xText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      xText.setAttribute("x", `${expPt.x}`);
      xText.setAttribute("y", `${padTop + chartH + 20}`);
      xText.setAttribute("font-size", "11");
      xText.setAttribute("text-anchor", "middle");
      xText.setAttribute("fill", "var(--text-secondary)");
      xText.setAttribute("font-family", "inherit");
      xText.textContent = monthLabel;
      svg.appendChild(xText);

      // Income Node
      const incCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      incCircle.setAttribute("cx", `${incPt.x}`);
      incCircle.setAttribute("cy", `${incPt.y}`);
      incCircle.setAttribute("r", "4.5");
      incCircle.setAttribute("fill", "#FFFFFF");
      incCircle.setAttribute("stroke", "#5C8D78");
      incCircle.setAttribute("stroke-width", "2.5");
      incCircle.style.cursor = "pointer";

      const incTitle = document.createElementNS("http://www.w3.org/2000/svg", "title");
      incTitle.textContent = `${d.month} 收入: NT$ ${d.income.toLocaleString()}`;
      incCircle.appendChild(incTitle);
      svg.appendChild(incCircle);

      // Expense Node
      const expCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      expCircle.setAttribute("cx", `${expPt.x}`);
      expCircle.setAttribute("cy", `${expPt.y}`);
      expCircle.setAttribute("r", "4.5");
      expCircle.setAttribute("fill", "#FFFFFF");
      expCircle.setAttribute("stroke", "#B86B6B");
      expCircle.setAttribute("stroke-width", "2.5");
      expCircle.style.cursor = "pointer";

      const expTitle = document.createElementNS("http://www.w3.org/2000/svg", "title");
      expTitle.textContent = `${d.month} 支出: NT$ ${d.expense.toLocaleString()}`;
      expCircle.appendChild(expTitle);
      svg.appendChild(expCircle);
    });

    // Legend at Top Right
    const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legendGroup.innerHTML = `
      <g transform="translate(${width - 150}, 14)">
        <circle cx="6" cy="6" r="4" fill="#B86B6B" />
        <text x="16" y="9" font-size="11" fill="var(--text-secondary)" font-family="inherit">支出</text>
        <circle cx="60" cy="6" r="4" fill="#5C8D78" />
        <text x="70" y="9" font-size="11" fill="var(--text-secondary)" font-family="inherit">收入</text>
      </g>
    `;
    svg.appendChild(legendGroup);

    container.appendChild(svg);
  },
};

