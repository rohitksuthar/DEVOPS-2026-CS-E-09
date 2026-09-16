const express = require("express");
const requireAuth = require("../middleware/auth");
const router = express.Router();


const datasets = [];


router.post("/upload", requireAuth, (req, res) => {
  const { name, headers, rows } = req.body || {};
  if (!name || !Array.isArray(headers) || !Array.isArray(rows)) {
    return res.status(400).json({ error: "name, headers[] and rows[] are required" });
  }
  const dataset = {
    id: "ds_" + Date.now(),
    userId: req.userId,
    name,
    headers,
    rows,
    uploadDate: new Date().toISOString(),
  };
  datasets.unshift(dataset);
  res.status(201).json({ dataset: { ...dataset, rows: undefined } });
});

/** GET /api/datasets — requires login; only returns the current user's datasets. */
router.get("/", requireAuth, (req, res) => {
  const mine = datasets.filter((d) => d.userId === req.userId);
  res.json({ datasets: mine.map(({ rows, ...meta }) => meta) });
});

/** GET /api/datasets/:id — requires login; only the owner can read it. */
router.get("/:id", requireAuth, (req, res) => {
  const dataset = datasets.find((d) => d.id === req.params.id && d.userId === req.userId);
  if (!dataset) return res.status(404).json({ error: "Dataset not found" });
  res.json({ dataset });
});

/** DELETE /api/datasets/:id — requires login; only the owner can delete it. */
router.delete("/:id", requireAuth, (req, res) => {
  const idx = datasets.findIndex((d) => d.id === req.params.id && d.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: "Dataset not found" });
  datasets.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;
