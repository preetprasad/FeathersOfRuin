import assert from "node:assert/strict";
import test from "node:test";
import sensorData from "../locations/reid-library/data/processed/reid_library_sensor_data.json";
import {
  backtestDetector,
  detectEpisodes,
  prepareSensorData,
  runDetector,
  type RawSensorRecord,
} from "../lib/reid-analysis";

const rows = prepareSensorData(sensorData as RawSensorRecord[]);
const detections = runDetector(rows);

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
