"use client";

import { useEffect, useState } from "react";

type Contribution = {
  name: string;
  focus: string;
  contribution: string;
  status: "recorded" | "needs-confirmation";
};

const STORAGE_KEY = "reid-sentinel:team-contributions:v1";
const initialContributions: Contribution[] = [
  {
    name: "Preet Prasad",
    focus: "Product integration and delivery",
    contribution: "Repository delivery, application architecture, Reid analysis integration, AI fallback workflow, deployment, and project documentation.",
    status: "recorded",
  },
  { name: "Juan Enrique Somadinata", focus: "Add confirmed focus", contribution: "Contribution details awaiting team confirmation.", status: "needs-confirmation" },
  { name: "Dinh Khanh Duy Nguyen", focus: "Add confirmed focus", contribution: "Contribution details awaiting team confirmation.", status: "needs-confirmation" },
  { name: "Jeongyun Chae", focus: "Add confirmed focus", contribution: "Contribution details awaiting team confirmation.", status: "needs-confirmation" },
];

function safeContributions(value: string | null): Contribution[] {
  if (!value) return initialContributions;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 4) return initialContributions;
    return initialContributions.map((fallback, index) => {
      const item = parsed[index] as Partial<Contribution>;
      return {
        name: fallback.name,
        focus: typeof item?.focus === "string" ? item.focus.slice(0, 100) : fallback.focus,
        contribution: typeof item?.contribution === "string" ? item.contribution.slice(0, 500) : fallback.contribution,
        status: item?.status === "recorded" ? "recorded" as const : "needs-confirmation" as const,
      };
    });
  } catch {
    return initialContributions;
  }
}

export function AdminControls() {
  const [contributions, setContributions] = useState(initialContributions);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setContributions(safeContributions(window.localStorage.getItem(STORAGE_KEY))), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function update(index: number, field: "focus" | "contribution", value: string) {
    setSaved(false);
    setContributions((current) => current.map((item, itemIndex) => itemIndex === index
      ? { ...item, [field]: value, status: "recorded" }
      : item));
  }

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contributions));
    setSaved(true);
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.replace("/admin");
  }

  return (
    <>
      <section className="admin-panel admin-contributions">
        <div className="admin-section-heading">
          <div><span>Team ledger · editable on this device</span><h2>4Freshers contributions</h2><p>Record only confirmed work. Unattributed team discoveries stay separate until the team agrees on ownership.</p></div>
          <button onClick={save} type="button">{saved ? "Saved on this device" : "Save contribution ledger"}</button>
        </div>
        <div className="contribution-grid">
          {contributions.map((member, index) => (
            <article key={member.name}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><b className={member.status}>{member.status === "recorded" ? "recorded" : "needs confirmation"}</b></div>
              <h3>{member.name}</h3>
              <label>Primary focus<input maxLength={100} onChange={(event) => update(index, "focus", event.target.value)} value={member.focus} /></label>
              <label>Confirmed contribution<textarea maxLength={500} onChange={(event) => update(index, "contribution", event.target.value)} rows={4} value={member.contribution} /></label>
            </article>
          ))}
        </div>
        <div className="unattributed-evidence"><strong>Team-level evidence awaiting attribution</strong><span>Side-quest presentation hint discovery</span><span>Hackathon live-site requirement checks</span><span>Interface coherence and edge-case feedback</span></div>
      </section>

      <section className="admin-panel admin-session-panel">
        <div><span>Security boundary</span><h2>End this admin session</h2><p>The signed HttpOnly session expires automatically after eight hours. Sign out when handing the device to someone else.</p></div>
        <button onClick={signOut} type="button">Sign out of the den</button>
      </section>
    </>
  );
}
