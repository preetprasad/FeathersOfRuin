"use client";

import { useMemo, useState } from "react";
import sensorData from "../locations/reid-library/data/processed/reid_library_sensor_data.json";
import { ACTION_CATALOG, presentIncidentBrief, type BriefingRequest, type IncidentBrief } from "../lib/reid-briefing";
import {
  airflowResidual,
  backtestDetector,
  detectEpisodes,
  prepareSensorData,
  runDetector,
  uniqueEvidence,
  type RawSensorRecord,
  type SensorRow,
} from "../lib/reid-analysis";

type MetricGroup = "water" | "ventilation" | "shelter";

const metricGroups = {
  water: [
    { key: "pressure", label: "Water pressure", color: "#79b9d0" },
    { key: "flow", label: "Water flow", color: "#9ee7c0" },
  ],
  ventilation: [
    { key: "power", label: "Power", color: "#f4bd68" },
    { key: "airflowResidual", label: "Airflow efficiency", color: "#9ee7c0" },
  ],
  shelter: [
    { key: "temperature", label: "Temperature", color: "#79b9d0" },
    { key: "vibration", label: "Vibration", color: "#ff776d" },
  ],
} as const;

function compactDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    hour12: true,
    timeZone: "Australia/Perth",
  }).format(date);
}

function extrema(values: Array<number | null>, mode: "min" | "max") {
  const clean = values.filter((value): value is number => value !== null);
  if (!clean.length) return null;
  return mode === "min" ? Math.min(...clean) : Math.max(...clean);
}

function format(value: number | null, digits = 1) {
  return value === null ? "—" : value.toFixed(digits);
}

function chartValue(row: SensorRow, key: string) {
  if (key === "airflowResidual") return airflowResidual(row);
  return row[key as keyof Pick<SensorRow, "pressure" | "flow" | "power" | "temperature" | "vibration">];
}

function SignalChart({ rows, group }: { rows: SensorRow[]; group: MetricGroup }) {
  const width = 900;
  const height = 250;
  const padding = 14;
  const series = metricGroups[group];

  const paths = series.map((item) => {
    const values = rows.map((row) => chartValue(row, item.key));
    const clean = values.filter((value): value is number => value !== null);
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const span = max - min || 1;
    const segments: string[] = [];
    let drawing = false;

    values.forEach((value, index) => {
      if (value === null) {
        drawing = false;
        return;
      }
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const normalized = (value - min) / span;
      const y = height - padding - normalized * (height - padding * 2);
      segments.push(`${drawing ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`);
      drawing = true;
    });

    return { ...item, path: segments.join(" ") };
  });

  return (
    <>
      <div className="chart-scroll">
        <div className="chart-shell">
          <svg
            className="signal-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${group} signals normalised to compare their shape over the selected incident`}
          >
            {paths.map((item) => (
              <path
                d={item.path}
                fill="none"
                key={item.key}
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="chart-axis" aria-hidden="true">
            <span>{rows[0] ? compactDate(rows[0].timestamp) : "—"}</span>
            <span>{rows[Math.floor(rows.length / 2)] ? compactDate(rows[Math.floor(rows.length / 2)].timestamp) : "—"}</span>
            <span>{rows.at(-1) ? compactDate(rows.at(-1)!.timestamp) : "—"}</span>
          </div>
          <div className="status-strip" title="Supplied ground-truth system status">
            {rows.map((row) => (
              <span data-status={row.status} key={row.timestamp.toISOString()} />
            ))}
          </div>
        </div>
      </div>
      <div className="legend">
        {paths.map((item) => (
          <span className="legend-item" key={item.key}>
            <span className="legend-swatch" style={{ "--swatch": item.color } as React.CSSProperties} />
            {item.label} · normalised
          </span>
        ))}
        <span className="legend-item">Status ribbon · supplied evaluation truth</span>
      </div>
    </>
  );
}

export function ReidDashboard() {
  const allRows = useMemo(() => prepareSensorData(sensorData as RawSensorRecord[]), []);
  const allDetections = useMemo(() => runDetector(allRows), [allRows]);
  const episodes = useMemo(() => detectEpisodes(allDetections), [allDetections]);
  const backtest = useMemo(() => backtestDetector(allRows, allDetections), [allRows, allDetections]);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [metricGroup, setMetricGroup] = useState<MetricGroup>("water");
  const [aiBrief, setAiBrief] = useState<IncidentBrief | null>(null);
  const [aiMode, setAiMode] = useState<"live" | "fallback" | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiIncidentId, setAiIncidentId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const episode = (episodes.find((item) => item.id === episodeId) || episodes[2] || episodes[0])!;

  const rows = useMemo(() => {
    return allRows.filter((row) => row.timestamp >= episode.start && row.timestamp <= episode.end);
  }, [allRows, episode]);
  const episodeDetections = useMemo(
    () => allDetections.filter((item) => item.timestamp >= episode.start && item.timestamp <= episode.end),
    [allDetections, episode],
  );
  const episodeEvidence = useMemo(() => uniqueEvidence(episodeDetections), [episodeDetections]);

  const pressureMin = extrema(rows.map((row) => row.pressure), "min");
  const flowMin = extrema(rows.map((row) => row.flow), "min");
  const vibrationMax = extrema(rows.map((row) => row.vibration), "max");
  const temperatureMin = extrema(rows.map((row) => row.temperature), "min");
  const residualMin = extrema(rows.map(airflowResidual), "min");
  const pressureStart = rows.find((row) => row.pressure !== null)?.pressure ?? null;
  const pressureDrop = pressureStart !== null && pressureMin !== null ? pressureStart - pressureMin : null;
  const missing = rows.reduce(
    (total, row) =>
      total + [row.airflow, row.pressure, row.flow, row.temperature, row.vibration].filter((value) => value === null).length,
    0,
  );

  const isFailure = episode.kind === "water";
  const failureAt = rows.find((row) => row.status === "failed")?.timestamp;
  const firstWatchAt = episodeDetections.find((item) => item.level !== "safe")?.timestamp;
  const leadHours = failureAt && firstWatchAt ? (failureAt.getTime() - firstWatchAt.getTime()) / 3_600_000 : null;
  const briefing = isFailure
    ? `Water pressure loses ${format(pressureDrop, 0)} kPa across the incident window while vibration rises to ${format(vibrationMax, 2)}. The same sequence appears before both recorded failures, providing a 24-hour preparation window.`
    : `Delivered airflow falls roughly ${format(Math.abs(residualMin ?? 0), 2)} m³/s below the healthy power relationship. Water remains comparatively stable, isolating this episode as ventilation inefficiency rather than system-wide failure.`;
  const visibleAiBrief = aiIncidentId === episode.id ? aiBrief : null;
  const visibleAiMode = aiIncidentId === episode.id ? aiMode : null;
  const visibleAiProvider = aiIncidentId === episode.id ? aiProvider : null;
  const visibleAiError = aiIncidentId === episode.id ? aiError : null;
  const decision = decisions[episode.id] || null;

  const briefingInput: BriefingRequest = {
    incidentId: episode.id,
    label: episode.label,
    level: episode.level,
    kind: episode.kind,
    window: { start: episode.start.toISOString(), end: episode.end.toISOString() },
    leadHours,
    totalRows: rows.length,
    missingValues: missing,
    evidence: episodeEvidence,
  };
  const presentedAiBrief = visibleAiBrief ? presentIncidentBrief(visibleAiBrief, briefingInput) : null;

  async function generateIncidentBrief() {
    setAiIncidentId(episode.id);
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(briefingInput),
      });
      if (!response.ok) throw new Error("The briefing service rejected this evidence package.");
      const payload = await response.json() as {
        brief: IncidentBrief;
        mode: "live" | "fallback";
        provider: string;
        error?: string;
      };
      setAiBrief(payload.brief);
      setAiMode(payload.mode);
      setAiProvider(payload.provider);
      setAiError(payload.error || null);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "The live briefing could not be generated.");
    } finally {
      setAiLoading(false);
    }
  }

  function recordDecision(value: string) {
    const record = `${value} · ${new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Perth",
    }).format(new Date())}`;
    window.localStorage.setItem(`reid-decision:${episode.id}`, record);
    setDecisions((current) => ({ ...current, [episode.id]: record }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">RS</span>
          <span>REID SENTINEL</span>
          <span>/ essential systems</span>
        </div>
        <div className="live-pill"><span>Historical playback · July 2026</span></div>
      </header>

      <main className="dashboard">
        <section className="hero">
          <div>
            <p className="eyebrow">Two failures, no warning · evidence console</p>
            <h1>Failure had a shape. Now we can see it coming.</h1>
            <p className="hero-copy">
              Reid Sentinel connects Cloudy&apos;s maintenance instincts to 500 hourly sensor records—so the dragons can see the warning, inspect the evidence, and choose what happens next.
            </p>
          </div>
          <aside className="hero-stat">
            <span className="micro-label">Recovered lead time</span>
            <strong>24h</strong>
            <p>from the first repeated warning pattern to recorded system failure</p>
          </aside>
        </section>

        <div className="workbench">
          <aside className="episode-rail" aria-label="Recorded incidents">
            <div className="rail-heading">
              <h2>Incident archive</h2>
              <span className="data-pill">04</span>
            </div>
            <div className="episode-list">
              {episodes.map((item) => (
                <button
                  aria-pressed={item.id === episodeId}
                  className="episode-button"
                  key={item.id}
                  onClick={() => setEpisodeId(item.id)}
                  type="button"
                >
                  <span className={`severity ${item.kind === "water" ? "failure" : "warning"}`}>
                    {item.level}
                  </span>
                  <strong>{item.label}</strong>
                  <span>{item.date} · {item.summary}</span>
                </button>
              ))}
            </div>
            <p className="rail-note">
              The coloured timeline ribbon uses <code>system_status</code> only as supplied evaluation truth. Detection evidence comes from the sensor fields.
            </p>
          </aside>

          <div className="main-stack">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>{episode.label}</h2>
                  <p>{episode.date} · {rows.length} hourly readings · Australia/Perth</p>
                </div>
                <div className="metric-tabs" aria-label="Signal group">
                  {(["water", "ventilation", "shelter"] as MetricGroup[]).map((group) => (
                    <button
                      aria-pressed={group === metricGroup}
                      key={group}
                      onClick={() => setMetricGroup(group)}
                      type="button"
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <SignalChart group={metricGroup} rows={rows} />

              <div className="kpi-grid">
                <article className="kpi-card">
                  <span className="micro-label">Lowest pressure</span>
                  <strong>{format(pressureMin, 0)} <small>kPa</small></strong>
                  <p>{isFailure ? "Below the healthy ~350 kPa band" : "Water system remains near baseline"}</p>
                </article>
                <article className="kpi-card">
                  <span className="micro-label">Lowest flow</span>
                  <strong>{format(flowMin, 2)} <small>L/s</small></strong>
                  <p>{isFailure ? "Severe loss of delivered water" : "No material loss during this episode"}</p>
                </article>
                <article className="kpi-card">
                  <span className="micro-label">Peak vibration</span>
                  <strong>{format(vibrationMax, 2)}</strong>
                  <p>Stable machinery typically sits near 0.15</p>
                </article>
                <article className="kpi-card">
                  <span className="micro-label">Lowest temperature</span>
                  <strong>{format(temperatureMin, 1)} <small>°C</small></strong>
                  <p>Temperature confirms danger after earlier signals</p>
                </article>
              </div>
            </section>

            <div className="decision-grid">
              <section className="panel evidence-panel">
                <span className="eyebrow">Transparent detector</span>
                <h2>Why this incident is flagged</h2>
                <div className="evidence-list">
                  {episodeEvidence.map((signal) => (
                    <div className="evidence-row" key={signal.id}>
                      <span className="evidence-dot" />
                      <div>
                        <strong>{signal.label}</strong>
                        <p>{signal.explanation} <span className="note-citation">Cloudy note {signal.cloudyNote}</span></p>
                      </div>
                      <span className="evidence-value">{signal.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel cloudy-panel">
                <div className="ai-heading">
                  <span className="eyebrow">Evidence-grounded AI</span>
                  <span className={`ai-mode ${visibleAiMode || "ready"}`}>{visibleAiMode === "live" ? "live LLM" : visibleAiMode || "ready"}</span>
                </div>
                <h2>Cloudy&apos;s incident brief</h2>
                <p className="briefing">“{presentedAiBrief?.summary || briefing}”</p>
                <div className="briefing-action">
                  <strong>{presentedAiBrief?.headline || "Recommended next action"}</strong>
                  {visibleAiBrief ? (
                    <ol className="action-list">
                      {visibleAiBrief.actions.map((action) => (
                        <li key={`${action.priority}-${action.id}`}><span>{action.priority}</span>{ACTION_CATALOG[action.id]}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>{isFailure ? "Inspect the water valves, prepare manual supply, and notify vulnerable residents before temperature falls." : "Inspect ventilation fans and compare delivered airflow with expected output before changing power demand."}</p>
                  )}
                </div>
                {visibleAiBrief && <p className="uncertainty"><strong>Uncertainty:</strong> {presentedAiBrief?.uncertainty}</p>}
                {visibleAiBrief && <p className="citation-line">Evidence cited: {visibleAiBrief.evidenceCitations.join(", ")}</p>}
                <button className="generate-button" disabled={aiLoading} onClick={generateIncidentBrief} type="button">
                  {aiLoading ? "Generating from validated evidence…" : visibleAiBrief ? "Regenerate live briefing" : "Generate live AI briefing"}
                </button>
                <p className="contract-note">{visibleAiProvider || "The model receives only validated evidence and must cite exact triggering signal IDs."}</p>
                {visibleAiError && <p className="ai-error">{visibleAiError}</p>}
              </section>
            </div>

            <section className="panel validation-panel">
              <div>
                <span className="eyebrow">Automated backtest · all 500 records</span>
                <h2>Detector performance</h2>
                <p>The detector never reads <code>system_status</code>. That supplied label is used only after detection to measure performance.</p>
              </div>
              <div className="validation-stats">
                <div><strong>{backtest.detectedFailureEvents}/2</strong><span>failures found</span></div>
                <div><strong>{Math.round(backtest.recall * 100)}%</strong><span>unsafe-hour recall</span></div>
                <div><strong>{(backtest.failureLeadHours[0] || 0).toFixed(0)}h</strong><span>earliest watch</span></div>
                <div><strong>{backtest.falsePositive}</strong><span>missing-data watches</span></div>
              </div>
            </section>

            <section className="panel operator-panel">
              <div>
                <span className="eyebrow">Human decision checkpoint</span>
                <h2>A coordinator remains in control</h2>
                <p>AI recommendations do not change building systems. Record the next reversible response for the incident log.</p>
              </div>
              <div className="decision-actions" aria-label="Record response decision">
                <button onClick={() => recordDecision("Inspect systems")} type="button">Inspect systems</button>
                <button onClick={() => recordDecision("Prepare manual supply")} type="button">Prepare manual supply</button>
                <button onClick={() => recordDecision("Notify vulnerable residents")} type="button">Notify residents</button>
              </div>
              <p className="decision-record">{decision ? `Recorded: ${decision}` : "No response recorded for this incident."}</p>
            </section>

            <section className="method-strip" aria-label="Detection method">
              <div className="method-step"><span className="micro-label">01 · observe</span><strong>Validate the record</strong><p>Normalise timestamps and the salvaged sensor identity.</p></div>
              <div className="method-step"><span className="micro-label">02 · compare</span><strong>Test healthy relationships</strong><p>Measure water decline and airflow efficiency residuals.</p></div>
              <div className="method-step"><span className="micro-label">03 · corroborate</span><strong>Join independent signals</strong><p>Check vibration, listener reports, and missing readings.</p></div>
              <div className="method-step"><span className="micro-label">04 · decide</span><strong>Explain before acting</strong><p>Turn validated evidence into a reviewable action brief.</p></div>
            </section>

            <footer className="footer-note">
              <span>Event dataset · 500 hourly records · 1–21 July 2026</span>
              <span>Built by 4Freshers for the dragons sheltering in Reid Library</span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
