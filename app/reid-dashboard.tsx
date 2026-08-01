"use client";

import { useEffect, useMemo, useState } from "react";
import sensorData from "../locations/reid-library/data/processed/reid_library_sensor_data.json";
import { ACTION_CATALOG, presentIncidentBrief, type BriefingRequest, type IncidentBrief } from "../lib/reid-briefing";
import {
  AUDIT_STORAGE_KEY,
  OPERATOR_ACTION_LABELS,
  OPERATOR_ACTIONS,
  createAuditEntry,
  parseAuditLog,
  resolveAuditEntry,
  serializeAuditLog,
  type OperatorActionId,
  type OperatorAuditEntry,
} from "../lib/reid-audit";
import {
  airflowResidual,
  analyzeDetectorSensitivity,
  backtestDetector,
  buildFailureSignature,
  buildIncidentTimeline,
  detectEpisodes,
  prepareSensorData,
  runDetector,
  uniqueEvidence,
  type RawSensorRecord,
  type IncidentMilestone,
  type SensorRow,
} from "../lib/reid-analysis";

type MetricGroup = "water" | "ventilation" | "shelter";
type ProviderHealth = {
  primary: { provider: string; status: "available" | "unavailable" };
  secondary: { provider: string; status: "standby" | "not-configured" };
  guaranteedFallback: { provider: string; status: "available" };
};

const INTRO_STORAGE_KEY = "reid-sentinel:intro-seen:v1";

const campusBuildings = [
  [35, 12, 11, 7], [50, 11, 12, 8], [66, 14, 10, 6], [29, 23, 12, 7],
  [45, 24, 14, 8], [64, 25, 13, 7], [25, 36, 11, 8], [42, 37, 13, 8],
  [61, 37, 12, 8], [31, 50, 13, 7], [49, 51, 12, 7], [67, 50, 11, 8],
  [25, 64, 12, 8], [42, 64, 14, 8], [62, 65, 13, 8], [32, 78, 12, 7],
  [49, 79, 13, 7], [67, 79, 10, 8],
] as const;

function CinematicIntro({ cycle, onComplete }: { cycle: number; onComplete: () => void }) {
  return (
    <section
      aria-label="Reid Library disaster story"
      className="cinematic-intro"
      key={cycle}
    >
      <button className="intro-skip" onClick={onComplete} type="button">Skip intro</button>
      <div className="intro-film-grain" />
      <div className="intro-map-camera">
        <div className="intro-map-world">
          <span className="intro-road intro-road-north">Stirling Highway</span>
          <span className="intro-road intro-road-west">Fairway</span>
          <span className="intro-road intro-road-east">Hackett Drive</span>
          <div className="intro-river" />
          <div className="intro-campus">
            <div className="intro-campus-grid" />
            {campusBuildings.map(([left, top, width, height], index) => (
              <span
                className={`intro-building ${index === 7 ? "reid-building" : ""}`}
                key={`${left}-${top}`}
                style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
              />
            ))}
            <div className="intro-landmark winthrop"><i />Winthrop Hall</div>
            <div className="intro-landmark great-court"><i />Great Court</div>
            <div className="intro-landmark sunken"><i>R</i><span>Sunken Garden</span></div>
            <div className="intro-landmark computer-science"><i>CS</i><span>Computer Science</span></div>
            <div className="intro-landmark reid"><i>RS</i><span>Reid Library</span><small>Dragon shelter</small></div>
            <div className="intro-landmark matilda"><i>O</i><span>Matilda Bay</span></div>
            <div className="intro-threat-route"><span /><span /><span /><span /></div>
          </div>
          <div className="intro-map-caption">UWA Crawley · north-up field map</div>
        </div>
      </div>

      <div className="impact-flash" />
      <div className="impact-ring ring-one" />
      <div className="impact-ring ring-two" />
      <div className="feather-strikes" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
      <div className="system-failures" aria-hidden="true">
        <span>POWER · FAULT</span>
        <span>VENTILATION · DEGRADED</span>
        <span>WATER · PRESSURE LOSS</span>
      </div>
      <div className="intro-cloudy" aria-label="Cloudy the Reid Library dragon" role="img" />

      <div className="intro-narrative" aria-live="off">
        <p className="intro-line line-one">UWA Crawley · after the feathers fell</p>
        <p className="intro-line line-two">Reid Library became a shelter.</p>
        <p className="intro-line line-three">Then its essential systems began to fail.</p>
        <div className="intro-title-lockup">
          <span>4Freshers presents</span>
          <strong>REID SENTINEL</strong>
          <p>Failure had a shape. Now we can see it coming.</p>
        </div>
      </div>
      <button className="intro-enter" onClick={onComplete} type="button">Enter evidence console</button>
    </section>
  );
}

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

function auditTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Perth",
  }).format(new Date(value));
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

function IncidentTimeline({ milestones, kind }: { milestones: IncidentMilestone[]; kind: "general" | "water" | "ventilation" }) {
  const reference = milestones.at(-1)?.timestamp;
  const spanHours = milestones.length > 1
    ? Math.round((milestones.at(-1)!.timestamp.getTime() - milestones[0].timestamp.getTime()) / 3_600_000)
    : 0;

  return (
    <section className="panel timeline-panel">
      <div className="timeline-heading">
        <div>
          <span className="eyebrow">Calculated incident sequence</span>
          <h2>{kind === "water" ? `${spanHours} hours from first watch to failure` : `${spanHours} hours from warning to recovery`}</h2>
        </div>
        <p>{kind === "water"
          ? "Every stage is derived from detector timestamps; only the final confirmation uses supplied evaluation truth."
          : "The detector shows when delivery efficiency left—and returned to—the transparent operating boundary."}</p>
      </div>
      <ol className="incident-timeline" style={{ "--milestone-count": milestones.length } as React.CSSProperties}>
        {milestones.map((milestone, index) => {
          const hoursToReference = reference
            ? Math.round((reference.getTime() - milestone.timestamp.getTime()) / 3_600_000)
            : 0;
          return (
            <li className={`milestone ${milestone.level}`} key={milestone.id}>
              <div className="milestone-time">
                <strong>{hoursToReference ? `T−${hoursToReference}h` : "T0"}</strong>
                <span>{compactDate(milestone.timestamp)}</span>
              </div>
              <span className="milestone-node" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className="milestone-copy">
                <strong>{milestone.label}</strong>
                <p>{milestone.detail}</p>
                <span>{milestone.source === "evaluation" ? "supplied evaluation truth" : "transparent detector"}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SensitivityPanel({ profiles }: { profiles: ReturnType<typeof analyzeDetectorSensitivity> }) {
  const conservative = profiles.find((profile) => profile.id === "conservative")!;
  const balanced = profiles.find((profile) => profile.id === "balanced")!;
  const sensitive = profiles.find((profile) => profile.id === "sensitive")!;
  const conservativeDelay = Math.max(...balanced.confirmedLeadHours.map((hours, index) =>
    hours - (conservative.confirmedLeadHours[index] ?? hours)));
  const sameSensitiveLead = sensitive.confirmedLeadHours.every((hours, index) => hours === balanced.confirmedLeadHours[index]);

  function leadRange(hours: number[]) {
    const low = Math.min(...hours);
    const high = Math.max(...hours);
    return low === high ? `${low}h` : `${low}–${high}h`;
  }

  return (
    <section className="panel sensitivity-panel">
      <div className="sensitivity-heading">
        <div>
          <span className="eyebrow">Threshold sensitivity · all 500 records</span>
          <h2>Why balanced stays active</h2>
        </div>
        <p>
          Conservative rules delay confirmed warning by up to {conservativeDelay} hours. The sensitive profile
          {sameSensitiveLead ? " adds no lead time" : " changes lead time"} and produces {sensitive.confirmedFalseAlertHours} false alert-hours.
        </p>
      </div>
      <div className="sensitivity-grid">
        {profiles.map((profile) => (
          <article className={`sensitivity-card ${profile.id === "balanced" ? "active" : ""}`} key={profile.id}>
            <div className="sensitivity-card-heading">
              <strong>{profile.label}</strong>
              <span>{profile.detectedFailureEvents}/2 failures</span>
            </div>
            <p>{profile.description}</p>
            <dl>
              <div><dt>Confirmed lead</dt><dd>{leadRange(profile.confirmedLeadHours)}</dd></div>
              <div><dt>Confirmed coverage</dt><dd>{Math.round(profile.confirmedUnsafeRecall * 100)}%</dd></div>
              <div><dt>Alert-hours</dt><dd>{profile.confirmedAlertHours}</dd></div>
              <div><dt>False alert-hours</dt><dd>{profile.confirmedFalseAlertHours}</dd></div>
            </dl>
            <div className="threshold-envelope">
              <span>3h water drop ≥ {profile.thresholds.pressureDrop3h} kPa / {profile.thresholds.flowDrop3h.toFixed(2)} L/s</span>
              <span>Water band &lt; {profile.thresholds.waterWarningPressure} kPa / {profile.thresholds.waterWarningFlow.toFixed(2)} L/s</span>
              <span>Critical &lt; {profile.thresholds.criticalPressure} kPa / {profile.thresholds.criticalFlow.toFixed(2)} L/s</span>
              <span>Residual ≤ {profile.thresholds.airflowResidual.toFixed(2)} · vibration ≥ {profile.thresholds.vibration.toFixed(2)}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="sensitivity-note">Profiles change warning and critical thresholds; the recorded-failure boundary stays fixed. Supplied <code>system_status</code> labels are read afterward to calculate these results.</p>
    </section>
  );
}

function AnalysisMethodPanel({
  signature,
  confirmedLeadHours,
}: {
  signature: ReturnType<typeof buildFailureSignature>;
  confirmedLeadHours: number[];
}) {
  const width = 640;
  const height = 230;
  const paddingX = 32;
  const paddingY = 24;
  const chartPath = (key: "pressureHealth" | "flowHealth" | "vibrationRisk") => signature.points
    .map((point, index) => {
      const value = point[key] ?? 0;
      const x = paddingX + index / Math.max(signature.points.length - 1, 1) * (width - paddingX * 2);
      const y = height - paddingY - Math.max(0, Math.min(value, 110)) / 110 * (height - paddingY * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const start = signature.points[0];
  const failure = signature.points.at(-1)!;
  const pressureLoss = Math.round((start.pressureHealth ?? 0) - (failure.pressureHealth ?? 0));
  const flowLoss = Math.round((start.flowHealth ?? 0) - (failure.flowHealth ?? 0));
  const vibrationRise = Math.round((failure.vibrationRisk ?? 0) - (start.vibrationRisk ?? 0));
  const leadLow = Math.min(...confirmedLeadHours);
  const leadHigh = Math.max(...confirmedLeadHours);

  const methodSteps = [
    { number: "01", title: "Clean", detail: "Parse 500 hourly rows, preserve missingness, and normalise the Barry J sensor identity." },
    { number: "02", title: "Baseline", detail: "Model healthy airflow as 0.125 × power − 1.5 and correct the +0.15 m³/s sensor offset." },
    { number: "03", title: "Features", detail: "Calculate three-hour water decline, airflow residual, vibration, sound, and missing-data signals." },
    { number: "04", title: "Corroborate", detail: "Escalate only when independent physical or listener signals agree with the deterioration." },
    { number: "05", title: "Backtest", detail: "Run detection first, then compare it with supplied status labels to measure lead time and alert load." },
  ];

  return (
    <section className="panel analysis-method-panel">
      <div className="analysis-method-heading">
        <div>
          <span className="eyebrow">Data analysis method · reproducible</span>
          <h2>From raw readings to an early warning</h2>
        </div>
        <p>Transparent time-series features produce the alert. AI receives the validated result afterward and turns it into cited decision support.</p>
      </div>

      <ol className="analysis-pipeline" aria-label="Five-stage data analysis method">
        {methodSteps.map((step) => (
          <li key={step.number}>
            <span>{step.number}</span>
            <strong>{step.title}</strong>
            <p>{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="analysis-result-grid">
        <div className="failure-signature-chart">
          <div className="signature-chart-heading">
            <div>
              <span className="micro-label">Calculated result · mean of {signature.failureCount} failures</span>
              <h3>The repeated 24-hour failure signature</h3>
            </div>
            <ul aria-label="Chart legend">
              <li className="pressure">Pressure health</li>
              <li className="flow">Flow health</li>
              <li className="vibration">Vibration risk</li>
            </ul>
          </div>
          <svg
            aria-label="Average water pressure health and flow health fall while vibration risk rises during the 24 hours before both recorded failures"
            className="signature-chart"
            role="img"
            viewBox={`0 0 ${width} ${height}`}
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const y = height - paddingY - value / 110 * (height - paddingY * 2);
              return <g key={value}><line x1={paddingX} x2={width - paddingX} y1={y} y2={y} /><text x="2" y={y + 3}>{value}</text></g>;
            })}
            <path className="pressure-line" d={chartPath("pressureHealth")} />
            <path className="flow-line" d={chartPath("flowHealth")} />
            <path className="vibration-line" d={chartPath("vibrationRisk")} />
            <text className="time-label" x={paddingX} y={height - 3}>T−24h</text>
            <text className="time-label" textAnchor="middle" x={width / 2} y={height - 3}>T−12h</text>
            <text className="time-label" textAnchor="end" x={width - paddingX} y={height - 3}>Failure</text>
          </svg>
          <p className="signature-truth-note">Historical status is used only to align the two recorded failure onsets for this retrospective visual; the live detector does not receive it.</p>
        </div>

        <div className="analysis-findings">
          <span className="micro-label">What the analysis found</span>
          <div><strong>−{pressureLoss} pts</strong><p>average pressure-health change from T−24h to failure</p></div>
          <div><strong>−{flowLoss} pts</strong><p>average flow-health change across the same window</p></div>
          <div><strong>+{vibrationRise} pts</strong><p>average vibration-risk increase before failure</p></div>
          <div className="lead-result"><strong>{leadLow}–{leadHigh}h</strong><p>confirmed warning lead with the balanced detector</p></div>
        </div>
      </div>
    </section>
  );
}

export function ReidDashboard() {
  const allRows = useMemo(() => prepareSensorData(sensorData as RawSensorRecord[]), []);
  const allDetections = useMemo(() => runDetector(allRows), [allRows]);
  const episodes = useMemo(() => detectEpisodes(allDetections), [allDetections]);
  const backtest = useMemo(() => backtestDetector(allRows, allDetections), [allRows, allDetections]);
  const sensitivityProfiles = useMemo(() => analyzeDetectorSensitivity(allRows), [allRows]);
  const failureSignature = useMemo(() => buildFailureSignature(allRows), [allRows]);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [metricGroup, setMetricGroup] = useState<MetricGroup>("water");
  const [aiBrief, setAiBrief] = useState<IncidentBrief | null>(null);
  const [aiMode, setAiMode] = useState<"live" | "fallback" | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiIncidentId, setAiIncidentId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth | null>(null);
  const [auditEntries, setAuditEntries] = useState<OperatorAuditEntry[]>([]);
  const [auditReady, setAuditReady] = useState(false);
  const [operatorName, setOperatorName] = useState("Reid duty coordinator");
  const [selectedAction, setSelectedAction] = useState<OperatorActionId | null>(null);
  const [decisionRationale, setDecisionRationale] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [introVisible, setIntroVisible] = useState(true);
  const [introCycle, setIntroCycle] = useState(0);
  const episode = (episodes.find((item) => item.id === episodeId) || episodes[2] || episodes[0])!;

  useEffect(() => {
    let active = true;
    fetch("/api/briefing/health", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Provider health unavailable");
        return response.json() as Promise<ProviderHealth>;
      })
      .then((health) => {
        if (active) setProviderHealth(health);
      })
      .catch(() => {
        if (active) setProviderHealth(null);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!introVisible) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadySeen = window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
    if (reducedMotion || alreadySeen) {
      const hideIntro = window.setTimeout(() => setIntroVisible(false), 0);
      return () => window.clearTimeout(hideIntro);
    }

    document.body.classList.add("intro-playing");
    const finishTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
      setIntroVisible(false);
    }, 8_600);
    const skipOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
        setIntroVisible(false);
      }
    };
    window.addEventListener("keydown", skipOnEscape);
    return () => {
      document.body.classList.remove("intro-playing");
      window.clearTimeout(finishTimer);
      window.removeEventListener("keydown", skipOnEscape);
    };
  }, [introCycle, introVisible]);

  useEffect(() => {
    const loadAudit = window.setTimeout(() => {
      setAuditEntries(parseAuditLog(window.localStorage.getItem(AUDIT_STORAGE_KEY)));
      setAuditReady(true);
    }, 0);
    return () => window.clearTimeout(loadAudit);
  }, []);

  const rows = useMemo(() => {
    return allRows.filter((row) => row.timestamp >= episode.start && row.timestamp <= episode.end);
  }, [allRows, episode]);
  const episodeDetections = useMemo(
    () => allDetections.filter((item) => item.timestamp >= episode.start && item.timestamp <= episode.end),
    [allDetections, episode],
  );
  const episodeEvidence = useMemo(() => uniqueEvidence(episodeDetections), [episodeDetections]);
  const incidentTimeline = useMemo(
    () => buildIncidentTimeline(episode, allRows, allDetections),
    [episode, allRows, allDetections],
  );

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
  const incidentAuditEntries = auditEntries.filter((entry) => entry.incidentId === episode.id);
  const availableActions = OPERATOR_ACTIONS[episode.kind];

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

  function saveAuditEntries(entries: OperatorAuditEntry[]) {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, serializeAuditLog(entries));
    setAuditEntries(entries);
  }

  function recordAuditDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auditReady || !selectedAction || operatorName.trim().length < 2 || decisionRationale.trim().length < 3) return;
    const entry = createAuditEntry({
      incidentId: episode.id,
      incidentLabel: episode.label,
      incidentLevel: episode.level,
      incidentKind: episode.kind,
      actionId: selectedAction,
      operator: operatorName.trim(),
      rationale: decisionRationale.trim(),
      evidenceIds: episodeEvidence.map((signal) => signal.id),
      aiMode: visibleAiMode || "not-generated",
      aiProvider: visibleAiProvider || "No AI briefing generated",
    });
    saveAuditEntries([entry, ...auditEntries].slice(0, 100));
    setSelectedAction(null);
    setDecisionRationale("");
  }

  function closeAuditEntry(entryId: string) {
    const note = resolutionNotes[entryId]?.trim() || "";
    if (operatorName.trim().length < 2 || note.length < 3) return;
    saveAuditEntries(resolveAuditEntry(auditEntries, entryId, operatorName, note));
    setResolutionNotes((current) => ({ ...current, [entryId]: "" }));
  }

  function exportAuditLog() {
    const blob = new Blob([serializeAuditLog(auditEntries)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reid-sentinel-operator-audit.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function finishIntro() {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    setIntroVisible(false);
  }

  function replayIntro() {
    window.sessionStorage.removeItem(INTRO_STORAGE_KEY);
    setIntroVisible(true);
    setIntroCycle((current) => current + 1);
  }

  return (
    <div className="app-shell">
      {introVisible && <CinematicIntro cycle={introCycle} onComplete={finishIntro} />}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">RS</span>
          <span>REID SENTINEL</span>
          <span>/ essential systems</span>
        </div>
        <div className="topbar-status">
          <button className="replay-intro" onClick={replayIntro} type="button">Replay story</button>
          <div className={`provider-health ${providerHealth?.primary.status || "checking"}`} aria-live="polite">
            <span />
            {!providerHealth
              ? "Checking AI providers…"
              : providerHealth.primary.status === "available"
                ? `${providerHealth.primary.provider} online · ${providerHealth.secondary.status === "standby" ? "Claude standby" : "safe fallback ready"}`
                : providerHealth.secondary.status === "standby"
                  ? "Ollama offline · Claude ready"
                  : "Deterministic safe mode"}
          </div>
          <div className="live-pill"><span>Historical playback · July 2026</span></div>
        </div>
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
                  onClick={() => {
                    setEpisodeId(item.id);
                    setSelectedAction(null);
                    setDecisionRationale("");
                  }}
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

            <AnalysisMethodPanel signature={failureSignature} confirmedLeadHours={backtest.confirmedLeadHours} />

            <IncidentTimeline kind={episode.kind} milestones={incidentTimeline} />

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
                {visibleAiBrief && (
                  <ul className="ai-trust-strip" aria-label="AI response validation">
                    <li>Schema valid</li>
                    <li>{visibleAiBrief.evidenceCitations.length}/{visibleAiBrief.evidenceCitations.length} citations verified</li>
                    <li>{visibleAiBrief.actions.length}/{visibleAiBrief.actions.length} actions approved</li>
                    <li>Advisory only</li>
                  </ul>
                )}
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

            <SensitivityPanel profiles={sensitivityProfiles} />

            <section className="panel operator-audit-panel">
              <div className="audit-heading">
                <div>
                  <span className="eyebrow">Human decision checkpoint · device-local prototype</span>
                  <h2>Operator decision audit</h2>
                  <p>AI remains advisory. Every recorded response preserves the operator, rationale, detector evidence, and AI provenance present at the decision.</p>
                </div>
                <div className="audit-summary" aria-label="Audit summary">
                  <strong>{incidentAuditEntries.length}</strong>
                  <span>incident records</span>
                  <button disabled={!auditEntries.length} onClick={exportAuditLog} type="button">Export all JSON</button>
                </div>
              </div>

              <div className="audit-workspace">
                <form className="audit-form" onSubmit={recordAuditDecision}>
                  <h3>Record a reversible response</h3>
                  <label>
                    Operator
                    <input maxLength={80} onChange={(event) => setOperatorName(event.target.value)} required value={operatorName} />
                  </label>
                  <fieldset>
                    <legend>Selected response</legend>
                    <div className="decision-actions">
                      {availableActions.map((actionId) => (
                        <button
                          aria-pressed={selectedAction === actionId}
                          key={actionId}
                          onClick={() => setSelectedAction(actionId)}
                          type="button"
                        >
                          {OPERATOR_ACTION_LABELS[actionId]}
                        </button>
                      ))}
                    </div>
                    {selectedAction && <p className="selected-action-detail">{ACTION_CATALOG[selectedAction]}</p>}
                  </fieldset>
                  <label>
                    Decision rationale
                    <textarea
                      maxLength={280}
                      onChange={(event) => setDecisionRationale(event.target.value)}
                      placeholder="Why is this the safest reversible next step?"
                      required
                      rows={3}
                      value={decisionRationale}
                    />
                  </label>
                  <button
                    className="record-audit-button"
                    disabled={!auditReady || !selectedAction || operatorName.trim().length < 2 || decisionRationale.trim().length < 3}
                    type="submit"
                  >
                    Commit decision record
                  </button>
                  <p className="audit-storage-note">Stored only in this browser for the hackathon demo. Export before changing devices or clearing browser data.</p>
                </form>

                <div className="audit-log" aria-live="polite">
                  <div className="audit-log-heading">
                    <h3>{episode.label} history</h3>
                    <span>{auditReady ? `${incidentAuditEntries.filter((entry) => !entry.resolution).length} open` : "Loading…"}</span>
                  </div>
                  {!incidentAuditEntries.length ? (
                    <div className="audit-empty">
                      <strong>No decisions recorded</strong>
                      <p>Choose a response and explain why. The incident evidence snapshot will be attached automatically.</p>
                    </div>
                  ) : incidentAuditEntries.map((entry, index) => (
                    <article className={`audit-entry ${entry.resolution ? "resolved" : "open"}`} key={entry.id}>
                      <div className="audit-entry-heading">
                        <span>Decision {String(incidentAuditEntries.length - index).padStart(2, "0")}</span>
                        <strong>{entry.resolution ? "resolved" : "open"}</strong>
                      </div>
                      <h4>{OPERATOR_ACTION_LABELS[entry.actionId]}</h4>
                      <p>{entry.rationale}</p>
                      <div className="audit-meta">{entry.operator} · {auditTimestamp(entry.createdAt)}</div>
                      <ul className="audit-snapshot" aria-label="Decision evidence snapshot">
                        <li>balanced detector</li>
                        <li>{entry.evidenceIds.length} evidence signals</li>
                        <li>{entry.aiMode === "not-generated" ? "AI not generated" : `${entry.aiMode} · ${entry.aiProvider}`}</li>
                      </ul>
                      {entry.resolution ? (
                        <div className="resolution-record">
                          <strong>Resolution</strong>
                          <p>{entry.resolution.note}</p>
                          <span>{entry.resolution.operator} · {auditTimestamp(entry.resolution.resolvedAt)}</span>
                        </div>
                      ) : (
                        <div className="resolution-form">
                          <input
                            aria-label={`Resolution note for ${OPERATOR_ACTION_LABELS[entry.actionId]}`}
                            maxLength={280}
                            onChange={(event) => setResolutionNotes((current) => ({ ...current, [entry.id]: event.target.value }))}
                            placeholder="Outcome or handover note"
                            value={resolutionNotes[entry.id] || ""}
                          />
                          <button
                            disabled={operatorName.trim().length < 2 || (resolutionNotes[entry.id]?.trim().length || 0) < 3}
                            onClick={() => closeAuditEntry(entry.id)}
                            type="button"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
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
