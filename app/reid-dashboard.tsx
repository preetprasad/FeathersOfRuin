"use client";

import { useMemo, useState } from "react";
import sensorCsv from "../locations/reid-library/data/raw/reid_library_sensor_data.csv?raw";

type Status = "stable" | "warning" | "critical" | "failed";
type SensorRow = {
  timestamp: Date;
  power: number | null;
  airflow: number | null;
  pressure: number | null;
  flow: number | null;
  temperature: number | null;
  vibration: number | null;
  sound: string;
  status: Status;
  source: string;
};

type Episode = {
  id: string;
  label: string;
  date: string;
  start: string;
  end: string;
  severity: "warning" | "failure";
  summary: string;
};

type MetricGroup = "water" | "ventilation" | "shelter";

const episodes: Episode[] = [
  {
    id: "failure-one",
    label: "Water failure 01",
    date: "5–6 July",
    start: "2026-07-05 00:00:00",
    end: "2026-07-06 12:00:00",
    severity: "failure",
    summary: "Pressure and flow decline for 24 hours before system failure.",
  },
  {
    id: "ventilation-one",
    label: "Ventilation drift 01",
    date: "10–11 July",
    start: "2026-07-10 04:00:00",
    end: "2026-07-11 10:00:00",
    severity: "warning",
    summary: "Power remains high while delivered airflow falls below expectation.",
  },
  {
    id: "failure-two",
    label: "Water failure 02",
    date: "15–16 July",
    start: "2026-07-15 00:00:00",
    end: "2026-07-16 12:00:00",
    severity: "failure",
    summary: "The first failure pattern repeats ten days later.",
  },
  {
    id: "ventilation-two",
    label: "Ventilation drift 02",
    date: "18–20 July",
    start: "2026-07-18 22:00:00",
    end: "2026-07-20 04:00:00",
    severity: "warning",
    summary: "A second efficiency loss overlaps the salvaged sensor handover.",
  },
];

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

function parseDate(value: string) {
  return new Date(`${value.replace(" ", "T")}+08:00`);
}

function parseNumber(value: string | undefined) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsv(csv: string): SensorRow[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  const index = (name: string) => headers.indexOf(name);

  return lines.map((line) => {
    const cells = line.split(",");
    const source = cells[index("sensor_source")]?.trim();
    return {
      timestamp: parseDate(cells[index("timestamp")]),
      power: parseNumber(cells[index("power_kw")]),
      airflow: parseNumber(cells[index("airflow_m3s")]),
      pressure: parseNumber(cells[index("water_pressure_kpa")]),
      flow: parseNumber(cells[index("water_flow_lps")]),
      temperature: parseNumber(cells[index("temperature_c")]),
      vibration: parseNumber(cells[index("vibration_level")]),
      sound: cells[index("sound_event")]?.trim() || "unknown",
      status: (cells[index("system_status")]?.trim() || "stable") as Status,
      source: source === "barry_j_" ? "barry_j_smart_sensor" : source,
    };
  });
}

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

function airflowResidual(row: SensorRow) {
  if (row.airflow === null || row.power === null) return null;
  const calibration = row.source === "barry_j_smart_sensor" ? 0.15 : 0;
  const expected = 0.125 * row.power - 1.5 + calibration;
  return row.airflow - expected;
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
  const allRows = useMemo(() => parseCsv(sensorCsv), []);
  const [episodeId, setEpisodeId] = useState("failure-two");
  const [metricGroup, setMetricGroup] = useState<MetricGroup>("water");
  const episode = episodes.find((item) => item.id === episodeId) || episodes[0];

  const rows = useMemo(() => {
    const start = parseDate(episode.start);
    const end = parseDate(episode.end);
    return allRows.filter((row) => row.timestamp >= start && row.timestamp <= end);
  }, [allRows, episode]);

  const pressureMin = extrema(rows.map((row) => row.pressure), "min");
  const flowMin = extrema(rows.map((row) => row.flow), "min");
  const vibrationMax = extrema(rows.map((row) => row.vibration), "max");
  const temperatureMin = extrema(rows.map((row) => row.temperature), "min");
  const residualMin = extrema(rows.map(airflowResidual), "min");
  const pressureStart = rows.find((row) => row.pressure !== null)?.pressure ?? null;
  const pressureDrop = pressureStart !== null && pressureMin !== null ? pressureStart - pressureMin : null;
  const rattles = rows.filter((row) => row.sound === "rattle").length;
  const missing = rows.reduce(
    (total, row) =>
      total + [row.airflow, row.pressure, row.flow, row.temperature, row.vibration].filter((value) => value === null).length,
    0,
  );

  const isFailure = episode.severity === "failure";
  const briefing = isFailure
    ? `Water pressure loses ${format(pressureDrop, 0)} kPa across the incident window while vibration rises to ${format(vibrationMax, 2)}. The same sequence appears before both recorded failures, providing a 24-hour preparation window.`
    : `Delivered airflow falls roughly ${format(Math.abs(residualMin ?? 0), 2)} m³/s below the healthy power relationship. Water remains comparatively stable, isolating this episode as ventilation inefficiency rather than system-wide failure.`;

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
                  <span className={`severity ${item.severity}`}>{item.severity}</span>
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
                  <div className="evidence-row">
                    <span className="evidence-dot" />
                    <div>
                      <strong>{isFailure ? "Water pressure deterioration" : "Airflow efficiency loss"}</strong>
                      <p>{isFailure ? "Pressure declines before power and temperature show the full consequence." : "Power demand stays high while measured airflow breaks Cloudy's healthy relationship."}</p>
                    </div>
                    <span className="evidence-value">{isFailure ? `−${format(pressureDrop, 0)} kPa` : `${format(residualMin, 2)} m³/s`}</span>
                  </div>
                  <div className="evidence-row">
                    <span className="evidence-dot" />
                    <div>
                      <strong>Mechanical stress</strong>
                      <p>Vibration and listener observations provide a second, independent signal.</p>
                    </div>
                    <span className="evidence-value">{format(vibrationMax, 2)} peak</span>
                  </div>
                  <div className="evidence-row">
                    <span className="evidence-dot" />
                    <div>
                      <strong>Listener corroboration</strong>
                      <p>Rattles occur during critical and failed states in the supplied history.</p>
                    </div>
                    <span className="evidence-value">{rattles} rattles</span>
                  </div>
                  <div className="evidence-row">
                    <span className="evidence-dot" />
                    <div>
                      <strong>Data completeness</strong>
                      <p>Missing readings are surfaced instead of silently interpreted as safe.</p>
                    </div>
                    <span className="evidence-value">{missing} missing</span>
                  </div>
                </div>
              </section>

              <section className="panel cloudy-panel">
                <span className="eyebrow">Briefing contract · preview</span>
                <h2>Cloudy&apos;s incident brief</h2>
                <p className="briefing">“{briefing}”</p>
                <div className="briefing-action">
                  <strong>Recommended next action</strong>
                  <p>{isFailure ? "Inspect the water valves, prepare manual supply, and notify vulnerable residents before temperature falls." : "Inspect ventilation fans and compare delivered airflow with expected output before changing power demand."}</p>
                </div>
                <p className="contract-note">
                  This first version uses a deterministic briefing fallback. The final LLM will receive only the validated evidence object and must cite the triggering signals.
                </p>
              </section>
            </div>

            <section className="method-strip" aria-label="Detection method">
              <div className="method-step"><span className="micro-label">01 · observe</span><strong>Validate the record</strong><p>Normalise timestamps and the salvaged sensor identity.</p></div>
              <div className="method-step"><span className="micro-label">02 · compare</span><strong>Test healthy relationships</strong><p>Measure water decline and airflow efficiency residuals.</p></div>
              <div className="method-step"><span className="micro-label">03 · corroborate</span><strong>Join independent signals</strong><p>Check vibration, listener reports, and missing readings.</p></div>
              <div className="method-step"><span className="micro-label">04 · decide</span><strong>Explain before acting</strong><p>Turn validated evidence into a reviewable action brief.</p></div>
            </section>

            <footer className="footer-note">
              <span>Event dataset · 500 hourly records · 1–21 July 2026</span>
              <span>Built for the dragons sheltering in Reid Library · Feathers of Ruin</span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
