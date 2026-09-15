

   document.addEventListener("DOMContentLoaded", function () {
    IB.injectShell("prediction");
    const dataset = IB.getDataset();
  
    if (!dataset) {
      document.getElementById("emptyStateWrap").classList.remove("hidden");
      return;
    }
    document.getElementById("predictionContent").classList.remove("hidden");
    renderPrediction(dataset);
  
    document.addEventListener("ib:theme-change", () => renderPrediction(dataset));
  });
  
  function renderPrediction(dataset) {
    const kpis = IB.computeKPIs(dataset);
    const monthly = IB.computeMonthlySeries(dataset, kpis.salesCol);
    const values = monthly.map((m) => m.value);
    const reg = IB.linearRegression(values);
    const predicted = Math.max(0, Math.round(reg.predictNext()));
  
    document.getElementById("predictedValue").textContent = "₹" + predicted.toLocaleString("en-IN");
    document.getElementById("trainingRecords").textContent = monthly.length + " months (" + dataset.rows.length + " rows)";
  
    const labels = monthly.map((m) => m.label).concat(["Next"]);
    const actualData = values.concat([null]);
    const forecastData = values.map(() => null);
    if (values.length) {
      forecastData[values.length - 1] = values[values.length - 1];
    }
    forecastData.push(predicted);
  
    destroyPredictionChart();
    const el = document.getElementById("predictionChart");
    const c = IB3.themeColors();
    IB3.charts["predictionChart"] = new Chart(el, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Actual Sales", data: actualData, borderColor: c.primary, backgroundColor: "transparent",
            tension: 0.3, pointRadius: 3, borderWidth: 2.5,
          },
          {
            label: "Forecast", data: forecastData, borderColor: c.accent, backgroundColor: IB3.hexToRgba(c.accent, 0.15),
            borderDash: [6, 5], tension: 0.3, pointRadius: 4, borderWidth: 2.5, fill: true,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { color: c.muted, boxWidth: 10, padding: 14 } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.muted } },
          y: { grid: { color: c.border }, ticks: { color: c.muted } },
        },
      },
    });
  }
  
  function destroyPredictionChart() {
    if (IB3.charts["predictionChart"]) {
      IB3.charts["predictionChart"].destroy();
      delete IB3.charts["predictionChart"];
    }
  }
  