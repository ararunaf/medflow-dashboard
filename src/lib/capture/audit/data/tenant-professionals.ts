/**
 * Reconhecimento do profissional executante — casa CRM/nome lidos na guia
 * com o cadastro de profissionais da instituição (tabela `professionals`).
 *
 * Puro (sem banco): o carregamento fica em preventive-audit-service e no
 * capture-guide-bridge; aqui só a comparação, usada pela auditoria (EXE-004..006)
 * e pelo rascunho de faturamento.
 */

export type TenantProfessional = {
  id: string;
  crm: string | null;
  fullName: string | null;
  specialty?: string | null;
};

export type ProfessionalMatchedBy = "crm" | "name";

export type ProfessionalMatch = {
  professional: TenantProfessional | null;
  matchedBy: ProfessionalMatchedBy | null;
  /** CRM casou, mas o nome lido na guia não confere com o cadastro. */
  nameMismatch: boolean;
};

/** Resumo gravado no audit_report.json e mostrado na revisão. */
export type ExecutingProfessionalRecognition = {
  status: "recognized" | "not_registered" | "not_read" | "unavailable";
  professionalId: string | null;
  fullName: string | null;
  crm: string | null;
  matchedBy: ProfessionalMatchedBy | null;
  nameMismatch: boolean;
  /** CRM e nome como foram lidos na guia. */
  readCrm: string | null;
  readName: string | null;
};

function digits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** CRM "SP-012345", "12345/SP", "012345" — compara número sem zeros à esquerda e UF quando ambos têm. */
export function sameCrm(a: string, b: string): boolean {
  const numA = digits(a).replace(/^0+/, "");
  const numB = digits(b).replace(/^0+/, "");
  if (!numA || numA !== numB) return false;
  const ufA = a.toUpperCase().match(/[A-Z]{2}/)?.[0];
  const ufB = b.toUpperCase().match(/[A-Z]{2}/)?.[0];
  return !ufA || !ufB || ufA === ufB;
}

const NAME_STOPWORDS = new Set(["DA", "DE", "DO", "DAS", "DOS", "E", "DR", "DRA"]);

function nameTokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NAME_STOPWORDS.has(t));
}

/**
 * Nomes conferem quando primeiro e último nome batem, ou quando todas as
 * palavras do nome mais curto aparecem no mais longo (guia costuma abreviar).
 */
export function samePersonName(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1]) return true;
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (shorter.length < 2) return false;
  const pool = new Set(longer);
  return shorter.every((t) => pool.has(t));
}

export function matchTenantProfessional(
  professionals: readonly TenantProfessional[],
  read: { crm: string | null; name: string | null },
): ProfessionalMatch {
  if (read.crm) {
    const byCrm = professionals.find((p) => p.crm && sameCrm(p.crm, read.crm!));
    if (byCrm) {
      const nameMismatch = Boolean(
        read.name && byCrm.fullName && !samePersonName(read.name, byCrm.fullName),
      );
      return { professional: byCrm, matchedBy: "crm", nameMismatch };
    }
    return { professional: null, matchedBy: null, nameMismatch: false };
  }
  if (read.name) {
    const byName = professionals.filter(
      (p) => p.fullName && samePersonName(read.name!, p.fullName),
    );
    // Só reconhece por nome quando não há ambiguidade (homônimos).
    if (byName.length === 1) {
      return { professional: byName[0]!, matchedBy: "name", nameMismatch: false };
    }
  }
  return { professional: null, matchedBy: null, nameMismatch: false };
}

export function recognizeExecutingProfessional(
  professionals: readonly TenantProfessional[] | undefined,
  read: { crm: string | null; name: string | null },
): ExecutingProfessionalRecognition {
  const base = { readCrm: read.crm, readName: read.name };
  if (!professionals) {
    return {
      status: "unavailable",
      professionalId: null,
      fullName: null,
      crm: null,
      matchedBy: null,
      nameMismatch: false,
      ...base,
    };
  }
  const match = matchTenantProfessional(professionals, read);
  if (match.professional) {
    return {
      status: "recognized",
      professionalId: match.professional.id,
      fullName: match.professional.fullName,
      crm: match.professional.crm,
      matchedBy: match.matchedBy,
      nameMismatch: match.nameMismatch,
      ...base,
    };
  }
  return {
    status: read.crm || read.name ? "not_registered" : "not_read",
    professionalId: null,
    fullName: null,
    crm: null,
    matchedBy: null,
    nameMismatch: false,
    ...base,
  };
}
