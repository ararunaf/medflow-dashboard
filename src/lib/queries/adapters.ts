/**
 * Adapters leves entre o domínio operacional e o design system da UI.
 *
 * Mantém o mapeamento (status do banco → label de badge, formatação de
 * datas/horários, intervalo legível) em um único arquivo para que as
 * rotas continuem livres de regra de apresentação.
 */
import type { AssignmentStatus, ShiftStatus, SwapRequestStatus } from "@/lib/database.types";

export type UiBadgeStatus = "confirmado" | "disponivel" | "pendente" | "trocar" | "cancelado";

/** Plantão (shift) sem atribuição confirmada vs. com confirmação. */
export function shiftStatusToBadge(
  shiftStatus: ShiftStatus,
  hasConfirmedAssignment = false,
): UiBadgeStatus {
  if (shiftStatus === "cancelled") return "cancelado";
  if (shiftStatus === "completed") return "confirmado";
  if (shiftStatus === "assigned" || hasConfirmedAssignment) return "confirmado";
  if (shiftStatus === "open") return "disponivel";
  return "pendente";
}

export function assignmentStatusToBadge(status: AssignmentStatus): UiBadgeStatus {
  switch (status) {
    case "confirmed":
      return "confirmado";
    case "rejected":
      return "cancelado";
    case "pending":
    default:
      return "pendente";
  }
}

export function swapStatusToBadge(status: SwapRequestStatus): UiBadgeStatus {
  switch (status) {
    case "approved":
      return "confirmado";
    case "denied":
    case "cancelled":
      return "cancelado";
    case "pending":
    default:
      return "trocar";
  }
}

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const MONTHS_PT_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())} ${MONTHS_PT_SHORT[d.getMonth()]}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatTimeRange(startISO: string, endISO: string): string {
  return `${formatTime(startISO)} — ${formatTime(endISO)}`;
}

export function formatWeekdayShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return WEEKDAYS_PT[d.getDay()];
}

export function getWeekdayLabel(weekday: number): string {
  if (weekday < 0 || weekday > 6) return "—";
  const labels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return labels[weekday] ?? "—";
}

export function initialsFromName(fullName: string, fallback = "MF"): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return fallback;
}
