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

/* ============================================================
 * Chart Lightbox — 支援雙指縮放 (Pinch-to-zoom)、拖曳平移與工具列
 * ============================================================ */
(function initChartLightbox() {
  let currentScale = 1.0;
  let panX = 0;
  let panY = 0;

  // Touch 手勢狀態
  let initialTouchDist = null;
  let startScale = 1.0;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTapTime = 0;

  // 滑鼠拖曳狀態
  let isMouseDragging = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  function getElements() {
    return {
      overlay: document.getElementById('modal-chart-lightbox'),
      closeBtn: document.getElementById('btn-lightbox-close'),
      titleEl: document.getElementById('lightbox-title'),
      viewport: document.getElementById('chart-zoom-viewport'),
      content: document.getElementById('chart-zoom-content'),
      legendArea: document.getElementById('chart-lightbox-legend-area'),
      zoomBadge: document.getElementById('lightbox-zoom-badge'),
      btnZoomIn: document.getElementById('btn-zoom-in'),
      btnZoomOut: document.getElementById('btn-zoom-out'),
      btnZoomReset: document.getElementById('btn-zoom-reset'),
      zoomDonut: document.getElementById('btn-zoom-donut'),
      zoomTrend: document.getElementById('btn-zoom-trend'),
      donutContainer: document.getElementById('donut-chart-container'),
      trendContainer: document.getElementById('trend-chart-container'),
    };
  }

  function updateTransform(withTransition = false) {
    const { content, zoomBadge } = getElements();
    if (!content) return;

    if (withTransition) {
      content.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)';
    } else {
      content.style.transition = 'none';
    }

    content.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;

    if (zoomBadge) {
      zoomBadge.textContent = `${Math.round(currentScale * 100)}%`;
    }
  }

  function setScale(newScale, withTransition = true) {
    currentScale = Math.min(Math.max(newScale, 0.8), 4.0);
    if (currentScale <= 1.0) {
      panX = 0;
      panY = 0;
    }
    updateTransform(withTransition);
  }

  function resetZoom() {
    currentScale = 1.0;
    panX = 0;
    panY = 0;
    updateTransform(true);
  }

  function openLightbox(sourceId, title) {
    const { overlay, titleEl, content, legendArea } = getElements();
    if (!overlay || !content || !titleEl) return;

    const src = document.getElementById(sourceId);
    if (!src) return;

    content.innerHTML = '';
    if (legendArea) legendArea.innerHTML = '';
    titleEl.textContent = title;

    const isTrend = sourceId === 'trend-chart-container';
    if (isTrend) {
      content.classList.add('is-trend');
    } else {
      content.classList.remove('is-trend');
    }

    const svgEl = src.querySelector('svg');
    if (svgEl) {
      const clonedSvg = svgEl.cloneNode(true);
      clonedSvg.removeAttribute('width');
      clonedSvg.removeAttribute('height');
      clonedSvg.style.width = '100%';
      clonedSvg.style.height = 'auto';

      if (!isTrend) {
        clonedSvg.style.maxWidth = '280px';
        clonedSvg.style.maxHeight = '280px';
      }

      content.appendChild(clonedSvg);
    } else {
      content.innerHTML = '<div style="padding: 30px; color: var(--text-muted); font-size: 0.88rem; text-align: center;">尚無圖表數據可放大顯示</div>';
    }

    // 若是圓餅圖，同時在下方獨立區域放入圖例
    if (sourceId === 'donut-chart-container' && legendArea) {
      const legendSrc = document.getElementById('donut-legend-container');
      if (legendSrc && legendSrc.children.length > 0) {
        const legendWrap = document.createElement('div');
        legendWrap.className = 'chart-lightbox-legend';
        legendWrap.innerHTML = legendSrc.innerHTML;
        legendArea.appendChild(legendWrap);
      }
    }

    resetZoom();
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const { overlay, content, legendArea } = getElements();
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    if (content) content.innerHTML = '';
    if (legendArea) legendArea.innerHTML = '';
    resetZoom();
  }

  function bindEvents() {
    const {
      overlay, closeBtn, viewport,
      btnZoomIn, btnZoomOut, btnZoomReset,
      zoomDonut, zoomTrend, donutContainer, trendContainer
    } = getElements();

    if (!overlay || !viewport) return;

    // 1. 工具列縮放按鈕
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        setScale(currentScale + 0.3, true);
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        setScale(currentScale - 0.3, true);
      });
    }
    if (btnZoomReset) {
      btnZoomReset.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
      });
    }

    // 2. 觸控手勢：雙指縮放 (Pinch-to-zoom) & 單指拖曳平移 (Pan) & 雙擊放大
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // 雙指開始捏合
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        startScale = currentScale;
      } else if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX - panX;
        touchStartY = e.touches[0].clientY - panY;

        // 雙擊判斷 (Double-tap to zoom or reset)
        const now = Date.now();
        if (now - lastTapTime < 320) {
          if (currentScale > 1.2) {
            resetZoom();
          } else {
            currentScale = 2.0;
            updateTransform(true);
          }
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialTouchDist) {
        // 雙指縮放中
        e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / initialTouchDist;
        currentScale = Math.min(Math.max(startScale * factor, 0.8), 4.0);
        updateTransform(false);
      } else if (e.touches.length === 1 && currentScale > 1.0) {
        // 放大狀態下單指平移
        e.preventDefault();
        panX = e.touches[0].clientX - touchStartX;
        panY = e.touches[0].clientY - touchStartY;
        updateTransform(false);
      }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialTouchDist = null;
      }
      if (currentScale < 1.0) {
        resetZoom();
      }
    });

    // 3. 滑鼠滾輪縮放 (Mouse Wheel Zoom)
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      setScale(currentScale + delta, true);
    }, { passive: false });

    // 4. 滑鼠拖曳平移 (Mouse Drag Pan)
    viewport.addEventListener('mousedown', (e) => {
      if (currentScale > 1.0) {
        isMouseDragging = true;
        mouseStartX = e.clientX - panX;
        mouseStartY = e.clientY - panY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDragging && currentScale > 1.0) {
        panX = e.clientX - mouseStartX;
        panY = e.clientY - mouseStartY;
        updateTransform(false);
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDragging = false;
    });

    // 5. 觸發開啟 Lightbox
    if (zoomDonut) {
      zoomDonut.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox('donut-chart-container', '收支分類比例');
      });
    }
    if (donutContainer) {
      donutContainer.addEventListener('click', () => {
        openLightbox('donut-chart-container', '收支分類比例');
      });
    }

    if (zoomTrend) {
      zoomTrend.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox('trend-chart-container', '近六個月收支走勢圖');
      });
    }
    if (trendContainer) {
      trendContainer.addEventListener('click', () => {
        openLightbox('trend-chart-container', '近六個月收支走勢圖');
      });
    }

    // 6. 關閉操作
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        closeLightbox();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();

