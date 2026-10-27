require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const client = require("prom-client");

client.collectDefaultMetrics();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/datasets", require("./routes/dataset.routes"));
app.use("/api/analysis", require("./routes/analysis.routes"));
app.use("/api/insights", require("./routes/insights.routes"));
app.use("/api/predict", require("./routes/prediction.routes"));

app.get("/", (req, res) => {
  res.send("InsightBoard backend is running");
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();