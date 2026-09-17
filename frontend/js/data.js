

   const IB = window.IB || {};
   window.IB = IB;
   
   IB.KEYS = {
     DATASET: "ib_dataset",
     HISTORY: "ib_history",
     USER: "ib_user",
     THEME: "ib_theme",
   };
   
  
   IB.parseCSV = function (text) {
     const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length > 0);
     if (lines.length === 0) return { headers: [], rows: [] };
   
     const splitLine = (line) => {
       const out = [];
       let cur = "";
       let inQuotes = false;
       for (let i = 0; i < line.length; i++) {
         const ch = line[i];
         if (ch === '"') {
           inQuotes = !inQuotes;
         } else if (ch === "," && !inQuotes) {
           out.push(cur.trim());
           cur = "";
         } else {
           cur += ch;
         }
       }
       out.push(cur.trim());
       return out;
     };
   
     const headers = splitLine(lines[0]);
     const rows = [];
     for (let i = 1; i < lines.length; i++) {
       const cells = splitLine(lines[i]);
       if (cells.length === 1 && cells[0] === "") continue;
       const row = {};
       headers.forEach((h, idx) => {
         row[h] = cells[idx] !== undefined ? cells[idx] : "";
       });
       rows.push(row);
     }
     return { headers, rows };
   };
   
  
   IB.detectColumnType = function (rows, column) {
     let numericCount = 0;
     let dateCount = 0;
     let total = 0;
     const sample = rows.slice(0, 60);
     sample.forEach((r) => {
       const v = r[column];
       if (v === undefined || v === "") return;
       total++;
       if (!isNaN(parseFloat(v)) && isFinite(v)) numericCount++;
       else if (!isNaN(Date.parse(v))) dateCount++;
     });
     if (total === 0) return "text";
     if (numericCount / total > 0.7) return "numeric";
     if (dateCount / total > 0.7) return "date";
     return "text";
   };
   
   
   
   IB.buildDataset = function (name, source, headers, rows) {
     const columnTypes = {};
     headers.forEach((h) => (columnTypes[h] = IB.detectColumnType(rows, h)));
     return {
       id: "ds_" + Date.now(),
       name,
       source, // 'sample' | 'upload'
       uploadDate: new Date().toISOString(),
       headers,
       columnTypes,
       rows,
     };
   };
   
   IB.saveDataset = function (dataset) {
     localStorage.setItem(IB.KEYS.DATASET, JSON.stringify(dataset));
     IB.addHistoryEntry(dataset);
   };
   
   IB.getDataset = function () {
     const raw = localStorage.getItem(IB.KEYS.DATASET);
     if (!raw) return null;
     try {
       return JSON.parse(raw);
     } catch (e) {
       return null;
     }
   };
   
   IB.clearDataset = function () {
     localStorage.removeItem(IB.KEYS.DATASET);
   };
   
   IB.loadSampleDataset = function () {
     return fetch("data/sample-business-data.csv")
       .then((res) => {
         if (!res.ok) throw new Error("Could not load sample dataset");
         return res.text();
       })
       .then((text) => {
         const { headers, rows } = IB.parseCSV(text);
         const dataset = IB.buildDataset("sample-business-data.csv", "sample", headers, rows);
         IB.saveDataset(dataset);
         return dataset;
       });
   };
   
  
   
   IB.getHistory = function () {
     const raw = localStorage.getItem(IB.KEYS.HISTORY);
     if (!raw) return [];
     try {
       return JSON.parse(raw);
     } catch (e) {
       return [];
     }
   };
   
   IB.addHistoryEntry = function (dataset) {
     const history = IB.getHistory();
     const entry = {
       id: dataset.id,
       name: dataset.name,
       uploadDate: dataset.uploadDate,
       rows: dataset.rows.length,
       columns: dataset.headers.length,
       status: "Completed",
     };
     // Avoid duplicate consecutive entries for the same dataset id.
     const existingIdx = history.findIndex((h) => h.id === entry.id);
     if (existingIdx >= 0) history[existingIdx] = entry;
     else history.unshift(entry);
     localStorage.setItem(IB.KEYS.HISTORY, JSON.stringify(history.slice(0, 25)));
   };
   
   IB.removeHistoryEntry = function (id) {
     const history = IB.getHistory().filter((h) => h.id !== id);
     localStorage.setItem(IB.KEYS.HISTORY, JSON.stringify(history));
   };
   
   IB.seedHistoryIfEmpty = function () {
     if (IB.getHistory().length > 0) return;
     const seed = [
       { id: "ds_seed_3", name: "sample-business-data.csv", uploadDate: daysAgoISO(0), rows: 120, columns: 8, status: "Completed" },
       { id: "ds_seed_2", name: "q3-regional-sales.csv", uploadDate: daysAgoISO(6), rows: 214, columns: 9, status: "Completed" },
       { id: "ds_seed_1", name: "festive-season-orders.csv", uploadDate: daysAgoISO(19), rows: 87, columns: 7, status: "Completed" },
     ];
     localStorage.setItem(IB.KEYS.HISTORY, JSON.stringify(seed));
     function daysAgoISO(n) {
       const d = new Date();
       d.setDate(d.getDate() - n);
       return d.toISOString();
     }
   };
   
   
   
   IB.num = function (row, col) {
     const v = parseFloat(row[col]);
     return isNaN(v) ? 0 : v;
   };
   
   IB.findColumn = function (dataset, candidates) {
     const lower = dataset.headers.map((h) => h.toLowerCase());
     for (const c of candidates) {
       const idx = lower.indexOf(c.toLowerCase());
       if (idx >= 0) return dataset.headers[idx];
     }
     return null;
   };
   
   IB.computeKPIs = function (dataset) {
     const salesCol = IB.findColumn(dataset, ["Sales", "Revenue"]);
     const profitCol = IB.findColumn(dataset, ["Profit"]);
     const qtyCol = IB.findColumn(dataset, ["Quantity", "Qty"]);
     const rows = dataset.rows;
   
     const totalSales = salesCol ? rows.reduce((s, r) => s + IB.num(r, salesCol), 0) : 0;
     const totalProfit = profitCol ? rows.reduce((s, r) => s + IB.num(r, profitCol), 0) : 0;
     const totalQuantity = qtyCol ? rows.reduce((s, r) => s + IB.num(r, qtyCol), 0) : 0;
     const totalOrders = rows.length;
     const avgSales = totalOrders ? totalSales / totalOrders : 0;
     const profitMargin = totalSales ? (totalProfit / totalSales) * 100 : 0;
   
     return {
       salesCol, profitCol, qtyCol,
       totalSales, totalProfit, totalQuantity, totalOrders, avgSales, profitMargin,
     };
   };
   
   IB.computeColumnStats = function (dataset) {
     const rows = dataset.rows;
     let numericCols = 0, textCols = 0, missing = 0;
   
     const columnInfo = dataset.headers.map((h) => {
       const type = dataset.columnTypes[h] || "text";
       if (type === "numeric") numericCols++;
       else textCols++;
       let missingCount = 0;
       const seen = new Set();
       rows.forEach((r) => {
         const v = r[h];
         if (v === undefined || v === "" || v === null) missingCount++;
         seen.add(v);
       });
       missing += missingCount;
       return {
         name: h,
         type,
         missing: missingCount,
         unique: seen.size,
       };
     });
   
     // Duplicate row detection (full-row match)
     const seenRows = new Set();
     let duplicates = 0;
     rows.forEach((r) => {
       const key = dataset.headers.map((h) => r[h]).join("|");
       if (seenRows.has(key)) duplicates++;
       else seenRows.add(key);
     });
   
     return {
       totalRows: rows.length,
       totalColumns: dataset.headers.length,
       numericCols,
       textCols,
       missingValues: missing,
       duplicateRows: duplicates,
       columnInfo,
     };
   };
   
   /** Aggregates a numeric value column by month, sorted chronologically. */
   IB.computeMonthlySeries = function (dataset, valueCol) {
     const dateCol = IB.findColumn(dataset, ["Date", "OrderDate", "Order Date"]);
     if (!dateCol || !valueCol) return [];
     const buckets = {};
     dataset.rows.forEach((r) => {
       const d = new Date(r[dateCol]);
       if (isNaN(d.getTime())) return;
       const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
       buckets[key] = (buckets[key] || 0) + IB.num(r, valueCol);
     });
     return Object.keys(buckets).sort().map((key) => ({ label: monthLabel(key), key, value: Math.round(buckets[key]) }));
   
     function monthLabel(key) {
       const [y, m] = key.split("-");
       const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
       return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
     }
   };
   
   /** Sums a numeric value column grouped by a categorical column, sorted descending. */
   IB.computeGroupSums = function (dataset, groupCol, valueCol, limit) {
     if (!groupCol || !valueCol) return [];
     const buckets = {};
     dataset.rows.forEach((r) => {
       const key = r[groupCol] || "Unknown";
       buckets[key] = (buckets[key] || 0) + IB.num(r, valueCol);
     });
     const arr = Object.keys(buckets).map((k) => ({ label: k, value: Math.round(buckets[k]) }));
     arr.sort((a, b) => b.value - a.value);
     return limit ? arr.slice(0, limit) : arr;
   };
   
  
   
   IB.linearRegression = function (series) {
     // series: array of numbers (y values), x = index
     const n = series.length;
     if (n < 2) return { slope: 0, intercept: series[0] || 0, predictNext: () => series[0] || 0 };
     const xs = series.map((_, i) => i);
     const sumX = xs.reduce((a, b) => a + b, 0);
     const sumY = series.reduce((a, b) => a + b, 0);
     const sumXY = xs.reduce((s, x, i) => s + x * series[i], 0);
     const sumXX = xs.reduce((s, x) => s + x * x, 0);
     const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
     const intercept = (sumY - slope * sumX) / n;
     return {
       slope, intercept,
       predictNext: () => slope * n + intercept,
       predictAt: (x) => slope * x + intercept,
     };
   };
   
   
   
   IB.generateInsights = function (dataset, kpis) {
     const insights = [];
     const regionCol = IB.findColumn(dataset, ["Region"]);
     const productCol = IB.findColumn(dataset, ["Product"]);
     const monthly = IB.computeMonthlySeries(dataset, kpis.salesCol);
   
     // Sales growth: compare last two months
     if (monthly.length >= 2) {
       const last = monthly[monthly.length - 1].value;
       const prev = monthly[monthly.length - 2].value;
       const growth = prev ? ((last - prev) / prev) * 100 : 0;
       insights.push({
         emoji: "📈",
         title: growth >= 0 ? "Sales Growth" : "Sales Decline",
         text: `Sales ${growth >= 0 ? "increased" : "decreased"} by ${Math.abs(growth).toFixed(1)}% in ${monthly[monthly.length - 1].label} compared with ${monthly[monthly.length - 2].label}.`,
       });
     } else {
       insights.push({
         emoji: "📈",
         title: "Sales Growth",
         text: `Total sales across the dataset reached ${formatINR(kpis.totalSales)} across ${kpis.totalOrders} orders.`,
       });
     }
   
     // Top product
     if (productCol) {
       const byProduct = IB.computeGroupSums(dataset, productCol, kpis.salesCol, 1);
       if (byProduct.length) {
         insights.push({
           emoji: "🏆",
           title: "Top Product",
           text: `${byProduct[0].label} generated the highest revenue at ${formatINR(byProduct[0].value)}.`,
         });
       }
     }
   
     // Best region
     if (regionCol) {
       const byRegion = IB.computeGroupSums(dataset, regionCol, kpis.salesCol, 1);
       if (byRegion.length) {
         insights.push({
           emoji: "🌎",
           title: "Best Region",
           text: `The ${byRegion[0].label} region contributed the highest sales, totalling ${formatINR(byRegion[0].value)}.`,
         });
       }
     }
   
     // Profitability
     insights.push({
       emoji: "💰",
       title: "Profitability",
       text: `Overall profit margin stands at ${kpis.profitMargin.toFixed(1)}%, with total profit of ${formatINR(kpis.totalProfit)}.`,
     });
   
     // Forecast
     if (monthly.length >= 2) {
       const reg = IB.linearRegression(monthly.map((m) => m.value));
       const nextVal = Math.max(0, Math.round(reg.predictNext()));
       insights.push({
         emoji: "🔮",
         title: "Forecast",
         text: `Based on recent trends, next month's predicted sales are ${formatINR(nextVal)}.`,
       });
     }
   
     return insights;
   };
   
   
   
   function formatINR(value) {
     const abs = Math.abs(value);
     if (abs >= 10000000) return "₹" + (value / 10000000).toFixed(2) + " Cr";
     if (abs >= 100000) return "₹" + (value / 100000).toFixed(2) + " Lakh";
     return "₹" + Math.round(value).toLocaleString("en-IN");
   }
   IB.formatINR = formatINR;
   
   IB.formatNumber = function (value) {
     return Math.round(value).toLocaleString("en-IN");
   };
   
   IB.formatDate = function (isoOrDateStr) {
     const d = new Date(isoOrDateStr);
     if (isNaN(d.getTime())) return isoOrDateStr;
     return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
   };
   