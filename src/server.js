const express = require("express");
const next = require("next");
const superagent = require("superagent");
const bodyParser = require("body-parser");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const CHRONOS_URL = process.env.CHRONOS_URL;

app.prepare().then(() => {
  const server = express();

  server.use(bodyParser.json());

  server.get("/job", async (req, res) => {
    const superResult = await superagent.get(`${CHRONOS_URL}/scheduler/jobs`);
    const jobs = superResult.body.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ items: jobs });
  });

  server.post("/job", async (req, res) => {
    const superResult = await superagent
      .post(`${CHRONOS_URL}/scheduler/iso8601`)
      .send(req.body);
    res.json({ done: 1 });
  });

  server.delete("/job/:name", async (req, res) => {
    if (req.params.name.length === 0) {
      return res.status(400).json({ error: "Job name must be non-empty" });
    }
    const superResult = await superagent.delete(
      `${CHRONOS_URL}/scheduler/job/${req.params.name}`
    );
    res.json({ status: "deleted" });
  });

  server.get("/test", (req, res) => {
    res.json({ done: 1 });
  });

  server.get("/run_job/:job", async (req, res) => {
    await superagent.put(
      `${CHRONOS_URL}/scheduler/job/${encodeURIComponent(req.params.job)}`
    );

    res.json({ status: "ok" });
  });

  server.get("*", (req, res) => {
    handle(req, res);
  });
  server.listen(4000);
});
