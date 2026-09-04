/**
 * F6-O1 — lógica pura de prontidão para homologação TISS por operadora.
 *
 * `operator_contracts`/`contract_rule_versions` usam `operator_code`/
 * `operator_name` em texto livre, sem FK para `insurance_providers.id`
 * (pipeline de ingestão de contrato e cadastro de operadora TISS são
 * sistemas desconectados hoje — ver capture-to-billing-bridge-gap). Por
 * isso a prontidão é dividida em dois níveis, sem inventar heurística de
 * casamento por texto:
 *  - por operadora: `ans_code` cadastrado + ao menos uma guia TISS emitida
 *    para aquela operadora;
 *  - do tenant (mostrado uma vez, não por operadora): dados institucionais
 *    completos em `tenant_settings` + ao menos uma `contract_rule_versions`
 *    existente (a tabela só admite INSERT após aprovação humana — a
 *    própria existência da linha já é a aprovação, não há coluna de
 *    status para checar).
 */

export type HomologationStatus = "not_started" | "in_progress" | "homologated";

export const HOMOLOGATION_STATUSES: readonly HomologationStatus[] = [
  "not_started",
  "in_progress",
  "homologated",
];

export function isHomologationStatus(value: unknown): value is HomologationStatus {
  return typeof value === "string" && (HOMOLOGATION_STATUSES as readonly string[]).includes(value);
}

export type TenantInstitutionalSettings = {
  institution_name: string;
  contact_email: string;
  support_phone: string;
  cnpj: string | null;
};

export type TenantReadiness = {
  institutionalDataComplete: boolean;
  missingInstitutionalFields: string[];
  hasApprovedContractRule: boolean;
};

const INSTITUTIONAL_FIELD_LABELS: Record<keyof TenantInstitutionalSettings, string> = {
  institution_name: "Nome da instituição",
  contact_email: "E-mail de contato",
  support_phone: "Telefone de suporte",
  cnpj: "CNPJ",
};

export function computeTenantReadiness(
  settings: TenantInstitutionalSettings | null,
  hasApprovedContractRule: boolean,
): TenantReadiness {
  const missingInstitutionalFields: string[] = [];
  if (!settings) {
    missingInstitutionalFields.push(...Object.values(INSTITUTIONAL_FIELD_LABELS));
  } else {
    for (const field of Object.keys(INSTITUTIONAL_FIELD_LABELS) as Array<keyof TenantInstitutionalSettings>) {
      const value = settings[field];
      if (!value || value.trim().length === 0) {
        missingInstitutionalFields.push(INSTITUTIONAL_FIELD_LABELS[field]);
      }
    }
  }
  return {
    institutionalDataComplete: missingInstitutionalFields.length === 0,
    missingInstitutionalFields,
    hasApprovedContractRule,
  };
}

export type OperatorReadiness = {
  providerId: string;
  providerName: string;
  active: boolean;
  ansCodeConfigured: boolean;
  hasBilledGuide: boolean;
  homologationStatus: HomologationStatus;
  homologationNotes: string | null;
  homologatedAt: string | null;
  technicallyReady: boolean;
};

export function computeOperatorReadiness(input: {
  providerId: string;
  providerName: string;
  active: boolean;
  ansCode: string;
  hasBilledGuide: boolean;
  homologationStatus: string;
  homologationNotes: string | null;
  homologatedAt: string | null;
}): OperatorReadiness {
  const ansCodeConfigured = input.ansCode.trim().length > 0;
  return {
    providerId: input.providerId,
    providerName: input.providerName,
    active: input.active,
    ansCodeConfigured,
    hasBilledGuide: input.hasBilledGuide,
    homologationStatus: isHomologationStatus(input.homologationStatus) ? input.homologationStatus : "not_started",
    homologationNotes: input.homologationNotes,
    homologatedAt: input.homologatedAt,
    technicallyReady: ansCodeConfigured && input.hasBilledGuide,
  };
}
