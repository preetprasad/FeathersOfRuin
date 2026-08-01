import { z } from "zod";
import { ACTION_CATALOG } from "./reid-briefing";

export const AUDIT_STORAGE_KEY = "reid-sentinel:audit:v1";
export const AUDIT_LOG_VERSION = 1;

export const OPERATOR_ACTIONS = {
  water: ["inspect-water-valves", "prepare-manual-water", "notify-vulnerable-residents"],
  ventilation: ["inspect-ventilation-fans", "verify-airflow-reading", "monitor-evidence"],
  general: ["verify-water-reading", "monitor-evidence", "notify-vulnerable-residents"],
} as const;

export const OPERATOR_ACTION_LABELS: Record<keyof typeof ACTION_CATALOG, string> = {
  "inspect-water-valves": "Inspect water system",
  "verify-water-reading": "Verify water reading",
  "prepare-manual-water": "Prepare manual supply",
  "notify-vulnerable-residents": "Notify vulnerable residents",
  "inspect-ventilation-fans": "Inspect ventilation",
  "verify-airflow-reading": "Verify airflow reading",
  "monitor-evidence": "Continue monitoring",
};

const actionIdSchema = z.enum(Object.keys(ACTION_CATALOG) as [keyof typeof ACTION_CATALOG, ...(keyof typeof ACTION_CATALOG)[]]);

export const operatorAuditEntrySchema = z.object({
  id: z.string().min(1).max(160),
  incidentId: z.string().min(1).max(120),
  incidentLabel: z.string().min(1).max(100),
  incidentLevel: z.enum(["watch", "warning", "critical", "failed"]),
  incidentKind: z.enum(["general", "water", "ventilation"]),
  actionId: actionIdSchema,
  operator: z.string().min(2).max(80),
  rationale: z.string().min(3).max(280),
  createdAt: z.string().datetime(),
  detectorProfile: z.literal("balanced"),
  evidenceIds: z.array(z.string().min(1).max(80)).min(1).max(10),
  aiMode: z.enum(["live", "fallback", "not-generated"]),
  aiProvider: z.string().min(1).max(100),
  resolution: z.object({
    operator: z.string().min(2).max(80),
    note: z.string().min(3).max(280),
    resolvedAt: z.string().datetime(),
  }).nullable(),
});

export type OperatorAuditEntry = z.infer<typeof operatorAuditEntrySchema>;
export type OperatorActionId = OperatorAuditEntry["actionId"];

type CreateAuditEntryInput = Omit<OperatorAuditEntry, "id" | "createdAt" | "detectorProfile" | "resolution">;

function auditId(incidentId: string, timestamp: string) {
  const random = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${incidentId}:${timestamp}:${random}`;
}

export function createAuditEntry(input: CreateAuditEntryInput, now = new Date(), id?: string): OperatorAuditEntry {
  const createdAt = now.toISOString();
  return operatorAuditEntrySchema.parse({
    ...input,
    id: id || auditId(input.incidentId, createdAt),
    createdAt,
    detectorProfile: "balanced",
    resolution: null,
  });
}

export function resolveAuditEntry(
  entries: OperatorAuditEntry[],
  entryId: string,
  operator: string,
  note: string,
  now = new Date(),
) {
  return entries.map((entry) => entry.id === entryId && !entry.resolution
    ? operatorAuditEntrySchema.parse({
        ...entry,
        resolution: { operator: operator.trim(), note: note.trim(), resolvedAt: now.toISOString() },
      })
    : entry);
}

export function parseAuditLog(value: string | null): OperatorAuditEntry[] {
  if (!value) return [];
  try {
    const parsed = z.object({
      version: z.literal(AUDIT_LOG_VERSION),
      entries: z.array(operatorAuditEntrySchema).max(100),
    }).safeParse(JSON.parse(value));
    return parsed.success ? parsed.data.entries : [];
  } catch {
    return [];
  }
}

export function serializeAuditLog(entries: OperatorAuditEntry[]) {
  return JSON.stringify({ version: AUDIT_LOG_VERSION, exportedAt: new Date().toISOString(), entries }, null, 2);
}
