import { z } from "zod";

export const briefingRequestSchema = z.object({
  incidentId: z.string().min(1).max(120),
  label: z.string().min(1).max(100),
  level: z.enum(["watch", "warning", "critical", "failed"]),
  kind: z.enum(["general", "water", "ventilation"]),
  window: z.object({ start: z.string().datetime(), end: z.string().datetime() }),
  leadHours: z.number().min(0).max(168).nullable(),
  totalRows: z.number().int().min(1).max(500),
  missingValues: z.number().int().min(0).max(3000),
  evidence: z.array(z.object({
    id: z.string().min(1).max(80),
    label: z.string().min(1).max(120),
    value: z.string().min(1).max(80),
    explanation: z.string().min(1).max(300),
    cloudyNote: z.number().int().min(1).max(5),
  })).min(1).max(10),
});

export const ACTION_CATALOG = {
  "inspect-water-valves": "Inspect the water valves and visible pipework; do not change controls until a coordinator approves.",
  "verify-water-reading": "Verify pressure and flow with a second instrument before escalating the response.",
  "prepare-manual-water": "Prepare the manual water supply without shutting down automation.",
  "notify-vulnerable-residents": "Notify carers of vulnerable residents that preparations are under way.",
  "inspect-ventilation-fans": "Inspect ventilation fans and ducts without changing power demand.",
  "verify-airflow-reading": "Verify delivered airflow and compare it with expected output.",
  "monitor-evidence": "Continue monitoring sensor quality, sound, vibration and the relevant trend signals.",
} as const;

const actionIdSchema = z.enum(Object.keys(ACTION_CATALOG) as [keyof typeof ACTION_CATALOG, ...(keyof typeof ACTION_CATALOG)[]]);

export const incidentBriefSchema = z.object({
  assessment: z.enum(["watch", "warning", "critical", "failed"]),
  pattern: z.enum(["water-deterioration", "ventilation-inefficiency", "insufficient-evidence"]),
  confidence: z.enum(["low", "moderate", "high"]),
  actions: z.array(z.object({
    priority: z.enum(["now", "next", "monitor"]),
    id: actionIdSchema,
  })).min(2).max(4),
  evidenceCitations: z.array(z.string().min(1).max(80)).min(1).max(8),
  uncertaintyFactors: z.array(z.enum([
    "historical-pattern-only",
    "listener-observation-subjective",
    "missing-sensor-data",
    "cause-not-confirmed",
  ])).min(1).max(4),
});

export type BriefingRequest = z.infer<typeof briefingRequestSchema>;
export type IncidentBrief = z.infer<typeof incidentBriefSchema>;

export const CLOUDY_CONTEXT = `
Cloudy's recovered maintenance hypotheses:
[Cloudy note 1] Pressure and flow deterioration can precede a bad valve day.
[Cloudy note 2] Sound changes and vibration should corroborate each other; listeners are useful but inconsistent.
[Cloudy note 3] Healthy ventilation has a linear power-to-airflow relationship; negative residual means poor delivery.
[Cloudy note 4] Temperature changes later, so it is consequence evidence rather than an early warning.
[Cloudy note 5] Missing sensor readings increase uncertainty and must never be interpreted as safe.
`.trim();

export function buildBriefingPrompt(input: BriefingRequest) {
  return `You are Cloudy's incident briefing assistant for the dragons sheltering in Reid Library.

Your job is decision support, not autonomous control. Use only the validated evidence JSON below. Do not invent measurements, causes, repairs, people, locations, or certainty. Cite evidence using its exact id in evidenceCitations. Distinguish observation from inference. If data is missing, say how it limits confidence. Select action ids only from the approved catalog; never write a new procedure.

Approved action catalog:
${JSON.stringify(ACTION_CATALOG, null, 2)}

${CLOUDY_CONTEXT}

Validated incident evidence:
${JSON.stringify(input, null, 2)}`;
}

export function deterministicBrief(input: BriefingRequest): IncidentBrief {
  const citations = input.evidence.slice(0, 4).map((item) => item.id);
  const water = input.kind === "water";
  return {
    assessment: input.level,
    pattern: water ? "water-deterioration" : "ventilation-inefficiency",
    confidence: input.evidence.length >= 3 ? "moderate" : "low",
    actions: water
      ? [
          { priority: "now", id: "inspect-water-valves" },
          { priority: "next", id: "prepare-manual-water" },
          { priority: "monitor", id: "monitor-evidence" },
        ]
      : [
          { priority: "now", id: "inspect-ventilation-fans" },
          { priority: "next", id: "verify-airflow-reading" },
          { priority: "monitor", id: "monitor-evidence" },
        ],
    evidenceCitations: citations,
    uncertaintyFactors: [
      "historical-pattern-only",
      "cause-not-confirmed",
      ...(input.missingValues > 0 ? ["missing-sensor-data" as const] : []),
    ],
  };
}

const PATTERN_LABELS: Record<IncidentBrief["pattern"], string> = {
  "water-deterioration": "corroborated water-system deterioration",
  "ventilation-inefficiency": "ventilation delivery below its healthy relationship",
  "insufficient-evidence": "an unresolved infrastructure watch",
};

const UNCERTAINTY_LABELS: Record<IncidentBrief["uncertaintyFactors"][number], string> = {
  "historical-pattern-only": "Historical repetition supports preparation but does not prove a future failure.",
  "listener-observation-subjective": "Listener observations are useful corroboration but remain subjective.",
  "missing-sensor-data": "Missing sensor values require an independent measurement before high-impact action.",
  "cause-not-confirmed": "The evidence identifies deterioration, not a confirmed root cause.",
};

export function presentIncidentBrief(brief: IncidentBrief, input: BriefingRequest) {
  const cited = brief.evidenceCitations
    .map((id) => input.evidence.find((item) => item.id === id))
    .filter((item): item is BriefingRequest["evidence"][number] => Boolean(item));
  const evidenceText = cited.map((item) => `${item.label}: ${item.value}`).join("; ");
  const leadText = input.leadHours === null ? "" : ` The earliest watch preceded recorded failure by ${input.leadHours} hours.`;
  return {
    headline: PATTERN_LABELS[brief.pattern],
    summary: `${input.label} was classified as ${PATTERN_LABELS[brief.pattern]} with ${brief.confidence} confidence. Evidence: ${evidenceText}.${leadText}`,
    uncertainty: (brief.uncertaintyFactors || ["cause-not-confirmed"]).map((factor) => UNCERTAINTY_LABELS[factor]).join(" "),
  };
}
