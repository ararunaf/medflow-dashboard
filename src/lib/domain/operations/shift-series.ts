/**
 * Série de plantões — expande "todo dia das HH:MM às HH:MM, de D1 a D2"
 * em intervalos concretos no fuso do navegador de quem monta a escala.
 *
 * Função pura (sem I/O) para ser testada isolada e reaproveitada na
 * prévia da tela e no envio ao servidor.
 */

export const SHIFT_SERIES_MAX = 93;

export type ShiftSeriesInput = {
  /** YYYY-MM-DD */
  firstDate: string;
  /** YYYY-MM-DD (inclusive) */
  lastDate: string;
  /** HH:MM */
  startTime: string;
  /** HH:MM — menor ou igual ao início significa que termina no dia seguinte. */
  endTime: string;
  /** 0 = domingo … 6 = sábado. Vazio ou ausente = todos os dias. */
  weekdays?: readonly number[];
};

export type ShiftSeriesItem = { startsAt: string; endsAt: string; date: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseLocalDate(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.getFullYear() === y && date.getMonth() === m! - 1 && date.getDate() === d
    ? date
    : null;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Lança `Error` com mensagem em português quando a entrada é inválida —
 * a tela mostra a mensagem como está.
 */
export function buildShiftSeries(input: ShiftSeriesInput): ShiftSeriesItem[] {
  const first = parseLocalDate(input.firstDate);
  const last = parseLocalDate(input.lastDate);
  if (!first) throw new Error("Data inicial inválida.");
  if (!last) throw new Error("Data final inválida.");
  if (last < first) throw new Error("A data final é anterior à inicial.");

  const start = TIME_RE.exec(input.startTime);
  const end = TIME_RE.exec(input.endTime);
  if (!start) throw new Error("Horário de início inválido (use HH:MM).");
  if (!end) throw new Error("Horário de término inválido (use HH:MM).");
  const startMin = Number(start[1]) * 60 + Number(start[2]);
  const endMin = Number(end[1]) * 60 + Number(end[2]);
  const overnight = endMin <= startMin;

  const weekdays = input.weekdays?.length ? new Set(input.weekdays) : null;
  const items: ShiftSeriesItem[] = [];

  for (const day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
    if (weekdays && !weekdays.has(day.getDay())) continue;
    const startsAt = new Date(day);
    startsAt.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    const endsAt = new Date(day);
    if (overnight) endsAt.setDate(endsAt.getDate() + 1);
    endsAt.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    items.push({
      date: formatLocalDate(day),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
    if (items.length > SHIFT_SERIES_MAX) {
      throw new Error(`No máximo ${SHIFT_SERIES_MAX} plantões por vez.`);
    }
  }

  if (items.length === 0) throw new Error("Nenhum dia do período bate com os dias escolhidos.");
  return items;
}
