import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Reid Sentinel product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Reid Sentinel<\/title>/i);
  assert.match(html, /Failure had a shape/);
  assert.match(html, /Incident archive/);
  assert.match(html, /Water failure 02/);
  assert.match(html, /Transparent detector/);
  assert.match(html, /Cloudy.+incident brief/);
  assert.match(html, /Admit with calibration/);
  assert.match(html, /300\/300 values/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the evidence source and starter preview out of the finished product", async () => {
  const [page, dashboard, briefingRoute, packageJson, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/reid-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/briefing/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<ReidDashboard \/>/);
  assert.match(dashboard, /system_status/);
  assert.match(dashboard, /airflowResidual/);
  assert.match(dashboard, /Generate live AI briefing/);
  assert.match(dashboard, /Schema valid/);
  assert.match(dashboard, /citations verified/);
  assert.match(dashboard, /actions approved/);
  assert.match(briefingRoute, /generateText/);
  assert.match(briefingRoute, /Vercel AI Gateway/);
  assert.match(briefingRoute, /Local Ollama/);
  assert.match(briefingRoute, /Claude hosted fallback/);
  assert.match(dashboard, /Checking AI providers/);
  assert.match(dashboard, /Calculated incident sequence/);
  assert.match(dashboard, /transparent detector/);
  assert.match(dashboard, /Threshold sensitivity/);
  assert.match(dashboard, /Why balanced stays active/);
  assert.match(dashboard, /False alert-hours/);
  assert.match(dashboard, /Operator decision audit/);
  assert.match(dashboard, /Commit decision record/);
  assert.match(dashboard, /Export all JSON/);
  assert.match(dashboard, /device-local prototype/);
  assert.match(dashboard, /Reid Library disaster story/);
  assert.match(dashboard, /Skip intro/);
  assert.match(dashboard, /Replay story/);
  assert.match(dashboard, /Enter evidence console/);
  assert.match(dashboard, /Data analysis method/);
  assert.match(dashboard, /From raw readings to an early warning/);
  assert.match(dashboard, /mean of/);
  assert.match(dashboard, /Five-stage data analysis method/);
  assert.match(dashboard, /Salvaged sensor/);
  assert.match(dashboard, /Trust it only after the evidence clears/);
  assert.match(dashboard, /Airflow residual/);
  assert.match(dashboard, /Cross-incident replay/);
  assert.match(dashboard, /same warning sequence appeared twice/i);
  assert.match(dashboard, /Interactive evidence stress test/);
  assert.match(dashboard, /Unstable drift/);
  assert.match(dashboard, /Evidence used by this briefing/);
  assert.match(dashboard, /Structured briefing/);
  assert.match(dashboard, /Water delivery/);
  assert.match(dashboard, /Ventilation efficiency/);
  assert.match(dashboard, /Shelter impact/);
  assert.match(dashboard, /Worst efficiency gap/);
  assert.match(dashboard, /Listener events/);
  assert.match(styles, /\.workbench\s*\{[^}]*min-width:\s*0/s);
  assert.match(styles, /@media \(max-width: 1050px\)[\s\S]*?\.workbench\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles, /\.metric-tabs button,[\s\S]*?min-height:\s*44px/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
  await assert.rejects(access(new URL("app/_sites-preview", root)));
});
