import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { migrate } from "./db/client.js";
import { releasesRouter } from "./routes/releases.js";
import { healthRouter } from "./routes/health.js";
import { refresh } from "./jobs/refresh.js";
import { logger } from "./utils/logger.js";

migrate();

const app = express();
app.use(
  cors({
    origin: config.frontendOrigin === "*" ? true : config.frontendOrigin,
  })
);
app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", releasesRouter);

app.post("/api/refresh", async (req, res) => {
  const secret = req.header("x-refresh-secret") || "";
  if (!config.refreshSecret || secret !== config.refreshSecret) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const result = await refresh();
    res.json(result);
  } catch (err) {
    logger.error("refresh_http_failed", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  logger.info("server_started", { port: config.port });
});
