/**
 * Verificações campo a campo derivadas de cláusulas aprovadas (F2-S4).
 *
 * A auditoria preventiva genérica não conhece parâmetros de contrato (prazo
 * de apresentação da operadora X, campo que só a operadora Y exige). Este
 * motor determinístico lê a citação LITERAL de cada regra ai_approved e gera
 * AuditFindings (source="contract") para o que a auditoria genérica não
 * cobre — o Field Audit Agent continua sem criar achado: só sintetiza estes.
 *
 * Cobertura atual:
 *   - prazo: "em até N dias … data do atendimento" → dias decorridos desde o
 *     atendimento (vencido = crítico/bloqueante; faltando ≤ 5 dias = atenção);
 *   - campo_obrigatorio: campo exigido pela cláusula e vazio na guia, quando
 *     a auditoria genérica não o apontou.
 * Preço (tabela do anexo) e cobertura por código ainda não são verificados
 * aqui — dependem de dados estruturados que a extração não produz.
 */
import { buildAuditContext, fieldConfidence } from "../../audit/engine/audit-context";
import type { AuditFinding } from "../../audit/types/audit-finding";
import type { AuditRuleCategory } from "../../audit/types/audit-rule";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import type { ContractRule } from "../types/contract-rule";

const DAY_MS = 86_400_000;
export const PRAZO_WARNING_DAYS = 5;

/** Campos que o parser TISS extrai como texto — só estes podem ser checados como "vazios". */
const PARSED_FIELDS = new Set([
  "attendance_date", "authorization_password", "beneficiary_card_number", "beneficiary_cpf",
  "beneficiary_name", "cid_code", "clinical_indication", "executing_crm", "executing_name",
  "execution_date", "guide_number", "operator_ans_code", "procedure_code", "provider_cnpj",
  "requesting_crm", "requesting_name", "total_value",
]);

const FIELD_CATEGORY: Record<string, AuditRuleCategory> = {
  attendance_date: "datas",
  execution_date: "datas",
  authorization_password: "autorizacoes",
  guide_number: "autorizacoes",
  beneficiary_card_number: "paciente",
  beneficiary_cpf: "paciente",
  beneficiary_name: "paciente",
  cid_code: "diagnostico",
  clinical_indication: "diagnostico",
  requesting_crm: "solicitante",
  requesting_name: "solicitante",
  executing_crm: "executante",
  executing_name: "executante",
  procedure_code: "procedimentos",
  total_value: "procedimentos",
  provider_cnpj: "prestador",
  operator_ans_code: "operadora",
};

const FIELD_LABEL: Record<string, string> = {
  attendance_date: "Data do atendimento",
  execution_date: "Data de execução",
  authorization_password: "Senha de autorização",
  guide_number: "Número da guia",
  beneficiary_card_number: "Carteirinha do beneficiário",
  beneficiary_cpf: "CPF do beneficiário",
  beneficiary_name: "Nome do beneficiário",
  cid_code: "CID-10",
  clinical_indication: "Indicação clínica",
  requesting_crm: "CRM do solicitante",
  requesting_name: "Nome do solicitante",
  executing_crm: "CRM do executante",
  executing_name: "Nome do executante",
  procedure_code: "Código TUSS",
  total_value: "Valor total",
  provider_cnpj: "CNPJ do contratado",
  operator_ans_code: "Registro ANS",
};

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function shortId(ruleId: string): string {
  return ruleId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function clauseRef(rule: ContractRule): string {
  return rule.businessReference || rule.contract;
}

/** "em até 30 (trinta) dias corridos contados da data do atendimento" → 30. Dias úteis não são aproximados. */
export function parseAttendanceDeadlineDays(citation: string): number | null {
  const m = normalizeText(citation).match(
    /em ate (\d+)\s*(?:\([^)]*\)\s*)?dias(\s+uteis)?[^.]*?data do atendimento/,
  );
  if (!m || m[2]) return null;
  const days = Number(m[1]);
  return Number.isFinite(days) && days > 0 ? days : null;
}

/** Cláusula que cita só SP/SADT (e não "todas as guias") vale só para guia_sadt. */
function appliesToGuide(rule: ContractRule, guide: StructuredGuide): boolean {
  const text = normalizeText(`${rule.citationExcerpt ?? ""} ${rule.description}`);
  if (/sp\/sadt/.test(text) && !/todas as guias/.test(text)) {
    return guide.guideType === "guia_sadt";
  }
  return true;
}

function parseIsoDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

function daysSince(date: Date, now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - date.getTime()) / DAY_MS);
}

export function evaluateContractFieldChecks(
  guide: StructuredGuide,
  rules: readonly ContractRule[],
  existingFindings: readonly AuditFinding[],
  now: Date = new Date(),
): AuditFinding[] {
  const ctx = buildAuditContext(guide);
  const out: AuditFinding[] = [];
  const flagged = new Set(existingFindings.map((f) => f.field));

  for (const rule of rules) {
    if (rule.origin !== "ai_approved" || !rule.citationExcerpt) continue;
    if (!appliesToGuide(rule, guide)) continue;

    const deadline = parseAttendanceDeadlineDays(rule.citationExcerpt);
    if (deadline != null) {
      const raw = ctx.getValue("attendance_date");
      const date = raw ? parseIsoDate(raw) : null;
      if (date) {
        const elapsed = daysSince(date, now);
        const remaining = deadline - elapsed;
        if (remaining < 0 || remaining <= PRAZO_WARNING_DAYS) {
          const expired = remaining < 0;
          out.push({
            ruleId: `CTR-PRZ-${shortId(rule.ruleId)}`,
            category: "datas",
            field: "attendance_date",
            severity: expired ? "critico" : "medio",
            status: "open",
            message: expired
              ? `Prazo contratual de apresentação vencido: ${elapsed} dias desde o atendimento, limite de ${deadline} dias (${clauseRef(rule)}).`
              : `Prazo contratual de apresentação vence em ${remaining} dia(s): ${elapsed} de ${deadline} dias desde o atendimento (${clauseRef(rule)}).`,
            detectedValue: raw,
            expectedValue: `Apresentação em até ${deadline} dias após o atendimento`,
            confidence: fieldConfidence(ctx, "attendance_date"),
            suggestedCorrection: expired
              ? "Guia sujeita a glosa por decurso de prazo. Avalie negociação com a operadora antes de enviar."
              : "Priorize o envio desta guia no próximo lote.",
            blocking: expired,
            source: "contract",
          });
        }
      }
    }

    for (const field of rule.auditFields ?? []) {
      if (!PARSED_FIELDS.has(field) || flagged.has(field)) continue;
      if (!/obrigat/i.test(normalizeText(`${rule.citationExcerpt} ${rule.description}`))) continue;
      if (!ctx.isMissing(field)) continue;
      flagged.add(field);
      out.push({
        ruleId: `CTR-OBR-${shortId(rule.ruleId)}`,
        category: FIELD_CATEGORY[field] ?? "operadora",
        field,
        severity: "alto",
        status: "open",
        message: `${FIELD_LABEL[field] ?? field} não preenchido — obrigatório pelo contrato (${clauseRef(rule)}).`,
        detectedValue: null,
        expectedValue: `${FIELD_LABEL[field] ?? field} preenchido`,
        confidence: fieldConfidence(ctx, field),
        suggestedCorrection: `Preencha ${FIELD_LABEL[field] ?? field} antes do envio à operadora.`,
        blocking: false,
        source: "contract",
      });
    }
  }
  return out;
}
