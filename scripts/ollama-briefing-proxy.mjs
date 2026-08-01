import { createServer } from "node:http";

const token = process.env.OLLAMA_PROXY_TOKEN;
const port = Number(process.env.OLLAMA_PROXY_PORT || 11435);
const ollamaUrl = process.env.OLLAMA_INTERNAL_URL || "http://127.0.0.1:11434/api/chat";
let inFlight = 0;

if (!token || token.length < 32) {
  throw new Error("OLLAMA_PROXY_TOKEN must be set to a secret of at least 32 characters.");
}

function json(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    json(response, 200, { ok: true, service: "reid-ollama-bridge" });
    return;
  }
  if (request.method !== "POST" || request.url !== "/api/chat") {
    json(response, 404, { error: "Not found" });
    return;
  }
  if (request.headers.authorization !== `Bearer ${token}`) {
    json(response, 401, { error: "Unauthorized" });
    return;
  }
  if (inFlight >= 2) {
    json(response, 429, { error: "Briefing capacity reached" });
    return;
  }

  let rawBody = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    rawBody += chunk;
    if (rawBody.length > 30_000) request.destroy();
  });
  request.on("end", async () => {
    inFlight += 1;
    try {
      const body = JSON.parse(rawBody);
      if (!Array.isArray(body.messages) || body.messages.length !== 2) throw new Error("Invalid messages");
      if (body.messages.some((message) => typeof message?.content !== "string" || message.content.length > 20_000)) {
        throw new Error("Invalid message content");
      }
      const upstream = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "gemma3:4b",
          stream: false,
          format: body.format,
          options: { temperature: 0, num_predict: 1000 },
          messages: body.messages,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      const result = await upstream.text();
      response.writeHead(upstream.status, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(result);
    } catch {
      json(response, 400, { error: "Invalid briefing request" });
    } finally {
      inFlight -= 1;
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Reid Ollama bridge listening on http://127.0.0.1:${port}`);
});
