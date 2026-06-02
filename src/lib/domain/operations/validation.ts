/**
 * Validadores puros do domínio operacional. Não fazem IO, apenas inspecionam
 * payloads e devolvem entidades normalizadas. Lançam `ValidationError`
 * imediatamente quando alguma invariante de domínio é violada.
 */
import { ValidationError } from "./errors";
import type {
  AssignmentStatus,
  ScheduleStatus,
  ShiftStatus,
  SwapRequestStatus,
  Weekday0To6,
} from "./enums";
import type {
  OperationalMemoryState,
  OperationalRecommendationFeedbackType,
  OperationalStrategicPlanningLifecycleState,
  SupervisedPolicyLifecycleState,
} from "@/lib/database.types";
import {
  ADAPTIVE_PRIORITY_STATES,
  ADAPTIVE_SUBJECT_KINDS,
  type AdaptivePriorityState,
  type AdaptivePrioritySubjectKind,
} from "@/lib/operations/adaptive-prioritization/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECOMMENDATION_ID_PATTERN = /^rec:[^:]+:.+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function assert(
  condition: unknown,
  message: string,
  details?: Record<string, unknown>,
): asserts condition {
  if (!condition) {
    throw new ValidationError(
      message,
      details
        ? (Object.fromEntries(
            Object.entries(details).map(([k, v]) => [k, v === undefined ? null : (v as never)]),
          ) as never)
        : undefined,
    );
  }
}

export function expectUuid(value: unknown, field: string): string {
  assert(typeof value === "string" && UUID_PATTERN.test(value), `Campo ${field} inválido (uuid).`, {
    field,
  });
  return value as string;
}

export function expectNonEmptyString(value: unknown, field: string, max = 255): string {
  assert(typeof value === "string", `Campo ${field} deve ser texto.`, { field });
  const trimmed = (value as string).trim();
  assert(trimmed.length > 0, `Campo ${field} é obrigatório.`, { field });
  assert(trimmed.length <= max, `Campo ${field} excede ${max} caracteres.`, { field, max });
  return trimmed;
}

export function expectOptionalString(value: unknown, field: string, max = 255): string {
  if (value == null) return "";
  assert(typeof value === "string", `Campo ${field} deve ser texto.`, { field });
  const trimmed = (value as string).trim();
  assert(trimmed.length <= max, `Campo ${field} excede ${max} caracteres.`, { field, max });
  return trimmed;
}

export function expectDateISO(value: unknown, field: string): string {
  assert(
    typeof value === "string" && DATE_PATTERN.test(value),
    `Campo ${field} deve ser YYYY-MM-DD.`,
    {
      field,
    },
  );
  const d = new Date(`${value}T00:00:00Z`);
  assert(!Number.isNaN(d.getTime()), `Campo ${field} é uma data inválida.`, { field });
  return value as string;
}

export function expectTimestamp(value: unknown, field: string): string {
  assert(typeof value === "string", `Campo ${field} deve ser um ISO timestamp.`, { field });
  const d = new Date(value as string);
  assert(!Number.isNaN(d.getTime()), `Campo ${field} é um timestamp inválido.`, { field });
  return d.toISOString();
}

export function expectTimeOfDay(value: unknown, field: string): string {
  assert(
    typeof value === "string" && TIME_PATTERN.test(value),
    `Campo ${field} deve ser HH:MM[:SS].`,
    {
      field,
    },
  );
  return value as string;
}

export function expectWeekday(value: unknown, field: string): Weekday0To6 {
  assert(
    typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6,
    `Campo ${field} deve ser inteiro 0..6 (dow).`,
    { field },
  );
  return value as Weekday0To6;
}

export function expectScheduleStatus(value: unknown, field: string): ScheduleStatus {
  const allowed: ScheduleStatus[] = ["draft", "active", "archived"];
  assert(
    typeof value === "string" && allowed.includes(value as ScheduleStatus),
    `Campo ${field} fora dos valores permitidos.`,
    { field },
  );
  return value as ScheduleStatus;
}

export function expectShiftStatus(value: unknown, field: string): ShiftStatus {
  const allowed: ShiftStatus[] = ["open", "assigned", "completed", "cancelled"];
  assert(
    typeof value === "string" && allowed.includes(value as ShiftStatus),
    `Campo ${field} fora dos valores permitidos.`,
    { field },
  );
  return value as ShiftStatus;
}

export function expectAssignmentStatus(value: unknown, field: string): AssignmentStatus {
  const allowed: AssignmentStatus[] = ["pending", "confirmed", "rejected"];
  assert(
    typeof value === "string" && allowed.includes(value as AssignmentStatus),
    `Campo ${field} fora dos valores permitidos.`,
    { field },
  );
  return value as AssignmentStatus;
}

export function expectSwapRequestStatus(value: unknown, field: string): SwapRequestStatus {
  const allowed: SwapRequestStatus[] = ["pending", "approved", "denied", "cancelled"];
  assert(
    typeof value === "string" && allowed.includes(value as SwapRequestStatus),
    `Campo ${field} fora dos valores permitidos.`,
    { field },
  );
  return value as SwapRequestStatus;
}

export function expectInterval(startsAt: string, endsAt: string, field: string): void {
  const a = new Date(startsAt).getTime();
  const b = new Date(endsAt).getTime();
  assert(b > a, `Campo ${field}: término deve ser maior que início.`, { field });
}

export function expectDateRange(startDate: string, endDate: string, field: string): void {
  assert(endDate >= startDate, `Campo ${field}: data final deve ser ≥ inicial.`, { field });
}

export function expectFutureTimestamp(value: string, field: string, nowMs = Date.now()): void {
  const t = new Date(value).getTime();
  assert(t > nowMs, `Campo ${field}: deve estar no futuro.`, { field });
}

export function expectOperationalRecommendationId(value: unknown, field: string): string {
  assert(
    typeof value === "string" && RECOMMENDATION_ID_PATTERN.test(value),
    `Campo ${field} inválido (recommendation_id).`,
    { field },
  );
  return value as string;
}

const FEEDBACK_TYPES: readonly OperationalRecommendationFeedbackType[] = [
  "accepted",
  "dismissed",
  "ignored",
  "executed",
  "execution_failed",
];

export function expectOperationalRecommendationFeedbackType(
  value: unknown,
  field: string,
): OperationalRecommendationFeedbackType {
  assert(
    typeof value === "string" && (FEEDBACK_TYPES as readonly string[]).includes(value),
    `Campo ${field} inválido (feedback_type).`,
    { field },
  );
  return value as OperationalRecommendationFeedbackType;
}

const OPERATIONAL_MEMORY_STATES: readonly OperationalMemoryState[] = [
  "observed",
  "tracked",
  "validated",
  "archived",
];

export function expectOperationalMemoryState(
  value: unknown,
  field: string,
): OperationalMemoryState {
  assert(
    typeof value === "string" && (OPERATIONAL_MEMORY_STATES as readonly string[]).includes(value),
    `Campo ${field} inválido (memory_state).`,
    { field },
  );
  return value as OperationalMemoryState;
}

export function expectOptionalEffectivenessScore(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  assert(typeof value === "number" && Number.isFinite(value), `Campo ${field} deve ser numérico.`, {
    field,
  });
  assert(value >= 0 && value <= 1, `Campo ${field} deve estar entre 0 e 1.`, { field });
  return value;
}

const ADAPTIVE_ADJUSTMENT_ID_PATTERN = /^(adapt:)?[a-z]+:[A-Za-z0-9:_\-.]+$/;

export function expectAdaptiveAdjustmentId(value: unknown, field: string): string {
  assert(
    typeof value === "string" && ADAPTIVE_ADJUSTMENT_ID_PATTERN.test(value as string),
    `Campo ${field} inválido (adjustment_id).`,
    { field },
  );
  return value as string;
}

export function expectAdaptivePriorityState(value: unknown, field: string): AdaptivePriorityState {
  assert(
    typeof value === "string" && (ADAPTIVE_PRIORITY_STATES as readonly string[]).includes(value),
    `Campo ${field} fora dos estados adaptativos suportados.`,
    { field },
  );
  return value as AdaptivePriorityState;
}

export function expectAdaptivePrioritySubjectKind(
  value: unknown,
  field: string,
): AdaptivePrioritySubjectKind {
  assert(
    typeof value === "string" && (ADAPTIVE_SUBJECT_KINDS as readonly string[]).includes(value),
    `Campo ${field} fora dos subject kinds adaptativos.`,
    { field },
  );
  return value as AdaptivePrioritySubjectKind;
}

export const SUPERVISED_POLICY_LIFECYCLE_STATES: readonly SupervisedPolicyLifecycleState[] = [
  "observed",
  "analyzed",
  "recommended",
  "supervised_review",
  "validated",
] as const;

export function expectSupervisedPolicyLifecycleState(
  value: unknown,
  field: string,
): SupervisedPolicyLifecycleState {
  assert(
    typeof value === "string" &&
      (SUPERVISED_POLICY_LIFECYCLE_STATES as readonly string[]).includes(value),
    `Campo ${field} inválido (supervised policy lifecycle).`,
    { field },
  );
  return value as SupervisedPolicyLifecycleState;
}

const STRATEGIC_PLANNING_PATCH_STATES = ["supervised_review", "validated"] as const;

export function expectStrategicPlanningPatchLifecycleState(
  value: unknown,
  field: string,
): Extract<OperationalStrategicPlanningLifecycleState, "supervised_review" | "validated"> {
  assert(
    typeof value === "string" &&
      (STRATEGIC_PLANNING_PATCH_STATES as readonly string[]).includes(value),
    `Campo ${field} inválido (estado de patch de planejamento estratégico).`,
    { field },
  );
  return value as Extract<
    OperationalStrategicPlanningLifecycleState,
    "supervised_review" | "validated"
  >;
}
