export type Status = "stable" | "warning" | "critical" | "failed";
export type AlertLevel = "safe" | "watch" | "warning" | "critical" | "failed";
export type IncidentKind = "general" | "water" | "ventilation";

export type RawSensorRecord = {
  timestamp: string;
  power_kw: number | null;
  airflow_m3s: number | null;
  water_pressure_kpa: number | null;
  water_flow_lps: number | null;
  temperature_c: number | null;
  vibration_level: number | null;
  sound_event: string;
  system_status: string;
  sensor_source: string;
};

export type SensorRow = {
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

export type EvidenceSignal = {
  id: string;
  label: string;
  value: string;
  explanation: string;
  cloudyNote: number;
};

export type Detection = {
  timestamp: Date;
  level: AlertLevel;
  kind: IncidentKind;
  signals: EvidenceSignal[];
  pressureDrop3h: number | null;
  flowDrop3h: number | null;
  airflowResidual: number | null;
};

export type DetectedEpisode = {
  id: string;
  label: string;
  date: string;
  start: Date;
  end: Date;
  level: Exclude<AlertLevel, "safe" | "watch"> | "watch";
  kind: IncidentKind;
  summary: string;
  detections: Detection[];
};

export type IncidentMilestone = {
  id: string;
  label: string;
  detail: string;
  timestamp: Date;
  level: AlertLevel;
  source: "detector" | "evaluation";
};

export const CLOUDY_NOTES = [
  { id: 1, title: "The pipes are getting old", hypothesis: "Pressure and flow deterioration can precede valve failure." },
  { id: 2, title: "The library has a rhythm", hypothesis: "Sound and vibration should corroborate sensor warnings." },
  { id: 3, title: "The fans are working harder", hypothesis: "Healthy power and airflow follow a linear relationship." },
  { id: 4, title: "A cold night reminder", hypothesis: "Temperature is a delayed consequence, not an early signal." },
  { id: 5, title: "Missing pieces", hypothesis: "Missing sensor values must be surfaced as uncertainty." },
] as const;

const LEVEL_RANK: Record<AlertLevel, number> = { safe: 0, watch: 1, warning: 2, critical: 3, failed: 4 };

export function parsePerthDate(value: string) {
  return new Date(`${value.replace(" ", "T")}+08:00`);
}

export function prepareSensorData(records: RawSensorRecord[]): SensorRow[] {
  return records.map((row) => ({
    timestamp: parsePerthDate(row.timestamp),
    power: row.power_kw,
    airflow: row.airflow_m3s,
    pressure: row.water_pressure_kpa,
    flow: row.water_flow_lps,
    temperature: row.temperature_c,
    vibration: row.vibration_level,
    sound: row.sound_event.trim() || "unknown",
    status: (row.system_status.trim() || "stable") as Status,
    source: row.sensor_source.trim() === "barry_j_" ? "barry_j_smart_sensor" : row.sensor_source.trim(),
  }));
}

export function airflowResidual(row: SensorRow) {
  if (row.airflow === null || row.power === null) return null;
  const calibration = row.source === "barry_j_smart_sensor" ? 0.15 : 0;
  return row.airflow - (0.125 * row.power - 1.5 + calibration);
}

function difference(current: number | null, previous: number | null) {
  return current === null || previous === null ? null : previous - current;
}

export function detectRow(rows: SensorRow[], index: number): Detection {
  const row = rows[index];
  const previous = rows[Math.max(0, index - 3)];
  const pressureDrop3h = difference(row.pressure, previous.pressure);
  const flowDrop3h = difference(row.flow, previous.flow);
  const residual = airflowResidual(row);
  const missing = [row.power, row.airflow, row.pressure, row.flow, row.temperature, row.vibration].filter(
    (value) => value === null,
  ).length;
  const signals: EvidenceSignal[] = [];

  if (row.sound !== "normal") {
    signals.push({
      id: "listener-sound",
      label: "Listener sound changed",
      value: row.sound,
      explanation: "A hum or rattle is treated as an observation to corroborate, never as proof by itself.",
      cloudyNote: 2,
    });
  }
  if (pressureDrop3h !== null && pressureDrop3h >= 25) {
    signals.push({
      id: "pressure-trend",
      label: "Water pressure falling",
      value: `${pressureDrop3h.toFixed(0)} kPa / 3h`,
      explanation: "The three-hour pressure decline exceeds the transparent 25 kPa warning threshold.",
      cloudyNote: 1,
    });
  }
  if (flowDrop3h !== null && flowDrop3h >= 0.12) {
    signals.push({
      id: "flow-trend",
      label: "Water flow weakening",
      value: `${flowDrop3h.toFixed(2)} L/s / 3h`,
      explanation: "Flow is deteriorating alongside pressure rather than fluctuating independently.",
      cloudyNote: 1,
    });
  }
  if (residual !== null && residual <= -0.55) {
    signals.push({
      id: "airflow-efficiency",
      label: "Airflow below expected output",
      value: `${residual.toFixed(2)} m³/s`,
      explanation: "Delivered airflow is materially below Cloudy's healthy power-to-airflow relationship.",
      cloudyNote: 3,
    });
  }
  if (row.vibration !== null && row.vibration >= 0.25) {
    signals.push({
      id: "mechanical-vibration",
      label: "Mechanical vibration elevated",
      value: row.vibration.toFixed(2),
      explanation: "Vibration is above the 0.25 corroboration threshold.",
      cloudyNote: 2,
    });
  }
  if (missing > 0) {
    signals.push({
      id: "missing-data",
      label: "Sensor data missing",
      value: `${missing} field${missing === 1 ? "" : "s"}`,
      explanation: "An absent reading increases uncertainty and is never interpreted as safe.",
      cloudyNote: 5,
    });
  }

  let level: AlertLevel = "safe";
  let kind: IncidentKind = "general";
  const waterFailed = row.pressure !== null && row.flow !== null && row.pressure <= 100 && row.flow <= 0.35;
  const waterCritical = row.pressure !== null && row.flow !== null && row.pressure < 250 && row.flow < 1.6;
  const waterWarning =
    (pressureDrop3h !== null &&
      flowDrop3h !== null &&
      pressureDrop3h >= 25 &&
      flowDrop3h >= 0.12 &&
      (row.sound !== "normal" || (row.vibration ?? 0) >= 0.25)) ||
    (row.pressure !== null && row.flow !== null && row.pressure < 320 && row.flow < 1.95 && row.sound !== "normal");
  const ventilationWarning = residual !== null && residual <= -0.55 && (row.vibration ?? 0) >= 0.25;

  if (waterFailed) {
    level = "failed";
    kind = "water";
  } else if (waterCritical) {
    level = "critical";
    kind = "water";
  } else if (ventilationWarning) {
    level = "warning";
    kind = "ventilation";
  } else if (waterWarning) {
    level = "warning";
    kind = "water";
  } else if (row.sound !== "normal" || missing > 0) {
    level = "watch";
  }

  return { timestamp: row.timestamp, level, kind, signals, pressureDrop3h, flowDrop3h, airflowResidual: residual };
}

export function runDetector(rows: SensorRow[]) {
  return rows.map((_, index) => detectRow(rows, index));
}

function highestLevel(detections: Detection[]) {
  return detections.reduce<AlertLevel>((highest, item) =>
    LEVEL_RANK[item.level] > LEVEL_RANK[highest] ? item.level : highest, "safe");
}

function formatEpisodeDate(start: Date, end: Date) {
  const day = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Perth" });
  return `${day.format(start)}–${day.format(end)}`;
}

export function detectEpisodes(detections: Detection[]): DetectedEpisode[] {
  const groups: Detection[][] = [];
  for (const detection of detections.filter((item) => item.level !== "safe")) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    if (!group || !previous || detection.timestamp.getTime() - previous.timestamp.getTime() > 2 * 60 * 60 * 1000) {
      groups.push([detection]);
    } else {
      group.push(detection);
    }
  }

  let waterCount = 0;
  let ventilationCount = 0;
  return groups
    .filter((group) => group.length >= 3)
    .map((group) => {
      const level = highestLevel(group) as DetectedEpisode["level"];
      const kind = group.find((item) => item.kind !== "general")?.kind ?? "general";
      const count = kind === "water" ? ++waterCount : ++ventilationCount;
      const label = kind === "water" ? `Water failure ${String(count).padStart(2, "0")}` : `Ventilation drift ${String(count).padStart(2, "0")}`;
      return {
        id: `${kind}-${group[0].timestamp.toISOString()}`,
        label,
        date: formatEpisodeDate(group[0].timestamp, group.at(-1)!.timestamp),
        start: group[0].timestamp,
        end: group.at(-1)!.timestamp,
        level,
        kind,
        summary: kind === "water"
          ? "Listener watch followed by corroborated pressure and flow deterioration."
          : "Airflow fell below the healthy power relationship with elevated vibration.",
        detections: group,
      };
    });
}

export function buildIncidentTimeline(
  episode: DetectedEpisode,
  rows: SensorRow[],
  allDetections: Detection[],
): IncidentMilestone[] {
  if (episode.kind === "water") {
    const candidates: Array<IncidentMilestone | null> = [
      (() => {
        const detection = episode.detections.find((item) => item.level === "watch");
        return detection ? {
          id: "first-watch",
          label: "Listener watch",
          detail: detection.signals[0]?.label || "An early observation moved the system out of safe state.",
          timestamp: detection.timestamp,
          level: detection.level,
          source: "detector",
        } : null;
      })(),
      (() => {
        const detection = episode.detections.find((item) => item.level === "warning");
        return detection ? {
          id: "confirmed-warning",
          label: "Corroborated warning",
          detail: "Pressure and flow deterioration were corroborated by sound or vibration.",
          timestamp: detection.timestamp,
          level: detection.level,
          source: "detector",
        } : null;
      })(),
      (() => {
        const detection = episode.detections.find((item) => item.level === "critical");
        return detection ? {
          id: "critical-threshold",
          label: "Critical threshold",
          detail: "Pressure fell below 250 kPa while flow fell below 1.6 L/s.",
          timestamp: detection.timestamp,
          level: detection.level,
          source: "detector",
        } : null;
      })(),
      (() => {
        const detection = episode.detections.find((item) => item.level === "failed");
        if (!detection) return null;
        const recorded = rows.some((row) => row.timestamp.getTime() === detection.timestamp.getTime() && row.status === "failed");
        return {
          id: "failure-threshold",
          label: recorded ? "Recorded failure" : "Failure threshold",
          detail: recorded
            ? "The supplied evaluation label confirms failure; it was not used by the detector."
            : "Pressure and flow crossed the transparent failure thresholds.",
          timestamp: detection.timestamp,
          level: detection.level,
          source: recorded ? "evaluation" : "detector",
        };
      })(),
    ];
    return candidates.filter((item): item is IncidentMilestone => item !== null);
  }

  const firstWarning = episode.detections.find((item) => item.level === "warning");
  const worstEfficiency = episode.detections.reduce<Detection | null>((worst, item) => {
    if (item.airflowResidual === null) return worst;
    return !worst || worst.airflowResidual === null || item.airflowResidual < worst.airflowResidual ? item : worst;
  }, null);
  const resolved = allDetections.find((item) => item.timestamp > episode.end && item.level === "safe");
  const milestones: IncidentMilestone[] = [];
  if (firstWarning) milestones.push({
    id: "ventilation-warning",
    label: "Efficiency warning",
    detail: "Delivered airflow fell below the healthy power relationship with elevated vibration.",
    timestamp: firstWarning.timestamp,
    level: firstWarning.level,
    source: "detector",
  });
  if (worstEfficiency && worstEfficiency.timestamp.getTime() !== firstWarning?.timestamp.getTime()) milestones.push({
    id: "worst-efficiency",
    label: "Lowest efficiency",
    detail: `${worstEfficiency.airflowResidual?.toFixed(2)} m³/s below the expected delivery relationship.`,
    timestamp: worstEfficiency.timestamp,
    level: worstEfficiency.level,
    source: "detector",
  });
  if (resolved) milestones.push({
    id: "warning-cleared",
    label: "Warning cleared",
    detail: "Airflow and vibration returned inside the transparent warning boundary.",
    timestamp: resolved.timestamp,
    level: "safe",
    source: "detector",
  });
  return milestones;
}

export function backtestDetector(rows: SensorRow[], detections = runDetector(rows)) {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  rows.forEach((row, index) => {
    const predicted = detections[index].level !== "safe";
    const actual = row.status !== "stable";
    if (predicted && actual) truePositive += 1;
    if (predicted && !actual) falsePositive += 1;
    if (!predicted && actual) falseNegative += 1;
  });

  const failureLeadHours: number[] = [];
  const confirmedLeadHours: number[] = [];
  rows.forEach((row, index) => {
    if (row.status !== "failed" || rows[index - 1]?.status === "failed") return;
    let boundary = index - 1;
    while (boundary >= 0 && rows[boundary].status !== "stable") boundary -= 1;
    const episodeDetections = detections.slice(boundary + 1, index + 1);
    const firstWatch = episodeDetections.find((item) => item.level !== "safe");
    const firstConfirmed = episodeDetections.find((item) => LEVEL_RANK[item.level] >= LEVEL_RANK.warning);
    if (firstWatch) failureLeadHours.push((row.timestamp.getTime() - firstWatch.timestamp.getTime()) / 3_600_000);
    if (firstConfirmed) confirmedLeadHours.push((row.timestamp.getTime() - firstConfirmed.timestamp.getTime()) / 3_600_000);
  });

  const precision = truePositive / Math.max(truePositive + falsePositive, 1);
  const recall = truePositive / Math.max(truePositive + falseNegative, 1);
  return {
    truePositive,
    falsePositive,
    falseNegative,
    precision,
    recall,
    failureLeadHours,
    confirmedLeadHours,
    detectedFailureEvents: failureLeadHours.length,
  };
}

export function uniqueEvidence(detections: Detection[]) {
  const evidence = new Map<string, EvidenceSignal>();
  for (const detection of detections) {
    for (const signal of detection.signals) evidence.set(signal.id, signal);
  }
  return [...evidence.values()];
}
