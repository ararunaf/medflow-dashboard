/**
 * Montador de escala — expansão de série de plantões (buildShiftSeries).
 * Asserções usam os getters locais do Date, então valem em qualquer fuso.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SHIFT_SERIES_MAX, buildShiftSeries } from "@/lib/domain/operations/shift-series";

function local(iso: string) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

describe("buildShiftSeries", () => {
  it("gera um plantão diurno por dia, inclusive nas pontas", () => {
    const items = buildShiftSeries({
      firstDate: "2026-11-01",
      lastDate: "2026-11-30",
      startTime: "07:00",
      endTime: "19:00",
    });
    assert.equal(items.length, 30);
    assert.deepEqual(local(items[0]!.startsAt), { date: "2026-11-01", time: "07:00" });
    assert.deepEqual(local(items[0]!.endsAt), { date: "2026-11-01", time: "19:00" });
    assert.equal(items[29]!.date, "2026-11-30");
  });

  it("plantão noturno termina no dia seguinte", () => {
    const [item] = buildShiftSeries({
      firstDate: "2026-11-30",
      lastDate: "2026-11-30",
      startTime: "19:00",
      endTime: "07:00",
    });
    assert.deepEqual(local(item!.startsAt), { date: "2026-11-30", time: "19:00" });
    assert.deepEqual(local(item!.endsAt), { date: "2026-12-01", time: "07:00" });
  });

  it("início igual ao término vira plantão de 24 h", () => {
    const [item] = buildShiftSeries({
      firstDate: "2026-11-02",
      lastDate: "2026-11-02",
      startTime: "07:00",
      endTime: "07:00",
    });
    const hours = (Date.parse(item!.endsAt) - Date.parse(item!.startsAt)) / 3_600_000;
    assert.equal(hours, 24);
  });

  it("filtra pelos dias da semana escolhidos", () => {
    // 2026-11-02 é segunda-feira.
    const items = buildShiftSeries({
      firstDate: "2026-11-02",
      lastDate: "2026-11-15",
      startTime: "08:00",
      endTime: "12:00",
      weekdays: [6, 0],
    });
    assert.deepEqual(
      items.map((i) => i.date),
      ["2026-11-07", "2026-11-08", "2026-11-14", "2026-11-15"],
    );
  });

  it("recusa entradas inválidas com mensagem em português", () => {
    const base = {
      firstDate: "2026-11-01",
      lastDate: "2026-11-02",
      startTime: "07:00",
      endTime: "19:00",
    };
    assert.throws(() => buildShiftSeries({ ...base, firstDate: "2026-02-30" }), /Data inicial/);
    assert.throws(() => buildShiftSeries({ ...base, lastDate: "2026-10-01" }), /anterior/);
    assert.throws(() => buildShiftSeries({ ...base, startTime: "25:00" }), /início/);
    assert.throws(() => buildShiftSeries({ ...base, endTime: "7h" }), /término/);
    assert.throws(
      () =>
        buildShiftSeries({
          ...base,
          firstDate: "2026-11-02",
          lastDate: "2026-11-02",
          weekdays: [0],
        }),
      /Nenhum dia/,
    );
  });

  it(`limita a ${SHIFT_SERIES_MAX} plantões por envio`, () => {
    assert.throws(
      () =>
        buildShiftSeries({
          firstDate: "2026-01-01",
          lastDate: "2026-12-31",
          startTime: "07:00",
          endTime: "19:00",
        }),
      /No máximo/,
    );
  });
});
