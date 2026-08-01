export const ADMIN_COOKIE_NAME = "reid-sentinel-admin";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function hex(value: ArrayBuffer) {
  return [...new Uint8Array(value)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = bytes(left);
  const rightBytes = bytes(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return mismatch === 0;
}

async function digest(value: string) {
  return hex(await crypto.subtle.digest("SHA-256", bytes(value)));
}

async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, bytes(payload)));
}

export async function verifyAdminCode(provided: string, configured: string) {
  if (!provided || !configured || configured.length < 16) return false;
  const [providedHash, configuredHash] = await Promise.all([digest(provided), digest(configured)]);
  return constantTimeEqual(providedHash, configuredHash);
}

export async function createAdminSession(secret: string, now = Date.now()) {
  if (secret.length < 32) throw new Error("Admin session secret is not configured safely");
  const expires = Math.floor(now / 1000) + ADMIN_SESSION_SECONDS;
  const payload = `v1.${expires}`;
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifyAdminSession(token: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!token || !secret || secret.length < 32) return false;
  const [version, expiresText, suppliedSignature, extra] = token.split(".");
  if (version !== "v1" || extra || !/^\d+$/.test(expiresText || "") || !/^[a-f0-9]{64}$/.test(suppliedSignature || "")) return false;
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(now / 1000)) return false;
  const expectedSignature = await signature(`${version}.${expiresText}`, secret);
  return constantTimeEqual(suppliedSignature, expectedSignature);
}
