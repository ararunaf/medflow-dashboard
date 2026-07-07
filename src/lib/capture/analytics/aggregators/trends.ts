/**
 * Séries temporais analíticas — MEDICFLOW-ANALYTICS-01.
 */
import type { AnalyticsSessionRecord, AnalyticsTrends, TrendPoint } from "../types";

const DEFAULT_TREND_DAYS = 28;

function utcDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "invalid";
  return d.toISOString().slice(0, 10);
}

function dayKeysBetween(endDayKey: string, days: number): string[] {
  const keys: string[] = [];
  const end = new Date(`${endDayKey}T12:00:00.000Z`);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function initSeries(dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const k of dayKeys) map.set(k, 0);
  return map;
}

function toTrendPoints(map: Map<string, number>, dayKeys: string[]): TrendPoint[] {
  return dayKeys.map((dayKey) => ({ dayKey, value: map.get(dayKey) ?? 0 }));
}

function estimateDailyGlosasAvoided(r: AnalyticsSessionRecord): number {
  const resolved = r.correctionAccepted + r.correctionEdited;
  if (resolved <= 0 || r.correctionTotal <= 0 || r.estimatedFinancialImpact <= 0) return 0;
  return Math.round(r.estimatedFinancialImpact * (resolved / r.correctionTotal) * 100) / 100;
}

export function buildAnalyticsTrends(
  records: AnalyticsSessionRecord[],
  trendDays = DEFAULT_TREND_DAYS,
  asOf = new Date(),
): AnalyticsTrends {
  const endDay = utcDayKey(asOf.toISOString());
  const dayKeys = dayKeysBetween(endDay, trendDays);

  const volume = initSeries(dayKeys);
  const risk = initSeries(dayKeys);
  const corrections = initSeries(dayKeys);
  const estimatedGlosasAvoided = initSeries(dayKeys);
  const productivity = initSeries(dayKeys);

  const riskCounts = new Map<string, number>();

  for (const r of records) {
    const day = utcDayKey(r.createdAt);
    if (!volume.has(day)) continue;

    volume.set(day, (volume.get(day) ?? 0) + 1);

    if (r.riskScore != null) {
      riskCounts.set(day, (riskCounts.get(day) ?? 0) + 1);
      risk.set(day, (risk.get(day) ?? 0) + r.riskScore);
    }

    const corrCount = r.correctionAccepted + r.correctionEdited + r.correctionRejected;
    corrections.set(day, (corrections.get(day) ?? 0) + corrCount);
    estimatedGlosasAvoided.set(
      day,
      (estimatedGlosasAvoided.get(day) ?? 0) + estimateDailyGlosasAvoided(r),
    );

    if (r.approvalStatus === "aprovada" || r.queue === "aprovadas") {
      const approvalDay = utcDayKey(r.updatedAt);
      if (productivity.has(approvalDay)) {
        productivity.set(approvalDay, (productivity.get(approvalDay) ?? 0) + 1);
      }
    }
  }

  const riskAvg = initSeries(dayKeys);
  for (const day of dayKeys) {
    const count = riskCounts.get(day) ?? 0;
    const sum = risk.get(day) ?? 0;
    riskAvg.set(day, count > 0 ? Math.round((sum / count) * 10) / 10 : 0);
  }

  return {
    volume: toTrendPoints(volume, dayKeys),
    risk: toTrendPoints(riskAvg, dayKeys),
    corrections: toTrendPoints(corrections, dayKeys),
    estimatedGlosasAvoided: toTrendPoints(estimatedGlosasAvoided, dayKeys),
    productivity: toTrendPoints(productivity, dayKeys),
  };
}
