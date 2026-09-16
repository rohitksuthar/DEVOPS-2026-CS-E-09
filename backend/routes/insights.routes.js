const express = require("express");
const router = express.Router();

/** GET /api/insights/:id — placeholder rule-based insights for a stored dataset */
router.get("/:id", (req, res) => {
  res.json({
    id: req.params.id,
    insights: [
      { emoji: "📈", title: "Sales Growth", text: "Connect this route to real stored datasets to replace this placeholder." },
    ],
  });
});

module.exports = router;
