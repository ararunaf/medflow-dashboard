import type { OperationalAlertSeverity } from "@/lib/operations/alerts/types";

const ORDER: Record<OperationalAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function compareSeverity(a: OperationalAlertSeverity, b: OperationalAlertSeverity): number {
  return ORDER[a] - ORDER[b];
}

export function maxSeverity(
  a: OperationalAlertSeverity,
  b: OperationalAlertSeverity,
): OperationalAlertSeverity {
  return compareSeverity(a, b) <= 0 ? a : b;
}
