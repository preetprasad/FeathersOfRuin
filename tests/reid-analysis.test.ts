import assert from "node:assert/strict";
import test from "node:test";
import sensorData from "../locations/reid-library/data/processed/reid_library_sensor_data.json";
import {
  applySensorTrustScenario,
  backtestDetector,
  analyzeDetectorSensitivity,
  analyzeSensorTrust,
  buildIncidentTimeline,
  buildFailureSignature,
  detectEpisodes,
  formatMetric,
  prepareSensorData,
  runDetector,
  type RawSensorRecord,
  type SensorRow,
} from "../lib/reid-analysis";

const rows = prepareSensorData(sensorData as RawSensorRecord[]);
const detections = runDetector(rows);

test("formats near-zero measurements without exposing negative zero", () => {
  assert.equal(formatMetric(-0.004, 2), "0.00");
  assert.equal(formatMetric(-0.006, 2), "-0.01");
  assert.equal(formatMetric(null, 2), "—");
});

function rowAt(hour: number, overrides: Partial<SensorRow> = {}): SensorRow {
  return {
    timestamp: new Date(Date.UTC(2026, 6, 1, hour)),
    power: 60,
    airflow: 6,
    pressure: 350,
    flow: 2.2,
    temperature: 22,
    vibration: 0.15,
    sound: "normal",
    status: "stable",
    source: "original",
    ...overrides,
  };
}

test("detects the four sustained Reid incidents without using ground-truth status", () => {
  const episodes = detectEpisodes(detections);
  assert.deepEqual(episodes.map((episode) => episode.label), [
    "Water failure 01",
    "Ventilation drift 01",
    "Water failure 02",
    "Ventilation drift 02",
  ]);
});

test("recovers both failures with a 24-hour watch and at least 21 hours confirmed warning", () => {
  const result = backtestDetector(rows, detections);
  assert.equal(result.detectedFailureEvents, 2);
  assert.deepEqual(result.failureLeadHours, [24, 24]);
  assert.ok(result.confirmedLeadHours.every((hours) => hours >= 21));
});

test("surfaces all supplied unsafe hours with no more than the six missing-data watches", () => {
  const result = backtestDetector(rows, detections);
  assert.equal(result.falseNegative, 0);
  assert.equal(result.falsePositive, 6);
  assert.ok(result.precision > 0.95);
  assert.equal(result.recall, 1);
});

test("does not read system_status while deriving a row detection", () => {
  const altered = rows.map((row) => ({ ...row, status: "stable" as const }));
  assert.deepEqual(runDetector(altered), detections);
});

test("builds calculated warning timelines for both recorded water failures", () => {
  const waterEpisodes = detectEpisodes(detections).filter((episode) => episode.kind === "water");
  const timelines = waterEpisodes.map((episode) => buildIncidentTimeline(episode, rows, detections));
  assert.deepEqual(timelines.map((timeline) => timeline.map((item) => item.label)), [
    ["Listener watch", "Corroborated warning", "Critical threshold", "Recorded failure"],
    ["Listener watch", "Corroborated warning", "Critical threshold", "Recorded failure"],
  ]);
  assert.deepEqual(timelines.map((timeline) => {
    const failureAt = timeline.at(-1)!.timestamp.getTime();
    return timeline.map((item) => (failureAt - item.timestamp.getTime()) / 3_600_000);
  }), [
    [24, 23, 13, 0],
    [24, 21, 14, 0],
  ]);
  assert.ok(timelines.every((timeline) => timeline.at(-1)?.source === "evaluation"));
});

test("shows ventilation warning onset, worst efficiency, and recovery", () => {
  const ventilationEpisodes = detectEpisodes(detections).filter((episode) => episode.kind === "ventilation");
  const timelines = ventilationEpisodes.map((episode) => buildIncidentTimeline(episode, rows, detections));
  assert.ok(timelines.every((timeline) => timeline[0].label === "Efficiency warning"));
  assert.ok(timelines.every((timeline) => timeline.some((item) => item.label === "Lowest efficiency")));
  assert.ok(timelines.every((timeline) => timeline.at(-1)?.label === "Warning cleared"));
});

test("calculates the lead-time and alert-load trade-off for all threshold profiles", () => {
  const profiles = analyzeDetectorSensitivity(rows);
  assert.deepEqual(profiles.map((profile) => profile.id), ["conservative", "balanced", "sensitive"]);
  assert.deepEqual(profiles.map((profile) => profile.detectedFailureEvents), [2, 2, 2]);
  assert.deepEqual(profiles.map((profile) => profile.confirmedLeadHours), [[21, 17], [23, 21], [23, 21]]);
  assert.deepEqual(profiles.map((profile) => profile.confirmedAlertHours), [119, 127, 129]);
  assert.deepEqual(profiles.map((profile) => profile.confirmedFalseAlertHours), [0, 0, 2]);
  assert.ok(profiles[0].confirmedUnsafeRecall < profiles[1].confirmedUnsafeRecall);
  assert.equal(profiles[1].confirmedUnsafeRecall, profiles[2].confirmedUnsafeRecall);
});

test("builds a retrospective average signature across both recorded failures", () => {
  const signature = buildFailureSignature(rows);
  const first = signature.points[0];
  const failure = signature.points.at(-1)!;

  assert.equal(signature.failureCount, 2);
  assert.equal(signature.points.length, 25);
  assert.equal(first.hoursBeforeFailure, 24);
  assert.equal(failure.hoursBeforeFailure, 0);
  assert.ok((first.pressureHealth ?? 0) - (failure.pressureHealth ?? 0) > 60);
  assert.ok((first.flowHealth ?? 0) - (failure.flowHealth ?? 0) > 70);
  assert.ok((failure.vibrationRisk ?? 0) - (first.vibrationRisk ?? 0) > 70);
});

test("admits the salvaged sensor provisionally after applying its measured airflow correction", () => {
  const trust = analyzeSensorTrust(rows);

  assert.equal(trust.rowCount, 50);
  assert.equal(trust.expectedRows, 50);
  assert.equal(trust.presentNumericValues, 300);
  assert.equal(trust.expectedNumericValues, 300);
  assert.equal(trust.frozenChannels.length, 0);
  assert.ok(Math.abs(trust.rawAirflowOffset - 0.15) < 0.001);
  assert.ok(trust.correctedResidualMae < 0.001);
  assert.equal(trust.failedGates, 0);
  assert.equal(trust.decision, "admit-with-calibration");
  assert.equal(trust.confidence, "provisional");
});

test("rejects a salvaged sensor record that loses an entire numeric channel", () => {
  const damaged = rows.map((row) => row.source === "barry_j_smart_sensor" ? { ...row, airflow: null } : row);
  const trust = analyzeSensorTrust(damaged);

  assert.equal(trust.decision, "reject");
  assert.ok(trust.failedGates >= 2);
  assert.equal(trust.checks.find((check) => check.id === "completeness")?.status, "fail");
  assert.equal(trust.checks.find((check) => check.id === "calibration")?.status, "fail");
});

test("rejects a missing salvaged source instead of treating an empty report as healthy", () => {
  const trust = analyzeSensorTrust(rows, "not-installed");

  assert.equal(trust.rowCount, 0);
  assert.equal(trust.decision, "reject");
  assert.ok(trust.failedGates >= 4);
});

test("rejects timestamp gaps and duplicates in an otherwise complete salvaged stream", () => {
  const firstBarry = rows.findIndex((row) => row.source === "barry_j_smart_sensor");
  const damaged = rows.map((row, index) => index === firstBarry + 10
    ? { ...row, timestamp: new Date(row.timestamp.getTime() + 3_600_000) }
    : row);
  const trust = analyzeSensorTrust(damaged);

  assert.equal(trust.decision, "reject");
  assert.equal(trust.checks.find((check) => check.id === "cadence")?.status, "fail");
});

test("rejects one physically impossible salvaged reading", () => {
  let changed = false;
  const damaged = rows.map((row) => {
    if (!changed && row.source === "barry_j_smart_sensor") {
      changed = true;
      return { ...row, pressure: 900 };
    }
    return row;
  });
  const trust = analyzeSensorTrust(damaged);

  assert.equal(trust.decision, "reject");
  assert.equal(trust.checks.find((check) => check.id === "range")?.status, "fail");
});

test("rejects a salvaged channel frozen for four consecutive readings", () => {
  let changed = 0;
  const damaged = rows.map((row) => {
    if (row.source === "barry_j_smart_sensor" && changed < 4) {
      changed += 1;
      return { ...row, temperature: 20 };
    }
    return row;
  });
  const trust = analyzeSensorTrust(damaged);

  assert.equal(trust.decision, "reject");
  assert.ok(trust.frozenChannels.includes("temperature"));
});

test("keeps a listener-only observation at watch rather than escalating it", () => {
  const sample = [rowAt(0), rowAt(1), rowAt(2), rowAt(3, { sound: "hum" })];
  const result = runDetector(sample).at(-1)!;

  assert.equal(result.level, "watch");
  assert.equal(result.kind, "general");
  assert.deepEqual(result.signals.map((signal) => signal.id), ["listener-sound"]);
});

test("does not confirm a water warning when trend signals lack independent corroboration", () => {
  const sample = [
    rowAt(0),
    rowAt(1),
    rowAt(2),
    rowAt(3, { pressure: 300, flow: 1.9, sound: "normal", vibration: 0.15 }),
  ];
  const result = runDetector(sample).at(-1)!;

  assert.notEqual(result.level, "warning");
  assert.notEqual(result.level, "critical");
  assert.ok(result.signals.some((signal) => signal.id === "pressure-trend"));
  assert.ok(result.signals.some((signal) => signal.id === "flow-trend"));
});

test("drives every interactive trust stress scenario from the same fail-closed analysis", () => {
  const expectedFailureGate = {
    "missing-value": "completeness",
    "duplicate-time": "cadence",
    "impossible-value": "range",
    "frozen-channel": "frozen",
    "unstable-drift": "calibration",
  } as const;

  const baseline = analyzeSensorTrust(applySensorTrustScenario(rows, "baseline"));
  assert.equal(baseline.decision, "admit-with-calibration");

  for (const [scenario, gate] of Object.entries(expectedFailureGate)) {
    const report = analyzeSensorTrust(applySensorTrustScenario(rows, scenario as keyof typeof expectedFailureGate));
    assert.equal(report.decision, "reject", `${scenario} should reject the source`);
    assert.equal(report.checks.find((check) => check.id === gate)?.status, "fail");
  }
});
