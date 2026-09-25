#!/usr/bin/env node
/**
 * Gera os ativos do tenant de demonstração:
 *   - PNG de guias TISS preenchidas (consulta, SP/SADT, honorário individual)
 *     para enviar à Captura Inteligente;
 *   - PDF do contrato fictício da operadora Horizonte Saúde para a esteira
 *     RAG → propostas de regra contratual.
 *
 * Uso: node scripts/demo/generate-demo-assets.mjs
 * Saída: scripts/demo/assets/
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  DEMO_CAPTURE_GUIDES,
  DEMO_CONTRACT,
  DEMO_INSTITUTIONS,
  DEMO_PROCEDURES,
  operatorByKey,
  procedureByCode,
} from "./demo-dataset.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "assets");

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const TITLES = {
  consulta: "GUIA DE CONSULTA",
  sadt: "GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA - SP/SADT",
  honorario: "GUIA DE HONORÁRIO INDIVIDUAL",
};

/**
 * Campo em linha única "Rótulo: valor" — o parser TISS da Captura casa rótulo
 * e valor na mesma linha do OCR; com o rótulo acima do valor (layout do
 * formulário impresso) ele perde carteirinha, CNPJ, CID etc.
 */
function box(_n, label, value, flex = 1) {
  return `<div class="box" style="flex:${flex}"><span class="lbl">${esc(label)}:</span> <span class="val">${esc(value)}</span></div>`;
}

function guideHtml(g) {
  const op = operatorByKey(g.operator);
  const hospital = DEMO_INSTITUTIONS[g.type === "consulta" && g.operator === "vitalis" ? 2 : 0];
  const rows = g.items.map(([code, qty]) => {
    const p = procedureByCode(code);
    const unit = p ? p.value : 150;
    return { code, desc: p ? p.description : "Procedimento não identificado", qty, unit, total: unit * qty };
  });
  const total = rows.reduce((s, r) => s + r.total, 0);

  const requester = g.requester
    ? `<div class="section">Dados do Solicitante</div>
       <div class="row">${box(12, "Nome do Solicitante", g.requester.name, 3)}${box(13, "CRM Solicitante", g.requester.crm)}${box(14, "CBO", "225125")}</div>
       <div class="row">${box(15, "Indicação Clínica", g.indication, 3)}${box(16, "CID-10", g.cid)}</div>`
    : `<div class="row">${box(15, "Indicação Clínica", g.indication, 3)}${box(16, "CID-10", g.cid)}</div>`;

  const honorario = g.type === "honorario"
    ? `<div class="row">${box(17, "Guia de Origem", g.originGuide)}${box(18, "Grau de Participação", g.participation)}${box(19, "Tipo de Internação", "Obstétrica")}</div>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:22px;background:#fff;color:#111;width:1140px}
    .hdr{display:flex;align-items:center;justify-content:space-between;border:2px solid #222;padding:8px 12px}
    .hdr h1{font-size:17px;margin:0;max-width:760px}
    .ans{font-size:12px;text-align:right}
    .row{display:flex;gap:6px;margin-top:6px}
    .box{border:1px solid #444;padding:4px 6px;min-height:34px}
    .box{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .lbl{font-size:13px;color:#333}
    .val{font-size:15px;font-family:"Courier New",monospace;color:#0b2a6f}
    .section{background:#e6e6e6;border:1px solid #444;font-size:12px;font-weight:bold;padding:3px 6px;margin-top:10px}
    table{width:100%;border-collapse:collapse;margin-top:6px;font-size:13px}
    th,td{border:1px solid #444;padding:5px 6px;text-align:left}
    th{background:#f2f2f2;font-size:11px}
    td.num{text-align:right;font-family:"Courier New",monospace;color:#0b2a6f}
    td.code{font-family:"Courier New",monospace;color:#0b2a6f}
    .sign{display:flex;gap:40px;margin-top:26px;font-size:11px}
    .sign div{flex:1;border-top:1px solid #333;padding-top:4px;text-align:center}
    .stamp{font-family:"Brush Script MT",cursive;font-size:22px;color:#0b2a6f;text-align:center;height:26px}
  </style></head><body>
  <div class="hdr"><h1>${esc(TITLES[g.type])}</h1>
    <div class="ans">${esc(op.name)}<br><b>Registro ANS: ${op.ans}</b></div></div>
  <div class="row">${box(1, "Registro ANS", op.ans)}${box(2, "Número da Guia", g.guideNumber)}${box(3, "Senha", g.authorization ?? "")}${box(4, "Data do Atendimento", g.date)}</div>
  <div class="section">Dados do Beneficiário</div>
  <div class="row">${box(5, "Carteirinha", g.card, 2)}${box(6, "Validade da Carteira", "31/12/2027")}${box(7, "Atendimento a RN", "N")}</div>
  <div class="row">${box(8, "Nome do Beneficiário", g.patient, 3)}${box(9, "CNS", "")}</div>
  <div class="section">Dados do Contratado</div>
  <div class="row">${box(10, "Nome do Contratado", hospital.name, 3)}${box(11, "CNES", hospital.cnes)}${box("11a", "CNPJ Contratado", hospital.cnpj, 2)}</div>
  ${requester}
  ${honorario}
  <div class="section">Dados do Executante</div>
  <div class="row">${box(20, g.type === "consulta" ? "Nome do Profissional" : "Nome do Executante", g.executor.name, 3)}${box(21, "CRM Executante", g.executor.crm)}${box(22, "Data de Execução", g.date)}</div>
  <div class="section">Procedimentos Realizados</div>
  ${rows.map((r) => `<div class="row">${box("", "Código TUSS", r.code)}${`<div class="box" style="flex:3"><span class="val">${esc(r.desc)}</span></div>`}${box("", "Qtde", String(r.qty), 0.5)}${box("", "Valor", brl(r.total))}</div>`).join("")}
  <div class="row" style="justify-content:flex-end">${box(30, "Valor Total", brl(total))}</div>
  <div class="row">${box(31, "Observações", g.type === "honorario" ? "Procedimento realizado em caráter eletivo." : "", 1)}</div>
  <div class="sign"><div><div class="stamp">${esc(g.executor.name.replace(/^Dr[a]?\. /, ""))}</div>Assinatura do Profissional Executante</div>
  <div><div class="stamp">${esc(g.patient.split(" ")[0])}</div>Assinatura do Beneficiário ou Responsável</div></div>
  </body></html>`;
}

function contractHtml() {
  const op = operatorByKey(DEMO_CONTRACT.operator);
  const table = DEMO_PROCEDURES.map((p) => `<tr><td>${p.code}</td><td>${esc(p.description)}</td><td style="text-align:right">${brl(p.value)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Georgia,serif;font-size:12.5px;line-height:1.55;margin:48px 60px;color:#111}
    h1{font-size:18px;text-align:center;margin-bottom:4px} .sub{text-align:center;font-size:12px;margin-bottom:24px}
    h2{font-size:14px;margin-top:22px} table{border-collapse:collapse;width:100%;font-size:11.5px}
    td,th{border:1px solid #555;padding:4px 6px} th{background:#eee}
  </style></head><body>
  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS MÉDICO-HOSPITALARES Nº ${op.contract}</h1>
  <div class="sub">que entre si celebram ${esc(op.name)} (Registro ANS nº ${op.ans}) e a COOPERATIVA MEDICFLOW DEMONSTRAÇÃO — documento fictício para demonstração</div>

  <h2>CLÁUSULA PRIMEIRA — DO OBJETO</h2>
  <p>1.1. O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços médicos em consultas, exames complementares (SP/SADT), procedimentos cirúrgicos e obstétricos aos beneficiários da OPERADORA, nas unidades Hospital Santa Luzia (CNES 9912345), UPA 24h Jardim América (CNES 9923456) e Clínica Vida Plena (CNES 9934567).</p>
  <p>1.2. Os serviços serão faturados exclusivamente no padrão TISS vigente, versão 4.01.00, por meio de lotes eletrônicos.</p>

  <h2>CLÁUSULA SEGUNDA — DA COBERTURA</h2>
  <p>2.1. Estão cobertos os procedimentos constantes do Rol de Procedimentos e Eventos em Saúde da ANS e relacionados no Anexo I deste contrato.</p>
  <p>2.2. Não estão cobertos procedimentos estéticos, tratamentos experimentais e consultas domiciliares, salvo autorização expressa da OPERADORA.</p>
  <p>2.3. Consultas em pronto-socorro (código TUSS 10101039) são cobertas somente quando realizadas em unidade de urgência credenciada; consultas eletivas devem ser faturadas com o código 10101012.</p>

  <h2>CLÁUSULA TERCEIRA — DA AUTORIZAÇÃO PRÉVIA</h2>
  <p>3.1. Exigem autorização prévia (senha) da OPERADORA, sob pena de glosa integral: tomografia computadorizada (grupo TUSS 41001), endoscopia digestiva alta (40202038), colonoscopia (40202666) e todos os procedimentos cirúrgicos eletivos, incluindo cesariana eletiva (31309054).</p>
  <p>3.2. A senha de autorização deverá constar obrigatoriamente no campo próprio da guia SP/SADT ou de honorário. Guias sem senha para procedimentos listados no item 3.1 serão glosadas integralmente.</p>
  <p>3.3. Exames laboratoriais de rotina (grupo 40301 e 40302) e ECG (40101010) dispensam autorização prévia.</p>

  <h2>CLÁUSULA QUARTA — DOS PREÇOS E DA REMUNERAÇÃO</h2>
  <p>4.1. Os procedimentos serão remunerados conforme a Tabela de Valores do Anexo I, que prevalece sobre qualquer outra tabela de referência.</p>
  <p>4.2. A colonoscopia (40202666) será remunerada em no máximo 1 (uma) unidade por atendimento; quantidades superiores serão glosadas.</p>
  <p>4.3. Honorários de procedimentos cirúrgicos incluem a visita pós-operatória nas primeiras 24 horas, que não poderá ser faturada separadamente.</p>
  <p>4.4. Os valores serão reajustados anualmente pelo IPCA, na data de aniversário do contrato.</p>

  <h2>CLÁUSULA QUINTA — DOS PRAZOS</h2>
  <p>5.1. As guias deverão ser apresentadas à OPERADORA em até 60 (sessenta) dias contados da data do atendimento; guias apresentadas após este prazo serão glosadas por decurso de prazo.</p>
  <p>5.2. O pagamento será efetuado em até 30 (trinta) dias após o recebimento do lote sem pendências.</p>
  <p>5.3. A CONTRATADA poderá interpor recurso de glosa em até 30 (trinta) dias do recebimento do demonstrativo de análise de conta.</p>

  <h2>CLÁUSULA SEXTA — DOS CAMPOS OBRIGATÓRIOS</h2>
  <p>6.1. São de preenchimento obrigatório em todas as guias: número da carteirinha do beneficiário, nome do beneficiário, CRM e UF do profissional executante, código TUSS do procedimento e data do atendimento.</p>
  <p>6.2. Nas guias SP/SADT é obrigatório informar o CID-10 da indicação clínica e o CRM do profissional solicitante.</p>
  <p>6.3. Guias com número de carteirinha ausente ou inválido serão devolvidas sem análise.</p>

  <h2>CLÁUSULA SÉTIMA — DA VIGÊNCIA</h2>
  <p>7.1. Este contrato vigora de 01/01/2026 a 31/12/2026, renovando-se automaticamente por iguais períodos, salvo denúncia com 90 dias de antecedência.</p>

  <h2>ANEXO I — TABELA DE VALORES</h2>
  <table><thead><tr><th>Código TUSS</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>${table}</tbody></table>
  <p style="margin-top:30px">Campinas/SP, 02 de janeiro de 2026.</p>
  </body></html>`;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage({ viewport: { width: 1184, height: 900 }, deviceScaleFactor: 1.5 });

  for (const g of DEMO_CAPTURE_GUIDES) {
    await page.setContent(guideHtml(g), { waitUntil: "load" });
    await page.screenshot({ path: join(outDir, g.file), fullPage: true });
    console.log("guia:", g.file);
  }

  await page.setContent(contractHtml(), { waitUntil: "load" });
  await page.pdf({ path: join(outDir, DEMO_CONTRACT.file), format: "A4", printBackground: true });
  console.log("contrato:", DEMO_CONTRACT.file);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
