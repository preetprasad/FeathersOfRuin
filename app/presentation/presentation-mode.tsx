"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import sensorData from "../../locations/reid-library/data/processed/reid_library_sensor_data.json";
import {
  DETECTOR_PROFILES,
  analyzeDetectorSensitivity,
  analyzeSensorTrust,
  applySensorTrustScenario,
  backtestDetector,
  buildFailureSignature,
  detectEpisodes,
  formatMetric,
  prepareSensorData,
  runDetector,
  type DetectorProfileId,
  type RawSensorRecord,
  type SensorTrustScenarioId,
} from "../../lib/reid-analysis";

const REPO = "https://github.com/preetprasad/FeathersOfRuin";
const ANALYSIS_SOURCE = `${REPO}/blob/d6b9fea15adf8647a631e297dc613dc1cb958182/lib/reid-analysis.ts`;

const slides = [
  { id: "opening", label: "Opening" },
  { id: "problem", label: "Problem" },
  { id: "interpretation", label: "Interpretation" },
  { id: "method", label: "Method" },
  { id: "residual", label: "Residual lab" },
  { id: "corroboration", label: "Corroboration" },
  { id: "signature", label: "Failure signature" },
  { id: "trust", label: "Sensor trust" },
  { id: "validation", label: "Validation" },
  { id: "implementation", label: "Implementation" },
  { id: "outcome", label: "Outcome" },
] as const;

const trustScenarios: Array<{ id: SensorTrustScenarioId; label: string }> = [
  { id: "baseline", label: "Recovered data" },
  { id: "missing-value", label: "Missing value" },
  { id: "duplicate-time", label: "Duplicate time" },
  { id: "impossible-value", label: "Impossible value" },
  { id: "frozen-channel", label: "Frozen channel" },
  { id: "unstable-drift", label: "Unstable drift" },
];

const codeExamples = {
  residual: {
    label: "Airflow residual",
    href: `${ANALYSIS_SOURCE}#L196-L200`,
    lines: [
      "export function airflowResidual(row: SensorRow) {",
      "  if (row.airflow === null || row.power === null) return null;",
      "  const calibration = row.source === \"barry_j_smart_sensor\" ? 0.15 : 0;",
      "  return row.airflow - (0.125 * row.power - 1.5 + calibration);",
      "}",
    ],
  },
  corroboration: {
    label: "Corroboration rule",
    href: `${ANALYSIS_SOURCE}#L280-L287`,
    lines: [
      "const waterWarning =",
      "  pressureDrop3h >= thresholds.pressureDrop3h &&",
      "  flowDrop3h >= thresholds.flowDrop3h &&",
      "  (row.sound !== \"normal\" ||",
      "   row.vibration >= thresholds.vibration);",
    ],
  },
  backtest: {
    label: "Detector backtest",
    href: `${ANALYSIS_SOURCE}#L452-L488`,
    lines: [
      "const predicted = detections[index].level !== \"safe\";",
      "const actual = row.status !== \"stable\";",
      "if (predicted && actual) truePositive += 1;",
      "if (predicted && !actual) falsePositive += 1;",
      "if (!predicted && actual) falseNegative += 1;",
    ],
  },
  trust: {
    label: "Sensor trust gate",
    href: `${ANALYSIS_SOURCE}#L605-L720`,
    lines: [
      "const completeness = presentNumericValues / expectedNumericValues;",
      "const plausibleRange = inRangeValues / rangeValues.length;",
      "const frozenChannels = numericKeys.filter(...);",
      "const failedChecks = checks.filter(check => check.status === \"fail\");",
      "const decision = failedChecks.length ? \"reject\" : \"admit\";",
    ],
  },
} as const;

type CodeKey = keyof typeof codeExamples;

function CodeCard({ concept }: { concept: CodeKey }) {
  const example = codeExamples[concept];
  return (
    <aside className="present-code-card">
      <div>
        <span>Actual implementation</span>
        <a href={example.href} rel="noreferrer" target="_blank">Open exact lines ↗</a>
      </div>
      <pre aria-label={`${example.label} source code`}><code>{example.lines.join("\n")}</code></pre>
    </aside>
  );
}

function SignatureChart({ points }: { points: ReturnType<typeof buildFailureSignature>["points"] }) {
  const width = 760;
  const height = 310;
  const paddingX = 44;
  const paddingY = 32;
  const path = (key: "pressureHealth" | "flowHealth" | "vibrationRisk") => points.map((point, index) => {
    const value = Math.max(0, Math.min(point[key] ?? 0, 110));
    const x = paddingX + index / Math.max(points.length - 1, 1) * (width - paddingX * 2);
    const y = height - paddingY - value / 110 * (height - paddingY * 2);
    return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="present-signature">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Pressure and flow health fall while vibration risk rises during the 24 hours before failure">
        {[0, 25, 50, 75, 100].map((value) => {
          const y = height - paddingY - value / 110 * (height - paddingY * 2);
          return <g key={value}><line x1={paddingX} x2={width - paddingX} y1={y} y2={y} /><text x="7" y={y + 4}>{value}</text></g>;
        })}
        <path className="signature-pressure" d={path("pressureHealth")} />
        <path className="signature-flow" d={path("flowHealth")} />
        <path className="signature-vibration" d={path("vibrationRisk")} />
        <text className="axis-time" x={paddingX} y={height - 5}>T−24h</text>
        <text className="axis-time" textAnchor="middle" x={width / 2} y={height - 5}>T−12h</text>
        <text className="axis-time" textAnchor="end" x={width - paddingX} y={height - 5}>Failure</text>
      </svg>
      <div className="present-chart-legend">
        <span className="pressure">Pressure health</span>
        <span className="flow">Flow health</span>
        <span className="vibration">Vibration risk</span>
      </div>
    </div>
  );
}

export function PresentationMode() {
  const deckRef = useRef<HTMLElement>(null);
  const allRows = useMemo(() => prepareSensorData(sensorData as RawSensorRecord[]), []);
  const detections = useMemo(() => runDetector(allRows), [allRows]);
  const episodes = useMemo(() => detectEpisodes(detections), [detections]);
  const backtest = useMemo(() => backtestDetector(allRows, detections), [allRows, detections]);
  const signature = useMemo(() => buildFailureSignature(allRows), [allRows]);
  const sensitivity = useMemo(() => analyzeDetectorSensitivity(allRows), [allRows]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [power, setPower] = useState(60);
  const [measuredAirflow, setMeasuredAirflow] = useState(5.4);
  const [ventilationVibration, setVentilationVibration] = useState(true);
  const [waterSignals, setWaterSignals] = useState({ pressure: true, flow: true, sound: true, vibration: false });
  const [trustScenario, setTrustScenario] = useState<SensorTrustScenarioId>("baseline");
  const [profileId, setProfileId] = useState<DetectorProfileId>("balanced");
  const [codeConcept, setCodeConcept] = useState<CodeKey>("residual");

  const expectedAirflow = 0.125 * power - 1.5;
  const residual = measuredAirflow - expectedAirflow;
  const ventilationResult = residual <= DETECTOR_PROFILES.balanced.thresholds.airflowResidual
    ? ventilationVibration ? "Confirmed warning" : "Efficiency anomaly · needs corroboration"
    : "Inside expected relationship";
  const waterConfirmed = waterSignals.pressure && waterSignals.flow && (waterSignals.sound || waterSignals.vibration);
  const waterResult = waterConfirmed ? "Confirmed warning" : waterSignals.sound ? "Listener watch only" : "Not escalated";
  const trustReport = useMemo(
    () => analyzeSensorTrust(applySensorTrustScenario(allRows, trustScenario)),
    [allRows, trustScenario],
  );
  const activeProfile = sensitivity.find((profile) => profile.id === profileId)!;
  const failureStart = signature.points[0];
  const failureEnd = signature.points.at(-1)!;
  const pressureLoss = Math.round((failureStart.pressureHealth ?? 0) - (failureEnd.pressureHealth ?? 0));
  const flowLoss = Math.round((failureStart.flowHealth ?? 0) - (failureEnd.flowHealth ?? 0));
  const vibrationRise = Math.round((failureEnd.vibrationRisk ?? 0) - (failureStart.vibrationRisk ?? 0));

  function goToSlide(index: number) {
    const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
    document.getElementById(slides[safeIndex].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const requested = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
    if (requested > 0) window.setTimeout(() => goToSlide(requested), 0);
  }, []);

  useEffect(() => {
    const sections = slides.map((slide) => document.getElementById(slide.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = slides.findIndex((slide) => slide.id === visible.target.id);
      if (index >= 0) {
        setActiveSlide(index);
        window.history.replaceState(null, "", `#${slides[index].id}`);
      }
    }, { root: deckRef.current, threshold: [0.55, 0.75] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(event.target.tagName)) return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goToSlide(activeSlide + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToSlide(activeSlide - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToSlide(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goToSlide(slides.length - 1);
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [activeSlide]);

  return (
    <div className="presentation-shell">
      <header className="presentation-topbar">
        <a className="presentation-brand" href="#opening" onClick={(event) => { event.preventDefault(); goToSlide(0); }}>
          <span>RS</span><strong>REID SENTINEL</strong><small>/ presentation mode</small>
        </a>
        <div className="presentation-progress" aria-label={`Slide ${activeSlide + 1} of ${slides.length}`}>
          <span style={{ width: `${(activeSlide + 1) / slides.length * 100}%` }} />
        </div>
        <nav aria-label="Presentation actions">
          <span>{String(activeSlide + 1).padStart(2, "0")} / {slides.length}</span>
          <Link href="/">Open evidence console</Link>
        </nav>
      </header>

      <nav className="presentation-rail" aria-label="Presentation slides">
        {slides.map((slide, index) => (
          <button aria-label={`Go to slide ${index + 1}: ${slide.label}`} aria-pressed={activeSlide === index} key={slide.id} onClick={() => goToSlide(index)} type="button">
            <span>{String(index + 1).padStart(2, "0")}</span><b>{slide.label}</b>
          </button>
        ))}
      </nav>

      <main className="presentation-deck" ref={deckRef}>
        <section className="present-slide present-opening" id="opening">
          <div className="present-slide-inner">
            <span className="present-kicker">4Freshers · Ultimate Hackathon · Reid Library</span>
            <div className="present-title-lockup">
              <span className="present-signal-orbit"><i /><i /><i /></span>
              <h1>Failure had a shape.<br /><em>Now we can see it coming.</em></h1>
              <p>An explainable early-warning and decision-support system for the dragons sheltering in Reid Library.</p>
            </div>
            <div className="present-opening-proof">
              <div><strong>500</strong><span>hourly records</span></div>
              <div><strong>4</strong><span>incidents recovered</span></div>
              <div><strong>21–23h</strong><span>confirmed warning</span></div>
              <div><strong>2/2</strong><span>failures detected</span></div>
            </div>
            <p className="present-key-hint">Use ← → or space to present · every result is calculated from the implementation</p>
          </div>
        </section>

        <section className="present-slide" id="problem">
          <div className="present-slide-inner">
            <span className="present-kicker">01 · The problem</span>
            <div className="present-heading-grid">
              <h2>The library had data.<br />It did not have <em>warning.</em></h2>
              <p>Two essential-system failures were visible only in hindsight. Operators had sensor readings and Cloudy&apos;s observations, but no method to combine them into a timely, defensible decision.</p>
            </div>
            <div className="problem-grid">
              <div className="raw-stream">
                <div className="raw-stream-heading"><span>RAW SENSOR ARCHIVE</span><b>500 × hourly</b></div>
                {allRows.slice(164, 170).map((row) => (
                  <div key={row.timestamp.toISOString()}>
                    <time>{row.timestamp.toISOString().slice(5, 16).replace("T", " · ")}</time>
                    <span>{formatMetric(row.pressure, 0)} kPa</span>
                    <span>{formatMetric(row.flow, 2)} L/s</span>
                    <span>{formatMetric(row.vibration, 2)} vib</span>
                    <b>{row.sound}</b>
                  </div>
                ))}
              </div>
              <div className="problem-tension">
                <article><span>Too much signal</span><strong>6 sensor channels</strong><p>Power, airflow, pressure, flow, temperature, and vibration move on different scales.</p></article>
                <article><span>Too little certainty</span><strong>Listener reports</strong><p>Useful context, but subjective observations cannot prove a failure alone.</p></article>
                <article><span>High consequence</span><strong>Water + ventilation</strong><p>Late recognition affects every shelter occupant and reduces safe response time.</p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="present-slide" id="interpretation">
          <div className="present-slide-inner">
            <span className="present-kicker">02 · Our interpretation</span>
            <div className="present-heading-grid">
              <h2>Not another dashboard.<br />An <em>evidence chain.</em></h2>
              <p>We interpreted the task as decision support: detect early, show why, communicate uncertainty, and leave the final operational choice with a human.</p>
            </div>
            <div className="evidence-chain">
              <article><span>01</span><b>Sensor record</b><p>Preserve missingness and source identity.</p></article>
              <i>→</i>
              <article><span>02</span><b>Trust gate</b><p>Reject incomplete, impossible, frozen, or drifting sources.</p></article>
              <i>→</i>
              <article><span>03</span><b>Transparent detector</b><p>Calculate physical features and corroborate independent signals.</p></article>
              <i>→</i>
              <article><span>04</span><b>AI brief</b><p>Explain validated evidence using cited signal IDs.</p></article>
              <i>→</i>
              <article><span>05</span><b>Human decision</b><p>Record a reversible response and its rationale.</p></article>
            </div>
            <div className="interpretation-boundary">
              <strong>Design boundary</strong>
              <p><code>system_status</code> is withheld from detection. It is used only afterward as supplied evaluation truth for retrospective measurement.</p>
              <span>Detection first</span><i>then</i><span>Evaluation</span>
            </div>
          </div>
        </section>

        <section className="present-slide" id="method">
          <div className="present-slide-inner">
            <span className="present-kicker">03 · Analysis method</span>
            <div className="present-heading-grid">
              <h2>Five reproducible steps.<br /><em>No black-box alert.</em></h2>
              <p>The detector is deterministic and inspectable. AI is deliberately downstream: it explains the result, but it does not invent the warning.</p>
            </div>
            <ol className="present-method">
              <li><span>01</span><strong>Clean</strong><p>Parse 500 hourly rows, retain missing values, and normalise source identity.</p></li>
              <li><span>02</span><strong>Baseline</strong><p>Model healthy airflow from power and measure the salvaged sensor&apos;s offset.</p></li>
              <li><span>03</span><strong>Feature</strong><p>Calculate 3-hour water decline, airflow residual, vibration, sound, and missingness.</p></li>
              <li><span>04</span><strong>Corroborate</strong><p>Escalate when independent physical or listener evidence agrees.</p></li>
              <li><span>05</span><strong>Backtest</strong><p>Compare predictions with withheld labels to measure lead time and alert burden.</p></li>
            </ol>
            <div className="method-principles">
              <span><b>Time-series features</b> make change visible</span>
              <span><b>Physical relationships</b> reveal efficiency loss</span>
              <span><b>Cross-signal evidence</b> reduces fragile conclusions</span>
            </div>
          </div>
        </section>

        <section className="present-slide" id="residual">
          <div className="present-slide-inner">
            <span className="present-kicker">04 · Interactive concept</span>
            <div className="present-heading-grid">
              <h2>Residual analysis finds a fan<br />that works hard but <em>delivers less.</em></h2>
              <p>A raw airflow value has little meaning alone. We compare delivered airflow against the amount expected for the current power demand.</p>
            </div>
            <div className="concept-lab-grid">
              <div className="residual-lab">
                <label>Power demand <strong>{power} kW</strong><input max="75" min="35" onChange={(event) => setPower(Number(event.target.value))} type="range" value={power} /></label>
                <label>Measured airflow <strong>{measuredAirflow.toFixed(1)} m³/s</strong><input max="8" min="2" onChange={(event) => setMeasuredAirflow(Number(event.target.value))} step="0.1" type="range" value={measuredAirflow} /></label>
                <button aria-pressed={ventilationVibration} className="corroborator-toggle" onClick={() => setVentilationVibration((value) => !value)} type="button">
                  <span>Independent vibration signal</span><b>{ventilationVibration ? "present" : "absent"}</b>
                </button>
                <div className="residual-equation">
                  <span>measured</span><i>−</i><span>expected</span><i>=</i><strong>residual</strong>
                  <b>{measuredAirflow.toFixed(2)}</b><i>−</i><b>{expectedAirflow.toFixed(2)}</b><i>=</i><b className={residual <= -0.55 ? "danger" : "safe"}>{formatMetric(residual, 2)} m³/s</b>
                </div>
                <div className={`lab-decision ${residual <= -0.55 ? "warning" : "safe"}`}><span>Balanced boundary · residual ≤ −0.55</span><strong>{ventilationResult}</strong></div>
              </div>
              <CodeCard concept="residual" />
            </div>
          </div>
        </section>

        <section className="present-slide" id="corroboration">
          <div className="present-slide-inner">
            <span className="present-kicker">05 · Interactive concept</span>
            <div className="present-heading-grid">
              <h2>One unusual reading creates attention.<br /><em>Agreement creates warning.</em></h2>
              <p>The balanced water detector requires deterioration in both delivery measures plus independent sound or vibration evidence.</p>
            </div>
            <div className="concept-lab-grid">
              <div className="corroboration-lab">
                <div className="signal-toggle-grid">
                  {([
                    ["pressure", "Pressure decline", "≥ 25 kPa / 3h"],
                    ["flow", "Flow decline", "≥ 0.12 L/s / 3h"],
                    ["sound", "Listener sound", "hum or rattle"],
                    ["vibration", "Vibration", "≥ 0.25"],
                  ] as const).map(([key, label, threshold]) => (
                    <button aria-pressed={waterSignals[key]} key={key} onClick={() => setWaterSignals((current) => ({ ...current, [key]: !current[key] }))} type="button">
                      <span>{waterSignals[key] ? "signal present" : "signal absent"}</span><strong>{label}</strong><small>{threshold}</small>
                    </button>
                  ))}
                </div>
                <div className="corroboration-formula-present"><span>pressure</span><b>+</b><span>flow</span><b>+</b><span>sound <i>or</i> vibration</span><strong>= {waterResult}</strong></div>
                <p>Try removing either water trend, then remove or add the independent corroborator.</p>
              </div>
              <CodeCard concept="corroboration" />
            </div>
          </div>
        </section>

        <section className="present-slide" id="signature">
          <div className="present-slide-inner">
            <span className="present-kicker">06 · Visualised analysis result</span>
            <div className="present-heading-grid">
              <h2>The same failure shape<br />appeared <em>twice.</em></h2>
              <p>We aligned both recorded water failures at their onset and averaged the preceding 24 hours. Pressure and flow collapse while vibration risk rises.</p>
            </div>
            <div className="signature-grid">
              <SignatureChart points={signature.points} />
              <div className="signature-findings">
                <article><strong>−{pressureLoss} pts</strong><span>pressure-health change</span></article>
                <article><strong>−{flowLoss} pts</strong><span>flow-health change</span></article>
                <article><strong>+{vibrationRise} pts</strong><span>vibration-risk change</span></article>
                <article className="lead"><strong>{Math.min(...backtest.confirmedLeadHours)}–{Math.max(...backtest.confirmedLeadHours)}h</strong><span>confirmed warning lead</span></article>
              </div>
            </div>
            <p className="truth-note"><strong>Evaluation boundary:</strong> historical status aligns the two failure onsets for this retrospective chart. The live detector never receives that field.</p>
          </div>
        </section>

        <section className="present-slide" id="trust">
          <div className="present-slide-inner">
            <span className="present-kicker">07 · Sensor Trust Gate</span>
            <div className="present-heading-grid">
              <h2>A detector is only as trustworthy<br />as the data it <em>admits.</em></h2>
              <p>Stress-test the salvaged Barry J record. Every scenario passes through the same fail-closed checks used by the application.</p>
            </div>
            <div className="trust-present-grid">
              <div>
                <div className="trust-scenario-tabs">
                  {trustScenarios.map((scenario) => <button aria-pressed={trustScenario === scenario.id} key={scenario.id} onClick={() => setTrustScenario(scenario.id)} type="button">{scenario.label}</button>)}
                </div>
                <div className="trust-gate-list">
                  {trustReport.checks.map((check) => <article className={check.status} key={check.id}><span>{check.status}</span><strong>{check.label}</strong><b>{check.value}</b></article>)}
                </div>
              </div>
              <div className="trust-decision-present">
                <span>{trustReport.confidence} decision</span>
                <strong>{trustReport.decision === "reject" ? "Reject source" : trustReport.decision === "admit-with-calibration" ? "Admit with calibration" : "Admit source"}</strong>
                <p>{trustReport.passedGates}/{trustReport.checks.length} gates cleared · {trustReport.adjustedGates} controlled adjustments</p>
                <CodeCard concept="trust" />
              </div>
            </div>
          </div>
        </section>

        <section className="present-slide" id="validation">
          <div className="present-slide-inner">
            <span className="present-kicker">08 · Validation and trade-offs</span>
            <div className="present-heading-grid">
              <h2>We did not choose thresholds<br />by <em>intuition alone.</em></h2>
              <p>Switch profiles to see the trade-off between warning lead, unsafe-hour coverage, and operator alert burden across all 500 records.</p>
            </div>
            <div className="validation-grid-present">
              <div className="profile-picker">
                {(Object.keys(DETECTOR_PROFILES) as DetectorProfileId[]).map((id) => <button aria-pressed={profileId === id} key={id} onClick={() => setProfileId(id)} type="button"><span>{DETECTOR_PROFILES[id].label}</span><small>{DETECTOR_PROFILES[id].description}</small></button>)}
              </div>
              <div className="profile-results">
                <article><strong>{activeProfile.detectedFailureEvents}/2</strong><span>failures found</span></article>
                <article><strong>{Math.round(activeProfile.confirmedUnsafeRecall * 100)}%</strong><span>unsafe-hour recall</span></article>
                <article><strong>{Math.min(...activeProfile.confirmedLeadHours)}–{Math.max(...activeProfile.confirmedLeadHours)}h</strong><span>confirmed lead</span></article>
                <article><strong>{activeProfile.confirmedFalseAlertHours}</strong><span>confirmed false alert-hours</span></article>
                <div className="profile-thresholds"><span>Pressure decline ≥ {activeProfile.thresholds.pressureDrop3h} kPa</span><span>Flow decline ≥ {activeProfile.thresholds.flowDrop3h.toFixed(2)} L/s</span><span>Residual ≤ {activeProfile.thresholds.airflowResidual.toFixed(2)} m³/s</span></div>
              </div>
              <CodeCard concept="backtest" />
            </div>
          </div>
        </section>

        <section className="present-slide" id="implementation">
          <div className="present-slide-inner">
            <span className="present-kicker">09 · Implementation and explainability</span>
            <div className="present-heading-grid">
              <h2>Every concept points to<br /><em>working code.</em></h2>
              <p>The application separates measurement, deterministic detection, language generation, and human action so each layer can be inspected independently.</p>
            </div>
            <div className="implementation-grid">
              <div className="code-selector" role="tablist" aria-label="Implementation concept">
                {(Object.keys(codeExamples) as CodeKey[]).map((key) => <button aria-selected={codeConcept === key} key={key} onClick={() => setCodeConcept(key)} role="tab" type="button"><span>{codeExamples[key].label}</span><small>{key === "residual" ? "physical relationship" : key === "corroboration" ? "multi-signal logic" : key === "trust" ? "fail-closed admission" : "withheld-label evaluation"}</small></button>)}
              </div>
              <CodeCard concept={codeConcept} />
              <div className="ai-boundary-present">
                <span>Validated signal IDs</span><i>→</i><span>Structured AI brief</span><i>→</i><span>Operator action</span>
                <p>AI is advisory. Responses are schema-checked, citations are verified against detector evidence, and only approved actions can be returned.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="present-slide present-outcome" id="outcome">
          <div className="present-slide-inner">
            <span className="present-kicker">10 · The outcome</span>
            <div className="outcome-lockup">
              <h2>From two failures with no warning<br />to <em>21–23 hours to act.</em></h2>
              <p>Reid Sentinel turns a raw historical record into a reviewable sequence: validate the source, detect physical deterioration, show the evidence, explain uncertainty, and preserve human control.</p>
            </div>
            <div className="outcome-proof">
              <article><strong>{allRows.length}</strong><span>records analysed</span></article>
              <article><strong>{episodes.length}</strong><span>sustained incidents</span></article>
              <article><strong>{backtest.detectedFailureEvents}/2</strong><span>failures recovered</span></article>
              <article><strong>{Math.round(backtest.recall * 100)}%</strong><span>unsafe-hour recall</span></article>
            </div>
            <div className="outcome-actions">
              <Link className="primary" href="/">Enter the live evidence console <span>→</span></Link>
              <a href={REPO} rel="noreferrer" target="_blank">Inspect the repository ↗</a>
              <button onClick={() => goToSlide(0)} type="button">Restart presentation</button>
            </div>
            <footer><strong>4Freshers</strong><span>Juan Enrique Somadinata · Dinh Khanh Duy Nguyen · Jeongyun Chae · Preet Prasad</span></footer>
          </div>
        </section>
      </main>

      <div className="presentation-controls" aria-label="Slide controls">
        <button aria-label="Previous slide" disabled={activeSlide === 0} onClick={() => goToSlide(activeSlide - 1)} type="button">←</button>
        <span>{slides[activeSlide].label}</span>
        <button aria-label="Next slide" disabled={activeSlide === slides.length - 1} onClick={() => goToSlide(activeSlide + 1)} type="button">→</button>
      </div>
    </div>
  );
}
