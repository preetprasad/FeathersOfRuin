"use client";

import { useState } from "react";

export function AdminLogin({ configured, returnTo = "/admin" }: { configured: boolean; returnTo?: "/admin" | "/presentation" }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Verification failed.");
      window.location.replace(returnTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-gate">
      <div className="admin-gate-map" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="admin-gate-card">
        {/* Native links avoid a client hydration incompatibility in the Sites runtime. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="admin-gate-brand" href="/"><span>RS</span><strong>REID SENTINEL</strong></a>
        <span className="admin-security-label">Restricted den · 4Freshers only</span>
        <h1>Wait—verify if your dragon paws belong to <em>4Freshers.</em></h1>
        <p>{returnTo === "/presentation"
          ? "The evidence presentation is reserved for the team. Verify once and the story will open automatically."
          : "The contribution ledger, demo runbook, deployment status, and team controls live beyond this gate."}</p>
        {configured ? (
          <form onSubmit={submit}>
            <label htmlFor="admin-code">Team access code</label>
            <div>
              <input autoComplete="current-password" autoFocus id="admin-code" maxLength={128} onChange={(event) => setCode(event.target.value)} placeholder="Enter the shared 4Freshers code" required type="password" value={code} />
              <button disabled={loading || code.trim().length < 8} type="submit">{loading ? "Checking paws…" : "Verify paws"}</button>
            </div>
            {error && <p aria-live="polite" className="admin-login-error">{error}</p>}
          </form>
        ) : (
          <div className="admin-config-warning"><strong>Gate not configured</strong><p>Add the two server-only admin values described in <code>.env.example</code>, then redeploy.</p></div>
        )}
        <footer>
          <span>Signed sessions expire after 8 hours.</span>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Return to public console</a>
        </footer>
      </section>
    </main>
  );
}
