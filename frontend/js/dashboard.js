

   document.addEventListener("DOMContentLoaded", function () {
    IB.injectShell("overview");
    IB.seedHistoryIfEmpty();
  
    ensureDataset().then((dataset) => {
      renderCharts(dataset);
      renderRecentTransactions(dataset);
      renderSummary(dataset);
    });
  
    document.addEventListener("ib:theme-change", () => {
      const dataset = IB.getDataset();
      if (dataset) renderCharts(dataset);
    });
  
    const exportBtn = document.getElementById("exportReportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        IB.toast("Export isn't wired to a backend yet — use your browser's Print > Save as PDF for now.", "warning");
      });
    }
  });
  
  function ensureDataset() {
    const existing = IB.getDataset();
    if (existing) return Promise.resolve(existing);
    return IB.loadSampleDataset().catch(() => {
      IB.toast("Couldn't load the sample dataset.", "error");
      return null;
    });
  }
  
  function renderCharts(dataset) {
    if (!dataset) return;
    const kpis = IB.computeKPIs(dataset);
    const regionCol = IB.findColumn(dataset, ["Region"]);
    const productCol = IB.findColumn(dataset, ["Product"]);
  
    const monthlySales = IB.computeMonthlySeries(dataset, kpis.salesCol);
    IB.lineChart("salesTrendChart", monthlySales.map((m) => m.label), monthlySales.map((m) => m.value), {
      label: "Sales", fill: true,
    });
  
    const byProduct = IB.computeGroupSums(dataset, productCol, kpis.salesCol, 6);
    IB.barChart("revenueByProductChart", byProduct.map((p) => p.label), byProduct.map((p) => p.value), {
      color: getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim(),
    });
  
    const byRegion = IB.computeGroupSums(dataset, regionCol, kpis.salesCol);
    IB.doughnutChart("salesByRegionChart", byRegion.map((r) => r.label), byRegion.map((r) => r.value));
  
    const monthlyProfit = IB.computeMonthlySeries(dataset, kpis.profitCol);
    IB.lineChart("profitTrendChart", monthlyProfit.map((m) => m.label), monthlyProfit.map((m) => m.value), {
      label: "Profit", fill: true, color: getComputedStyle(document.documentElement).getPropertyValue("--color-violet").trim(),
    });
  
    const topProducts = IB.computeGroupSums(dataset, productCol, kpis.salesCol, 5);
    IB.barChart("topProductsChart", topProducts.map((p) => p.label), topProducts.map((p) => p.value), {
      horizontal: true, color: getComputedStyle(document.documentElement).getPropertyValue("--color-amber").trim(),
    });
  }
  
  function renderRecentTransactions(dataset) {
    const body = document.getElementById("recentTransactionsBody");
    if (!body || !dataset) return;
    const dateCol = IB.findColumn(dataset, ["Date"]);
    const productCol = IB.findColumn(dataset, ["Product"]);
    const regionCol = IB.findColumn(dataset, ["Region"]);
    const salesCol = IB.findColumn(dataset, ["Sales", "Revenue"]);
    const profitCol = IB.findColumn(dataset, ["Profit"]);
  
    const rows = [...dataset.rows];
    if (dateCol) rows.sort((a, b) => new Date(b[dateCol]) - new Date(a[dateCol]));
    const recent = rows.slice(0, 8);
  
    body.innerHTML = recent.map((r) => {
      const profitVal = profitCol ? IB.num(r, profitCol) : 0;
      return (
        "<tr>" +
        "<td>" + (dateCol ? IB.formatDate(r[dateCol]) : "—") + "</td>" +
        "<td>" + (productCol ? r[productCol] : "—") + "</td>" +
        "<td>" + (regionCol ? r[regionCol] : "—") + "</td>" +
        '<td class="table-num">' + (salesCol ? IB.formatINR(IB.num(r, salesCol)) : "—") + "</td>" +
        '<td class="table-num ' + (profitVal >= 0 ? "delta-cell up" : "delta-cell down") + '">' + (profitCol ? IB.formatINR(profitVal) : "—") + "</td>" +
        '<td><span class="status-pill completed"><i class="fa-solid fa-check"></i> Completed</span></td>' +
        "</tr>"
      );
    }).join("");
  }
  
  function renderSummary(dataset) {
    const el = document.getElementById("performanceSummaryText");
    if (!el || !dataset) return;
    const kpis = IB.computeKPIs(dataset);
    const productCol = IB.findColumn(dataset, ["Product"]);
    const regionCol = IB.findColumn(dataset, ["Region"]);
    const topProduct = productCol ? IB.computeGroupSums(dataset, productCol, kpis.salesCol, 1)[0] : null;
    const topRegion = regionCol ? IB.computeGroupSums(dataset, regionCol, kpis.salesCol, 1)[0] : null;
  
    el.textContent =
      `The current dataset (${dataset.name}) contains ${dataset.rows.length} orders totalling ${IB.formatINR(kpis.totalSales)} in sales ` +
      `and ${IB.formatINR(kpis.totalProfit)} in profit, a margin of ${kpis.profitMargin.toFixed(1)}%. ` +
      (topProduct ? `${topProduct.label} is the strongest-selling product` : "") +
      (topRegion ? `, and the ${topRegion.label} region leads in overall revenue.` : ".");
  }
  