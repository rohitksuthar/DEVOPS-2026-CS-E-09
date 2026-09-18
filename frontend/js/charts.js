
const IB3 = window.IB || {};
window.IB = IB3;

IB3.charts = {}; // registry: canvasId -> Chart instance

IB3.themeColors = function () {
  const cs = getComputedStyle(document.documentElement);
  return {
    primary: cs.getPropertyValue("--color-primary").trim(),
    accent: cs.getPropertyValue("--color-accent").trim(),
    violet: cs.getPropertyValue("--color-violet").trim(),
    amber: cs.getPropertyValue("--color-amber").trim(),
    danger: cs.getPropertyValue("--color-danger").trim(),
    text: cs.getPropertyValue("--color-text").trim(),
    muted: cs.getPropertyValue("--color-text-muted").trim(),
    border: cs.getPropertyValue("--color-border").trim(),
    surface: cs.getPropertyValue("--color-surface").trim(),
  };
};

IB3.palette = function () {
  const c = IB3.themeColors();
  return [c.accent, c.violet, c.amber, c.primary, c.danger, "#3AB0FF", "#F27CA0"];
};

function destroyIfExists(canvasId) {
  if (IB3.charts[canvasId]) {
    IB3.charts[canvasId].destroy();
    delete IB3.charts[canvasId];
  }
}

function baseFont() {
  return { family: "Inter, sans-serif", size: 11 };
}

IB3.lineChart = function (canvasId, labels, data, opts) {
  opts = opts || {};
  destroyIfExists(canvasId);
  const el = document.getElementById(canvasId);
  if (!el) return null;
  const c = IB3.themeColors();
  const color = opts.color || c.accent;
  IB3.charts[canvasId] = new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: opts.label || "Value",
        data,
        borderColor: color,
        backgroundColor: hexToRgba(color, 0.12),
        fill: !!opts.fill,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: color,
        pointBorderColor: c.surface,
        pointBorderWidth: 1.5,
        borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: opts.tooltipCallback ? { label: opts.tooltipCallback } : undefined },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: c.muted, font: baseFont() } },
        y: { grid: { color: c.border }, ticks: { color: c.muted, font: baseFont(), callback: opts.yTickFormatter } },
      },
    },
  });
  return IB3.charts[canvasId];
};

IB3.barChart = function (canvasId, labels, data, opts) {
  opts = opts || {};
  destroyIfExists(canvasId);
  const el = document.getElementById(canvasId);
  if (!el) return null;
  const c = IB3.themeColors();
  const color = opts.color || c.primary;
  IB3.charts[canvasId] = new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: opts.label || "Value",
        data,
        backgroundColor: color,
        borderRadius: 6,
        maxBarThickness: 42,
      }],
    },
    options: {
      indexAxis: opts.horizontal ? "y" : "x",
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: opts.tooltipCallback ? { label: opts.tooltipCallback } : undefined },
      },
      scales: {
        x: { grid: { display: !opts.horizontal ? false : true, color: c.border }, ticks: { color: c.muted, font: baseFont() } },
        y: { grid: { display: opts.horizontal ? false : true, color: c.border }, ticks: { color: c.muted, font: baseFont() } },
      },
    },
  });
  return IB3.charts[canvasId];
};

IB3.doughnutChart = function (canvasId, labels, data, opts) {
  opts = opts || {};
  destroyIfExists(canvasId);
  const el = document.getElementById(canvasId);
  if (!el) return null;
  const colors = IB3.palette();
  IB3.charts[canvasId] = new Chart(el, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderColor: IB3.themeColors().surface, borderWidth: 3 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { color: IB3.themeColors().muted, font: baseFont(), boxWidth: 10, padding: 14 } },
      },
    },
  });
  return IB3.charts[canvasId];
};

function hexToRgba(hex, alpha) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const num = parseInt(hex, 16);
  if (isNaN(num)) return hex;
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
IB3.hexToRgba = hexToRgba;
