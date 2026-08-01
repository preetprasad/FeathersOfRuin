import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "../../lib/admin-auth";
import { AdminControls } from "./admin-controls";
import { AdminLogin } from "./admin-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "4Freshers admin",
  description: "Private team operations for Reid Sentinel.",
  robots: { index: false, follow: false },
};

const runOfShow = [
  ["00:00", "Open presentation", "Let the story transition establish Reid Library and the stakes."],
  ["00:25", "Problem → method", "Explain why raw readings need physical relationships and corroboration."],
  ["01:30", "Interactive concepts", "Move one residual control and remove one corroborating signal."],
  ["02:20", "Results", "Show the repeated failure signature and 21–23 hour confirmed lead."],
  ["03:00", "Live console", "Open a water incident, generate the brief, and inspect one citation."],
  ["04:00", "Human control", "Record a reversible response and close on the recovered time to act."],
];

export default async function AdminPage() {
  const cookieStore = await cookies();
  const configured = Boolean((process.env.ADMIN_ACCESS_CODE || "").length >= 16 && (process.env.ADMIN_SESSION_SECRET || "").length >= 32);
  const authenticated = configured && await verifyAdminSession(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    process.env.ADMIN_SESSION_SECRET,
  );

  if (!authenticated) return <AdminLogin configured={configured} />;

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link className="admin-gate-brand" href="/"><span>RS</span><strong>REID SENTINEL</strong><small>/ 4Freshers den</small></Link>
        <div><span>Authenticated team session</span><i /></div>
      </header>

      <div className="admin-workspace">
        <section className="admin-hero">
          <span>Private operations · 1 August 2026</span>
          <h1>The den behind<br /><em>Reid Sentinel.</em></h1>
          <p>Team contribution evidence, demo readiness, launch surfaces, and the decisions needed before judging.</p>
        </section>

        <section className="admin-launch-grid" aria-label="Launch Reid Sentinel surfaces">
          <Link href="/presentation" rel="noreferrer" target="_blank"><span>01 · Explain</span><strong>Open presentation</strong><p>Story, data-science concepts, calculated results, and implementation links.</p><b>Launch in new tab ↗</b></Link>
          <Link href="/" rel="noreferrer" target="_blank"><span>02 · Operate</span><strong>Open landing page</strong><p>The public evidence console for incident analysis, AI briefing, and human decisions.</p><b>Launch in new tab ↗</b></Link>
        </section>

        <section className="admin-overview-grid">
          <article className="admin-panel admin-readiness">
            <span>Current build</span><h2>Judge-path readiness</h2>
            <div><strong>34/34</strong><p>automated checks</p></div>
            <div><strong>2/2</strong><p>failures recovered</p></div>
            <div><strong>21–23h</strong><p>confirmed lead</p></div>
            <ul><li>Vercel public route</li><li>Sites private route</li><li>Local → hosted → deterministic AI</li><li>Presentation → console handoff</li></ul>
          </article>
          <article className="admin-panel admin-decisions">
            <span>Before presenting</span><h2>Owner checklist</h2>
            <label><input type="checkbox" /> Confirm speaking roles</label>
            <label><input type="checkbox" /> Verify Ollama tunnel health</label>
            <label><input type="checkbox" /> Test water and ventilation briefs</label>
            <label><input type="checkbox" /> Rehearse the four-minute path</label>
            <label><input type="checkbox" /> Keep offline screenshots ready</label>
            <p>Checklist state is intentionally session-only; the durable plan remains in the project record.</p>
          </article>
        </section>

        <section className="admin-panel admin-runbook">
          <div className="admin-section-heading"><div><span>Presenter runbook</span><h2>A disciplined live path</h2><p>Keep the analysis central. The animation establishes stakes; the console proves the implementation.</p></div><Link href="/presentation" target="_blank">Start rehearsal ↗</Link></div>
          <ol>{runOfShow.map(([time, title, detail]) => <li key={time}><time>{time}</time><strong>{title}</strong><p>{detail}</p></li>)}</ol>
        </section>

        <AdminControls />

        <footer className="admin-footer"><span>Restricted 4Freshers workspace · never place secrets in contribution notes</span><div><a href="https://github.com/preetprasad/FeathersOfRuin/blob/main/locations/reid-library/PROJECT_RECORD.md" rel="noreferrer" target="_blank">Project record ↗</a><a href="https://github.com/preetprasad/FeathersOfRuin" rel="noreferrer" target="_blank">Repository ↗</a></div></footer>
      </div>
    </main>
  );
}
