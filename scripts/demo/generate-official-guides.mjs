#!/usr/bin/env node
/**
 * Guias de consulta no LAYOUT OFICIAL TISS (caixas numeradas, rótulo acima do
 * valor, Conselho / Número no Conselho / UF em caixas separadas), com dados
 * fictícios e profissionais do tenant de demonstração.
 *
 * Para cada cenário gera:
 *   - <nome>.png        — guia "escaneada" (limpa)
 *   - <nome>.foto.jpg   — mesma guia simulando foto de celular (inclinada, sombra, JPEG)
 *   - <nome>.ocr.json   — textos com posição real na página (OCR "perfeito"),
 *                          usado por check-official-guides.ts para validar
 *                          parser + auditoria sem depender do Azure.
 *
 * Uso: node scripts/demo/generate-official-guides.mjs
 * Saída: scripts/demo/assets/oficial/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { DEMO_INSTITUTIONS, operatorByKey, procedureByCode } from "./demo-dataset.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "assets", "oficial");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/** expect: o que a auditoria deve concluir sobre o executante (conferido no check). */
export const OFFICIAL_GUIDES = [
  {
    name: "A-consulta-cadastrado-crm",
    scenario: "Executante cadastrado, conselho escrito como CRM",
    operator: "vitalis",
    patient: "ROBERTO NUNES FARIAS",
    card: "0398765112000457",
    cns: "898001234567801",
    date: "10/09/2026",
    guideNumber: "2026091003",
    executor: {
      name: "Dr. Felipe Andrade",
      council: "CRM",
      number: "678901",
      uf: "SP",
      cbo: "225120",
    },
    procedure: "10101012",
    value: "100,00",
    expect: { status: "recognized", professional: "felipe.andrade", findings: [] },
  },
  {
    name: "B-consulta-cadastrado-codigo-06",
    scenario: "Executante cadastrado, conselho pelo código ANS (06)",
    operator: "horizonte",
    patient: "BEATRIZ GOMES CARDOSO",
    card: "0412345008722310",
    cns: "898001234567802",
    date: "11/09/2026",
    guideNumber: "2026091104",
    executor: {
      name: "Dra. Camila Rocha",
      council: "06",
      number: "345678",
      uf: "SP",
      cbo: "225124",
    },
    procedure: "10101012",
    value: "100,00",
    expect: { status: "recognized", professional: "camila.rocha", findings: [] },
  },
  {
    name: "C-consulta-crm-nao-cadastrado",
    scenario: "CRM que não existe no cadastro da instituição",
    operator: "vitalis",
    patient: "HELENA DUARTE MOREIRA",
    card: "0398765112000999",
    cns: "898001234567803",
    date: "12/09/2026",
    guideNumber: "2026091205",
    executor: {
      name: "Dr. Rodrigo Menezes",
      council: "CRM",
      number: "765432",
      uf: "SP",
      cbo: "225125",
    },
    procedure: "10101012",
    value: "100,00",
    expect: { status: "not_registered", professional: null, findings: ["EXE-004"] },
  },
  {
    name: "D-consulta-crm-de-outro-medico",
    scenario: "Nome de um médico com o CRM de outro",
    operator: "horizonte",
    patient: "PATRICIA SOUZA LEMOS",
    card: "0412345008722399",
    cns: "898001234567804",
    date: "13/09/2026",
    guideNumber: "2026091306",
    executor: {
      name: "Dr. Lucas Ferraz",
      council: "CRM",
      number: "445566",
      uf: "SP",
      cbo: "225125",
    },
    procedure: "10101012",
    value: "100,00",
    expect: { status: "recognized", professional: "nicolas.barros", findings: ["EXE-005"] },
  },
  {
    name: "E-consulta-sem-crm",
    scenario: "CRM em branco — só o nome do executante",
    operator: "vitalis",
    patient: "SERGIO ALMEIDA PRADO",
    card: "0398765112000321",
    cns: "898001234567805",
    date: "14/09/2026",
    guideNumber: "2026091407",
    executor: { name: "Dra. Gabriela Pires", council: "CRM", number: "", uf: "SP", cbo: "225125" },
    procedure: "10101012",
    value: "100,00",
    expect: {
      status: "recognized",
      professional: "gabriela.pires",
      findings: ["EXE-001", "EXE-006"],
    },
  },
];

/** Caixa do formulário: rótulo numerado em cima, valor embaixo. */
function box(n, label, value, flex = 1) {
  return `<div class="box" style="flex:${flex}"><div class="lbl" data-ocr>${esc(`${n} - ${label}`)}</div><div class="val" data-ocr>${esc(value)}</div></div>`;
}

function guideHtml(g) {
  const op = operatorByKey(g.operator);
  const clinic = DEMO_INSTITUTIONS[2];
  const proc = procedureByCode(g.procedure);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;background:#fff;color:#111;width:1136px}
    .hdr{display:flex;align-items:center;justify-content:space-between;border:2px solid #222;padding:8px 12px}
    .hdr h1{font-size:18px;margin:0}
    .op{font-size:13px;text-align:right}
    .row{display:flex;gap:6px;margin-top:6px}
    .box{border:1px solid #444;padding:3px 6px 5px;min-height:44px;display:flex;flex-direction:column;justify-content:space-between}
    .lbl{font-size:10.5px;color:#333;display:inline-block;align-self:flex-start}
    .val{font-size:16px;font-family:"Courier New",monospace;color:#0b2a6f;min-height:19px;display:inline-block;align-self:flex-start}
    .section{background:#e6e6e6;border:1px solid #444;font-size:11px;font-weight:bold;padding:3px 6px;margin-top:10px}
    .sign{display:flex;gap:40px;margin-top:30px;font-size:11px}
    .sign > div{flex:1;border-top:1px solid #333;padding-top:4px;text-align:center}
    .stamp{font-family:"Segoe Script","Brush Script MT",cursive;font-size:20px;color:#0b2a6f;height:28px}
    .foot{font-size:9px;color:#666;margin-top:14px}
  </style></head><body>
  <div class="hdr"><h1 data-ocr>GUIA DE CONSULTA</h1><div class="op" data-ocr>${esc(op.name)}</div></div>
  <div class="row">${box(1, "Registro ANS", op.ans)}${box(2, "Nº Guia no Prestador", g.guideNumber)}${box(3, "Número da Guia Atribuído pela Operadora", "", 2)}</div>
  <div class="section">Dados do Beneficiário</div>
  <div class="row">${box(4, "Número da Carteira", g.card, 2)}${box(5, "Validade da Carteira", "31/12/2027")}${box(6, "Atendimento a RN", "N")}</div>
  <div class="row">${box(7, "Nome", g.patient, 3)}${box(8, "Cartão Nacional de Saúde", g.cns, 2)}</div>
  <div class="section">Dados do Contratado</div>
  <div class="row">${box(9, "Código na Operadora", "0045123")}${box(10, "Nome do Contratado", clinic.name.toUpperCase(), 3)}${box(11, "Código CNES", clinic.cnes)}</div>
  <div class="row">${box(12, "Nome do Profissional Executante", g.executor.name.toUpperCase(), 3)}${box(13, "Conselho Profissional", g.executor.council, 0.8)}${box(14, "Número no Conselho", g.executor.number)}${box(15, "UF", g.executor.uf, 0.5)}${box(16, "Código CBO", g.executor.cbo, 0.8)}</div>
  <div class="section">Dados do Atendimento / Procedimento Realizado</div>
  <div class="row">${box(17, "Indicação de Acidente", "9", 0.9)}${box(18, "Data do Atendimento", g.date)}${box(19, "Tipo de Consulta", "1", 0.8)}${box(20, "Tabela", "22", 0.6)}${box(21, "Código do Procedimento", g.procedure)}${box(22, "Valor do Procedimento", g.value)}</div>
  <div class="row">${box(23, "Observação / Justificativa", proc ? proc.description : "", 1)}</div>
  <div class="sign"><div><div class="stamp">${esc(g.executor.name.replace(/^Dr[a]?\. /, ""))}</div>24 - Assinatura do Profissional Executante</div>
  <div><div class="stamp">${esc(g.patient.split(" ")[0].toLowerCase())}</div>25 - Assinatura do Beneficiário ou Responsável</div></div>
  <div class="foot">Documento fictício gerado para teste — MedFlow. Dados de paciente inventados.</div>
  </body></html>`;
}

/** Foto de celular: margem de mesa, leve rotação, sombra num canto, desfoque e JPEG. */
async function toPhoto(pngPath, jpgPath) {
  const img = sharp(pngPath);
  const { width, height } = await img.metadata();
  const pad = Math.round(width * 0.06);
  const W = width + pad * 2;
  const H = height + pad * 2;
  const shadow = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.85" cy="0.9" r="0.75">
      <stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const framed = await sharp(pngPath)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#7a6a58" })
    .composite([{ input: shadow, blend: "multiply" }])
    .toBuffer();
  await sharp(framed)
    .rotate(-2.6, { background: "#6b5d4d" })
    .modulate({ brightness: 0.93, saturation: 0.9 })
    .tint({ r: 255, g: 246, b: 228 })
    .blur(0.7)
    .resize({ width: 2000 })
    .jpeg({ quality: 72 })
    .toFile(jpgPath);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({
    viewport: { width: 1184, height: 900 },
    deviceScaleFactor: 1.5,
  });
  for (const g of OFFICIAL_GUIDES) {
    await page.setContent(guideHtml(g), { waitUntil: "load" });
    const png = join(outDir, `${g.name}.png`);
    await page.screenshot({ path: png, fullPage: true });
    const size = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));
    const lines = await page.$$eval("[data-ocr]", (els) =>
      els
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            text: (el.textContent ?? "").trim(),
            boundingBox: { x: r.x, y: r.y, width: r.width, height: r.height },
          };
        })
        .filter((l) => l.text),
    );
    writeFileSync(
      join(outDir, `${g.name}.ocr.json`),
      JSON.stringify(
        { guide: g.name, scenario: g.scenario, expect: g.expect, page: size, lines },
        null,
        2,
      ),
    );
    await toPhoto(png, join(outDir, `${g.name}.foto.jpg`));
    console.log("guia:", g.name);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
