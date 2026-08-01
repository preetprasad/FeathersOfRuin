export const maxDuration = 5;

async function ollamaAvailable() {
  const configuredUrl = process.env.OLLAMA_REMOTE_URL;
  if (!configuredUrl) return false;
  try {
    const response = await fetch(`${configuredUrl.replace(/\/$/, "")}/health`, {
      headers: { "cache-control": "no-store" },
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const remoteOllama = Boolean(process.env.OLLAMA_REMOTE_URL && process.env.OLLAMA_REMOTE_TOKEN);
  const [ollamaOnline] = await Promise.all([remoteOllama ? ollamaAvailable() : Promise.resolve(true)]);
  return Response.json({
    primary: {
      provider: remoteOllama ? "4Freshers Ollama bridge" : "Local Ollama",
      status: ollamaOnline ? "available" : "unavailable",
    },
    secondary: {
      provider: "Claude hosted fallback",
      status: process.env.ANTHROPIC_API_KEY ? "standby" : "not-configured",
    },
    guaranteedFallback: {
      provider: "Validated deterministic fallback",
      status: "available",
    },
  }, { headers: { "cache-control": "no-store" } });
}
