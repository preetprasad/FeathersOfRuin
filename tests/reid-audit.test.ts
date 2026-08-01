import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuditEntry,
  parseAuditLog,
  resolveAuditEntry,
  serializeAuditLog,
} from "../lib/reid-audit";

const base = {
  incidentId: "water-failure-02",
  incidentLabel: "Water failure 02",
  incidentLevel: "failed" as const,
  incidentKind: "water" as const,
  actionId: "prepare-manual-water" as const,
  operator: "Reid duty coordinator",
  rationale: "Protect water availability while the valves are inspected.",
  evidenceIds: ["pressure-trend", "flow-trend"],
  aiMode: "live" as const,
  aiProvider: "Local Ollama",
};

test("captures the evidence and AI provenance present when an operator decides", () => {
  const entry = createAuditEntry(base, new Date("2026-07-16T01:00:00.000Z"), "audit-01");

  assert.equal(entry.id, "audit-01");
  assert.equal(entry.detectorProfile, "balanced");
  assert.deepEqual(entry.evidenceIds, ["pressure-trend", "flow-trend"]);
  assert.equal(entry.aiProvider, "Local Ollama");
  assert.equal(entry.resolution, null);
});

test("adds a review resolution without changing the original decision", () => {
  const entry = createAuditEntry(base, new Date("2026-07-16T01:00:00.000Z"), "audit-01");
  const [resolved] = resolveAuditEntry(
    [entry],
    entry.id,
    "Reid duty coordinator",
    "Manual supply confirmed and inspection handed over.",
    new Date("2026-07-16T02:00:00.000Z"),
  );

  assert.equal(resolved.rationale, entry.rationale);
  assert.equal(resolved.resolution?.note, "Manual supply confirmed and inspection handed over.");
  assert.equal(resolved.resolution?.resolvedAt, "2026-07-16T02:00:00.000Z");
});

test("round-trips valid audit exports and rejects malformed local data", () => {
  const entry = createAuditEntry(base, new Date("2026-07-16T01:00:00.000Z"), "audit-01");

  assert.deepEqual(parseAuditLog(serializeAuditLog([entry])), [entry]);
  assert.deepEqual(parseAuditLog("not-json"), []);
  assert.deepEqual(parseAuditLog(JSON.stringify({ version: 1, entries: [{ id: "incomplete" }] })), []);
});

test("does not overwrite the first resolution when the same decision is closed twice", () => {
  const entry = createAuditEntry(base, new Date("2026-07-16T01:00:00.000Z"), "audit-01");
  const first = resolveAuditEntry(
    [entry],
    entry.id,
    "First coordinator",
    "Inspection started.",
    new Date("2026-07-16T02:00:00.000Z"),
  );
  const second = resolveAuditEntry(
    first,
    entry.id,
    "Second coordinator",
    "Attempted overwrite.",
    new Date("2026-07-16T03:00:00.000Z"),
  );

  assert.deepEqual(second, first);
  assert.equal(second[0].resolution?.operator, "First coordinator");
});

test("rejects oversized audit history rather than loading an unbounded local payload", () => {
  const entries = Array.from({ length: 101 }, (_, index) =>
    createAuditEntry(base, new Date(1_785_000_000_000 + index * 1000), `audit-${index}`));

  assert.deepEqual(parseAuditLog(serializeAuditLog(entries)), []);
});
