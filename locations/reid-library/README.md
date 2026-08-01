# Reid Library

> Region Three · Infrastructure monitoring · **Active starting location**

[Back to the event guide](../../README.md)

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
