import type { OperationalAlert, OperationalAlertRuleId, OperationalAlertSeverity } from "./types";

export function makeOperationalAlert(input: {
  id: OperationalAlertRuleId;
  severity: OperationalAlertSeverity;
  title: string;
  detail: string;
}): OperationalAlert {
  return {
    id: input.id,
    severity: input.severity,
    title: input.title,
    detail: input.detail,
  };
}
