/**
 * Confere as guias de layout oficial (generate-official-guides.mjs) contra
 * parser + auditoria preventiva, com o cadastro de profissionais do tenant de
 * demonstração — sem Azure: usa o OCR "perfeito" (*.ocr.json, textos com a
 * posição real na página). Valida a leitura do layout, não a qualidade do OCR.
 *
 * Uso: npx tsx scripts/demo/check-official-guides.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRawOcrResult } from "../../src/lib/capture/ocr/providers/shared.ts";
import type { OcrLine, OcrPage } from "../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { parseOcrToStructuredGuide } from "../../src/lib/capture/parser/index.ts";
import { auditStructuredGuide } from "../../src/lib/capture/audit/index.ts";
// @ts-expect-error — módulo .mjs sem tipos
import { DEMO_PROFESSIONALS } from "./demo-dataset.mjs";

type OcrJson = {
  guide: string;
  scenario: string;
  expect: { status: string; professional: string | null; findings: string[] };
  page: { width: number; height: number };
  lines: Array<{
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
};

const dir = join(dirname(fileURLToPath(import.meta.url)), "assets", "oficial");

const tenantProfessionals = (
  DEMO_PROFESSIONALS as Array<{ handle: string; fullName: string; crm: string; specialty: string }>
).map((p) => ({ id: p.handle, crm: p.crm, fullName: p.fullName, specialty: p.specialty }));

const FIELDS = process.env.ALL_FIELDS
  ? null
  : [
      "operator_ans_code",
      "guide_number",
      "beneficiary_card_number",
      "beneficiary_name",
      "executing_name",
      "executing_crm",
      "attendance_date",
      "procedure_code",
      "total_value",
    ];

async function main() {
  let failures = 0;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".ocr.json"))
    .sort();
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(dir, file), "utf8")) as OcrJson;
    const lines: OcrLine[] = data.lines.map((l) => ({
      text: l.text,
      confidence: 0.95,
      coordinates: { boundingBox: l.boundingBox },
      words: [],
    }));
    const page: OcrPage = {
      pageNumber: 1,
      width: data.page.width,
      height: data.page.height,
      unit: "pixel",
      lines,
      words: [],
      rawText: lines.map((l) => l.text).join("\n"),
    };
    const ocr = buildRawOcrResult({
      fullText: page.rawText,
      pages: [page],
      provider: "layout_simulado",
      providerVersion: "dom@v1",
      processingTimeMs: 0,
      metadata: { source: file },
    });
    const guide = parseOcrToStructuredGuide(ocr);
    const { report, findings } = await auditStructuredGuide(guide, { tenantProfessionals });
    const rec = report.executingProfessional!;
    const exeIds = findings
      .filter((f) => f.ruleId.startsWith("EXE"))
      .map((f) => f.ruleId)
      .sort();

    const problems: string[] = [];
    if (rec.status !== data.expect.status)
      problems.push(`status ${rec.status} (esperado ${data.expect.status})`);
    if (rec.professionalId !== data.expect.professional)
      problems.push(`profissional ${rec.professionalId} (esperado ${data.expect.professional})`);
    if (exeIds.join(",") !== [...data.expect.findings].sort().join(","))
      problems.push(`achados EXE [${exeIds}] (esperado [${data.expect.findings}])`);

    console.log(`\n${problems.length ? "✖" : "✔"} ${data.guide} — ${data.scenario}`);
    console.log(`  tipo: ${guide.guideType}`);
    for (const code of FIELDS ?? Object.keys(guide.fields)) {
      const f = guide.fields[code];
      console.log(
        `  ${code.padEnd(24)} ${String(f?.rawValue ?? "—").padEnd(28)} [${f?.status ?? "—"}]`,
      );
    }
    console.log(
      `  executante: ${rec.status}${rec.fullName ? ` → ${rec.fullName} (${rec.crm})` : ""}${rec.matchedBy ? ` por ${rec.matchedBy}` : ""}`,
    );
    console.log(
      `  auditoria: score ${report.score.overall}, achados ${findings.map((f) => f.ruleId).join(", ") || "nenhum"}`,
    );
    for (const p of problems) console.log(`  ✖ ${p}`);
    if (problems.length) failures++;
  }
  console.log(`\n${files.length - failures}/${files.length} cenários conforme o esperado.`);
  process.exitCode = failures ? 1 : 0;
}

void main();
