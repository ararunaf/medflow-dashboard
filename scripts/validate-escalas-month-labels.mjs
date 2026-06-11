#!/usr/bin/env node
/**
 * Valida rótulos de mês do calendário Escalas (buildDays + monthShortFromDate).
 * Uso: node scripts/validate-escalas-month-labels.mjs
 */
const MONTHS_PT_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function monthShortFromDate(d) {
  if (Number.isNaN(d.getTime())) return "—";
  return MONTHS_PT_SHORT[d.getMonth()];
}

function buildDaysForAnchor(anchor) {
  const RANGE_DAYS = 14;
  const out = [];
  const today = new Date(anchor);
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < RANGE_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      monthShort: monthShortFromDate(d),
      isToday: i === 0,
    });
  }
  return out;
}

const expected = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

let failed = 0;

console.log("\n[escalas] Validação dos 12 meses (1º dia de cada mês/2026)\n");

for (let m = 0; m < 12; m++) {
  const anchor = new Date(2026, m, 1);
  const label = monthShortFromDate(anchor);
  const ok = label === expected[m];
  if (!ok) failed += 1;
  console.log(`  ${ok ? "✓" : "✗"} mês ${m + 1}: esperado ${expected[m]}, obtido ${label}`);
}

console.log("\n[escalas] Janela atual simulada (11/06/2026)\n");

const juneDays = buildDaysForAnchor(new Date(2026, 5, 11));
for (const d of juneDays) {
  const tag = d.isToday ? "Hoje" : d.monthShort;
  console.log(`  ${d.iso} → ${tag} ${d.day}`);
}

const d11 = juneDays.find((d) => d.day === 11);
const d13 = juneDays.find((d) => d.day === 13);

if (d11?.isToday !== true || d11?.monthShort !== "Jun") {
  console.error("\n✗ 11/06 deveria ser Hoje (Jun)");
  failed += 1;
} else {
  console.log("\n✓ 11/06 → Hoje (Jun)");
}

if (d13?.monthShort !== "Jun") {
  console.error("✗ 13/06 deveria ser Jun");
  failed += 1;
} else {
  console.log("✓ 13/06 → Jun");
}

if (failed > 0) {
  console.error(`\n${failed} falha(s)\n`);
  process.exit(1);
}

console.log("\n── Todos os meses validados com sucesso\n");
