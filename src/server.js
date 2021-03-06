const express = require("express");
const next = require("next");
const superagent = require("superagent");
const bodyParser = require("body-parser");
const winston = require("winston");

const log = winston.createLogger({
  level: process.env.NODE_LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: { service: "minimal-chronos-ui" },
  transports: [new winston.transports.Console()],
});

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const CHRONOS_URL = process.env.CHRONOS_URL;

app.prepare().then(() => {
  const server = express();

  server.use(bodyParser.json());

  server.get("/job", async (req, res) => {
    try {
      const superResult = await superagent.get(`${CHRONOS_URL}/scheduler/jobs`);
      const jobs = superResult.body.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      res.json({ items: jobs });
    } catch (err) {
      log.error("Error getting jobs from Chronos", err);
      res.status(500);
    }
  });

  server.post("/job", async (req, res) => {
    try {
      await superagent.post(`${CHRONOS_URL}/scheduler/iso8601`).send(req.body);
      res.json({ done: 1 });
    } catch (err) {
      log.error("Error saving job", err);
      res.status(500);
    }
  });

  server.delete("/job/:name", async (req, res) => {
    try {
      if (req.params.name.length === 0) {
        return res.status(400).json({ error: "Job name must be non-empty" });
      }
      await superagent.delete(
        `${CHRONOS_URL}/scheduler/job/${req.params.name}`
      );
      res.json({ status: "deleted" });
    } catch (err) {
      log.error("Error deleting job", err);
      res.status(500);
    }
  });

  server.get("/test", (req, res) => {
    res.json({ done: 1 });
  });

  server.get("/run_job/:job", async (req, res) => {
    try {
      await superagent.put(
        `${CHRONOS_URL}/scheduler/job/${encodeURIComponent(req.params.job)}`
      );
      res.json({ status: "ok" });
    } catch (err) {
      log.error("Error running job", err);
      res.status(500);
    }
  });

  server.get("*", (req, res) => {
    handle(req, res);
  });

  server.listen(4000);
});
