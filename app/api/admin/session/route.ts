import { ADMIN_COOKIE_NAME, ADMIN_SESSION_SECONDS, createAdminSession, verifyAdminCode } from "../../../../lib/admin-auth";

const genericError = { error: "Those paws did not match the 4Freshers roster." };

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json(genericError, { status: 415 });
  }

  const configuredCode = process.env.ADMIN_ACCESS_CODE || "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || "";
  if (configuredCode.length < 16 || sessionSecret.length < 32) {
    return Response.json({ error: "Team access is not configured on this deployment." }, { status: 503 });
  }

  let code = "";
  try {
    const body = await request.text();
    if (body.length > 1_000) return Response.json(genericError, { status: 400 });
    const parsed = JSON.parse(body) as { code?: unknown };
    code = typeof parsed.code === "string" ? parsed.code.trim() : "";
  } catch {
    return Response.json(genericError, { status: 400 });
  }

  if (!(await verifyAdminCode(code, configuredCode))) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return Response.json(genericError, { status: 401 });
  }

  const token = await createAdminSession(sessionSecret);
  const response = Response.json({ ok: true });
  response.headers.append(
    "set-cookie",
    `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.append(
    "set-cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}
