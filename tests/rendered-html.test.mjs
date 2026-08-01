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
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the evidence source and starter preview out of the finished product", async () => {
  const [page, dashboard, briefingRoute, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/reid-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/briefing/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<ReidDashboard \/>/);
  assert.match(dashboard, /system_status/);
  assert.match(dashboard, /airflowResidual/);
  assert.match(dashboard, /Generate live AI briefing/);
  assert.match(briefingRoute, /generateText/);
  assert.match(briefingRoute, /Vercel AI Gateway/);
  assert.match(briefingRoute, /Local Ollama/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
  await assert.rejects(access(new URL("app/_sites-preview", root)));
});
