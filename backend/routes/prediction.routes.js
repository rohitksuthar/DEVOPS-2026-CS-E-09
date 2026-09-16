const express = require("express");
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_TIMEOUT_MS = 5000;


router.post("/", async (req, res) => {
  const series = Array.isArray(req.body?.series) ? req.body.series : [];

  try {
    const result = await callMlService(series);
    return res.json({ ...result, source: "ml-service" });
  } catch (err) {
    console.warn("ML service unavailable, falling back to local regression:", err.message);
    const result = localLinearRegression(series);
    return res.json({ ...result, source: "backend-fallback" });
  }
});

async function callMlService(series) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ML service responded with status ${response.status}`);
    }
    return await response.json(); // { prediction, model, trainingRecords }
  } finally {
    clearTimeout(timeout);
  }
}

function localLinearRegression(series) {
  if (series.length < 2) {
    return { prediction: series[0] || 0, model: "Linear Regression", trainingRecords: series.length };
  }
  const n = series.length;
  const xs = series.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = series.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * series[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  const prediction = Math.max(0, Math.round(slope * n + intercept));

  return { prediction, model: "Linear Regression", trainingRecords: n };
}

module.exports = router;
