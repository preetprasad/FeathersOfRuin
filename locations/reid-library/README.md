# Reid Library

> Region Three · Infrastructure monitoring · **Active starting location**

[Back to the event guide](../../README.md)

[Project decisions, pivots, delivery history, and action plan](./PROJECT_RECORD.md)

## Mission

Dragons depend on Reid Library's damaged automated power, ventilation, and water systems. The machinery still operates, but reliability is declining and almost nobody understands the complete system. Cloudy's maintenance notes and hourly readings contain warning patterns that have not yet been connected.

Build one focused system that makes infrastructure risk visible early enough for the dragons to act.

## Official project requirements

The solution must contain:

- A usable web interface
- A chart, table, trend, or other readable data component
- A meaningful, well-prompted LLM feature
- One selected problem thread rather than an attempt to solve the entire region

## Supplied files

The public Reid Library ZIP contains:

- `reid_library_sensor_data.csv`
- `cloudys_logs.md`
- A dataset README with column definitions

[Download the event datasets](https://drive.google.com/drive/folders/1PhiIBZ-ngRpJv91hGCu_9vg9zpwcYfbp?usp=sharing)

## Sensor fields

| Field | Meaning |
|---|---|
| `timestamp` | Hourly reading time |
| `power_kw` | Essential electrical power consumption |
| `airflow_m3s` | Ventilation airflow rate |
| `water_pressure_kpa` | Plumbing pressure |
| `water_flow_lps` | Plumbing flow rate |
| `temperature_c` | Internal shelter temperature |
| `vibration_level` | Relative mechanical vibration |
| `sound_event` | Young-dragon observation: normal, hum, or rattle |
| `system_status` | Ground-truth state: stable, warning, critical, failed, or recovering |
| `sensor_source` | Original system or salvaged Barry J sensor |

## Available threads

### 1. Cloudy's notes

Cloudy's maintenance logs describe recurring warning patterns, but nobody has tested the observations against historical readings.

**Decision to improve:** Which written observations are supported by the sensor history, and what warning rules can be recovered?

**Strong product direction:** Extract structured hypotheses from the notes, validate them with ordinary analysis, and display supporting and contradictory periods on a sensor timeline.

### 2. Two failures, no warning — recommended starting thread

Essential systems failed twice and one outage disabled power and ventilation during a cold night.

**Decision to improve:** Are conditions becoming dangerous, and what should residents do now?

**Strong product direction:** An early-warning dashboard with sensor trends, anomaly evidence, escalating alert levels, and an evidence-grounded incident briefing.

### 3. The listeners

Young dragons claim to recognise rattles, hums, and pauses before failures, but their method is inconsistent.

**Decision to improve:** Which acoustic observations are repeatable enough to support maintenance decisions?

**Strong product direction:** A structured observation log joined to sound, vibration, and system history, with normalised descriptions and accuracy tracking.

### 4. The two leaders

One leader wants manual operation for safety; the other believes automation is necessary for habitability.

**Decision to improve:** Which systems should remain automated, restricted, or shut down?

**Strong product direction:** A scenario-comparison tool balancing failure risk, warning confidence, and minimum power, water, and ventilation needs.

### 5. The salvaged sensor

A smart sensor recovered from Barry J Marshall Library is only partially configured.

**Decision to improve:** Is the new sensor trustworthy enough to integrate?

**Strong product direction:** A sensor-onboarding report that checks missingness, sampling, range, drift, offsets, and agreement with related channels.

## Initial dataset findings

These findings were produced from the event ZIP during the initial investigation and should be reproduced in a checked-in analysis before being treated as application logic.

- The CSV contains **500 hourly rows** from 1 July through 21 July 2026, not a complete 31-day month.
- There are **368 stable**, **84 warning**, **24 critical**, and **24 failed** rows.
- Two 12-hour failed periods occur on 6 July and 16 July.
- Each failure is preceded by 12 warning hours and 12 critical hours.
- Water pressure and flow deteriorate steadily before both failures.
- Vibration rises from roughly `0.15` in stable operation to about `0.65` in critical periods and `1.0` during failure.
- Power and airflow drop sharply during failed periods, followed by a temperature fall to roughly 15°C.
- Separate ventilation-warning periods break the healthy linear power-to-airflow relationship.
- Under healthy original-sensor operation, airflow closely follows `0.125 × power_kw − 1.5`.
- The Barry J source shows an approximately `+0.15 m³/s` airflow calibration offset in stable readings.
- Six numeric values are missing across otherwise stable rows; missingness must not be treated as automatically safe.
- `sound_event` aligns perfectly with the supplied status labels in this dataset: normal with stable, hum with warning, and rattle with critical or failed. Treat this as a strong event feature while acknowledging that real observations would be noisier.
- The CSV uses `barry_j_` as the source value even though the data guide describes `barry_j_smart_sensor`; normalise this discrepancy during ingestion.

## Concepts to understand

### Domain

- Predictive and preventive maintenance
- Infrastructure reliability and failure modes
- Early-warning systems
- Safety versus service availability
- Automated versus manual operation
- Maintenance-knowledge preservation
- Human observations as evidence
- Alert fatigue and false alarms

### Time-series and sensor analysis

- Datetime parsing and chronological ordering
- Missing values and sensor-quality checks
- Baselines and thresholds
- Rate of change
- Rolling averages and variability
- Multivariate anomaly detection
- Correlation and lagged correlation
- Change-point detection
- Pre-failure patterns
- Sensor drift and calibration offsets
- Frozen or repeated readings
- Cross-sensor validation and sensor fusion

### AI and product

- Maintenance-note extraction
- Converting notes into testable hypotheses
- Technical-log summarisation
- Observation normalisation
- Evidence-grounded alert explanations
- Structured LLM outputs
- Sensor timelines
- Alert acknowledgement
- Recommended-action checklists
- Historical incident review

## Recommended first milestone

Use **Two failures, no warning** as the initial thread and build a read-only evidence dashboard before adding live AI.

The first milestone should:

1. Load and validate the supplied CSV.
2. Normalise source names and timestamps.
3. Keep `system_status` as an evaluation label, not an input that leaks the answer.
4. Plot pressure, flow, vibration, power, airflow, and temperature around the two failures.
5. Calculate the expected power-to-airflow relationship and its residual.
6. Detect declining water health and ventilation inefficiency using transparent rules.
7. Show which signals triggered an alert.
8. Add an LLM briefing only after the evidence object is reliable.

## Reid Sentinel implementation status

The complete judged workflow is implemented as the repository's main web application.

**Live public dashboard:** [reid-sentinel.vercel.app](https://reid-sentinel.vercel.app/)

Current capabilities:

- Opens with a skippable cinematic campus sequence that zooms from the UWA field map into Reid Library, visualises the feather strike and infrastructure failure, introduces Cloudy, and hands off to the evidence console
- Presents the complete five-stage analysis method beside a calculated 24-hour signature averaged across both recorded failures
- Loads all 500 event records from the checked-in CSV
- Normalises the truncated `barry_j_` sensor identity
- Automatically discovers two failures and two ventilation warnings instead of relying on hard-coded incident windows
- Switches between water, ventilation, and shelter signal views
- Calculates the healthy power-to-airflow relationship and corrects the known Barry J airflow offset
- Surfaces water decline, vibration, listener observations, missing values, and temperature consequence
- Keeps `system_status` as an evaluation ribbon rather than using it as detector input
- Traces every detector signal to the relevant recovered Cloudy note
- Backtests the detector over all 500 records and displays measured performance
- Builds an incident-specific timeline from detector timestamps, showing watch, corroborated warning, critical threshold, and recorded failure with exact lead times
- Compares conservative, balanced, and sensitive threshold profiles over all 500 records so the active thresholds are justified by measured lead time, coverage, and false-alert load
- Sends a schema-validated evidence object to a live LLM and requires structured, cited output
- Uses a token-protected 4Freshers Ollama bridge as the primary model in the public demo
- Fails over to Claude Haiku when Ollama is unavailable, then to validated deterministic decision support if every model is unavailable
- Displays live primary, hosted-secondary, and guaranteed-fallback readiness in the dashboard
- Gives the coordinator an incident-specific audit workflow that records operator identity, rationale, evidence and AI provenance, resolution notes, and an exportable decision history while keeping AI out of direct system control

### Measured detector result

The checked-in automated tests currently establish:

| Measure | Result |
|---|---:|
| Recorded failure events detected | 2 of 2 |
| Earliest listener watch before each failure | 24 hours |
| Corroborated warning before each failure | At least 21 hours |
| Recall across supplied unsafe hours | 100% |
| Extra watches | 6 |
| Explanation for extra watches | The six supplied missing numeric readings |

These are results on the supplied historical event data, not claims about general performance on future building data.

### Cinematic opening and accessibility

On a visitor's first load in a browser session, Reid Sentinel presents an approximately nine-second story sequence:

```text
UWA campus map → Reid Library zoom → feather strike → power/ventilation/water faults → Cloudy arrives → evidence console
```

The map is an original HTML/CSS interpretation of the hackathon's north-up field-map visual language rather than a copied screenshot. It identifies the main survivor regions and locates Reid Library before the camera closes in on the selected challenge. The official Cloudy mascot artwork is loaded from the hackathon website so the transition remains connected to the event story.

The intro includes a persistent **Skip intro** control, supports the Escape key, runs only once per browser session, and can be restarted from **Replay story** in the dashboard header. Visitors who request reduced motion bypass the animation automatically. The animation communicates narrative context only; no evidence or operating controls are hidden behind it.

### Presentation-ready analysis method

The dashboard brings the method and the result together in one judge-facing component instead of expecting the presenter to assemble the explanation from separate panels.

The five displayed stages are:

1. **Clean:** Parse all 500 hourly records, retain missing values as uncertainty, normalise timestamps, and normalise the truncated Barry J source name.
2. **Baseline:** Establish healthy infrastructure relationships. In particular, expected airflow is `0.125 × power_kw − 1.5`, with the observed Barry J `+0.15 m³/s` offset corrected before comparison.
3. **Features:** Calculate three-hour pressure and flow changes, airflow residual, vibration, listener sound, and missing-data signals.
4. **Corroborate:** Require independent signals to agree before escalating a water or ventilation warning. Listener observations support a warning but do not prove failure alone.
5. **Backtest:** Run the detector without `system_status`, then compare its output against those supplied labels afterward to measure lead time, coverage, and false-alert load.

The adjoining result chart aligns the onset of the two recorded failures and averages the preceding 24 hours. Pressure and flow are expressed as health percentages of the stable `350 kPa` and `2.2 L/s` baselines; vibration is expressed on the observed failure scale of `1.0`. This makes the repeated shape directly comparable even though the three fields use different physical units. The chart clearly labels this as retrospective use of the status field and states that the live detector does not receive that label.

Suggested presentation explanation:

> We first cleaned the 500 hourly records and corrected the salvaged sensor identity and offset. We learned the healthy power-to-airflow relationship, then engineered transparent time-series features: three-hour water decline, airflow residual, vibration, sound, and missingness. We only escalate when independent signals corroborate each other. Finally, we backtest the detector against the supplied status labels after detection. The visual shows the result: across both failures, pressure and flow fall together while vibration rises, and the balanced rules confirm warning 21 to 23 hours before failure without a false confirmed alert-hour.

### Calculated incident timeline

Selecting either water failure produces a judge-visible sequence calculated directly from the detector output:

```text
Water failure 01: T−24h listener watch → T−23h corroborated warning → T−13h critical → T0 recorded failure
Water failure 02: T−24h listener watch → T−21h corroborated warning → T−14h critical → T0 recorded failure
```

The first three milestones are labelled as transparent detector output. The final milestone is explicitly labelled as supplied evaluation truth, and the interface states that this label was not used to derive the warning. Ventilation incidents instead show warning onset, lowest calculated airflow efficiency, and return inside the warning boundary.

### Transparent detector rules

| Rule | Threshold | Evidence source |
|---|---|---|
| Initial watch | Sound differs from `normal`, or a value is missing | Cloudy notes 2 and 5 |
| Water warning | Pressure drops at least 25 kPa and flow drops at least 0.12 L/s over three hours, corroborated by sound or vibration | Cloudy notes 1 and 2 |
| Water critical | Pressure below 250 kPa and flow below 1.6 L/s | Cloudy note 1 |
| Water failed | Pressure at or below 100 kPa and flow at or below 0.35 L/s | Historical failure evidence |
| Ventilation warning | Airflow residual at or below −0.55 m³/s with vibration at or above 0.25 | Cloudy notes 2 and 3 |

Thresholds are intentionally visible and testable. `system_status` is used only to calculate backtest results after detection.

### Threshold sensitivity analysis

The dashboard reruns the transparent detector across all 500 supplied records with three complete threshold profiles. This is not an LLM judgement: each result is calculated from detector timestamps and evaluated against `system_status` only after detection.

| Profile | Confirmed lead before failures | Recorded failures detected | Confirmed unsafe-hour coverage | Confirmed alert-hours | False confirmed alert-hours |
|---|---:|---:|---:|---:|---:|
| Conservative | 21 h and 17 h | 2 of 2 | 90.15% | 119 | 0 |
| **Balanced — active** | **23 h and 21 h** | **2 of 2** | **96.21%** | **127** | **0** |
| Sensitive | 23 h and 21 h | 2 of 2 | 96.21% | 129 | 2 |

The balanced profile remains active because it confirms both failures two to four hours earlier than the conservative profile without producing any false confirmed alert-hours. The sensitive profile produces the same failure lead times and unsafe-hour coverage as balanced, but adds two false alert-hours. On this dataset, lowering the thresholds further therefore adds alert load without improving warning time.

The tested early-warning profile envelopes are:

| Profile | 3-hour pressure drop | 3-hour flow drop | Airflow residual | Vibration corroboration |
|---|---:|---:|---:|---:|
| Conservative | 35 kPa | 0.18 L/s | −0.70 m³/s | 0.30 |
| **Balanced — active** | **25 kPa** | **0.12 L/s** | **−0.55 m³/s** | **0.25** |
| Sensitive | 18 kPa | 0.08 L/s | −0.40 m³/s | 0.18 |

The interface also exposes each profile's water warning band and critical boundary. The recorded-failure boundary stays fixed at 100 kPa and 0.35 L/s so the experiment varies advance warning rather than redefining failure.

These measurements describe only the supplied historical dataset. They support an explainable hackathon configuration, not a claim that the selected thresholds are already validated for a real building. A production deployment would require prospective monitoring, reviewed false positives, sensor-specific calibration, and controlled threshold revision.

### Live AI contract

The server sends only a bounded, schema-validated incident evidence object to the model. The model must return:

- A short headline and alert assessment
- An evidence-grounded summary
- Two to four prioritised, reversible actions
- Exact detector signal IDs as citations
- An explicit uncertainty statement

The endpoint rejects oversized or malformed requests, treats evidence strings as untrusted data, filters invented citation IDs, keeps credentials server-side, and never lets the model operate infrastructure directly.

The current public demo uses `gemma3:4b` through a token-protected ngrok bridge as its primary model. The bridge exposes only the fixed briefing endpoint, caps concurrent requests, validates message size, fixes the local model and generation settings, and requires a secret stored only in local and Vercel environment configuration. If both bounded Ollama attempts fail, the same validated evidence and output schema are sent to `claude-haiku-4-5`. Vercel AI Gateway remains an optional third model route when configured. If every live provider fails, the endpoint returns a cited deterministic brief.

Provider order:

```text
Ollama primary → Claude hosted fallback → optional Vercel AI Gateway → deterministic safe mode
```

### Operator decision audit workflow

The final decision remains with a human coordinator. For each incident, the interface offers only reversible, incident-appropriate responses: water incidents receive water actions, while ventilation incidents receive ventilation and verification actions. A response cannot be committed until the coordinator supplies an operator name, selects an action, and writes a rationale.

Each decision record preserves:

- Incident ID, label, level, and infrastructure type
- Selected approved action
- Operator name, rationale, and Australia/Perth display time backed by an ISO timestamp
- The active `balanced` detector profile
- Exact detector evidence IDs visible when the decision was made
- Whether an AI brief had been generated, plus its live or fallback mode and provider
- Open or resolved status
- Resolution operator, outcome or handover note, and resolution timestamp

Open decisions can be resolved only after an outcome or handover note is entered. The original action, rationale, evidence snapshot, and creation timestamp remain unchanged. The complete log can be exported as versioned JSON for judging or later analysis. Malformed stored records are rejected instead of being displayed as trusted history, and the device keeps no more than 100 entries.

This hackathon implementation deliberately labels the log as a **device-local prototype**. It survives refreshes in the same browser, but it is not a tamper-resistant, multi-user production audit system. Production would require authenticated operator identities, server-side append-only storage, access control, retention policy, clock controls, and independently reviewable change history.

Suggested demo flow:

1. Open a water failure and generate or review its evidence brief.
2. Select a reversible response, enter the coordinator's rationale, and commit it.
3. Show the attached balanced-detector, evidence-count, and AI-provenance snapshot.
4. Enter a handover or outcome note and resolve the record.
5. Export the complete JSON audit log.

Local Claude configuration belongs only in the ignored `.env.local` file:

```dotenv
ANTHROPIC_API_KEY=replace_with_your_claude_key
ANTHROPIC_MODEL=claude-haiku-4-5
```

Never paste the key into documentation, client code, screenshots, issues, commits, or chat. Production uses the same names as Vercel environment variables, with `ANTHROPIC_API_KEY` stored as a sensitive secret.

### Demo AI operations

For Ollama to remain the primary provider during judging, the Mac must remain awake and connected. Keep these two existing processes running:

1. The token-protected proxy on local port `11435`.
2. The ngrok tunnel forwarding to port `11435`.

The local secret is stored in the ignored `.env.ollama-proxy` file and must never be committed. If either process needs restarting:

```bash
set -a
source .env.ollama-proxy
set +a
npm run ollama:proxy
```

In a second terminal:

```bash
ngrok http 11435
```

If ngrok assigns a different URL, replace the sensitive Vercel `OLLAMA_REMOTE_URL` production variable and redeploy. The token normally remains unchanged. `OLLAMA_REMOTE_TOKEN` must match `OLLAMA_PROXY_TOKEN` but must never be printed in documentation or application output. If the Mac or tunnel becomes unavailable, the application automatically uses Claude instead of blocking the briefing workflow.

### Verification

```bash
npm run lint
npm test
npx next build
```

The test suite covers incident discovery, calculated incident milestones, lead time, ventilation recovery, false alarms, threshold sensitivity, ground-truth isolation, server rendering, audit evidence and AI provenance capture, resolution integrity, malformed local audit data, Ollama-to-Claude failover, provider-health reporting, malformed model output, retry recovery, invented citations, incident-inappropriate actions, prompt-injection boundaries, transport failure, deterministic fallback, malformed evidence, and request-size limits. The dashboard exposes provider readiness and the resulting trust contract with schema, citation, approved-action, and advisory-only indicators.

## Implementation warning

Do not claim correlation proves a future failure. Distinguish observed anomalies, repeated historical patterns, and predictions. Avoid using `system_status` directly as an input feature; it is the supplied ground truth for evaluating the detection workflow.

## Suggested directory layout

```text
reid-library/
├── README.md
├── data/
│   ├── raw/        # Unmodified event files
│   └── processed/  # Reproducible cleaned outputs
├── analysis/       # Profiling and detector experiments
├── app/            # Reid monitoring application
└── docs/           # Decisions, prompts, and demo notes
```

## Active decision record

```text
Selected thread: Two failures, no warning (initial assumption)
Primary user: Reid Library maintenance coordinator
Decision improved: Whether conditions require investigation, preparation, or evacuation
Core evidence: Water decline, vibration, sound, airflow efficiency, and temperature lag
AI responsibility: Convert validated evidence into a concise incident briefing and action checklist
Definition of done: A user can identify an approaching failure, inspect why it was flagged, and choose a response
```
