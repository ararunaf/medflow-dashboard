/**
 * Resolução dos códigos de classificação operacional exigidos pelo XML
 * TISS oficial (regimeAtendimento, caraterAtendimento, tipoAtendimento,
 * tipoConsulta) — segue F3-S1.
 *
 * Cadeia única de resolução, para que qualquer origem futura (captura via
 * OCR incluída) só precise escrever no mesmo lugar (tiss_guides), nunca
 * criar um sistema paralelo:
 *   1. valor explícito na guia (tiss_guides.regime_atendimento etc.)
 *   2. default institucional (tenant_settings.default_regime_atendimento —
 *      só regime/caráter têm default sensato; tipo_atendimento/tipo_consulta
 *      variam por guia e não têm valor único razoável por tenant)
 *   3. nada resolvido → TissClassificationUnresolvedError, lista exatamente
 *      o que falta — a exportação NUNCA usa placeholder.
 */
import type { TissGuideType as TissGuideBillingType } from "@/lib/database.types";

export type TissGuideClassificationInput = {
  guideType: TissGuideBillingType;
  regimeAtendimento: string | null;
  caraterAtendimento: string | null;
  tipoAtendimento: string | null;
  tipoConsulta: string | null;
};

export type TissTenantClassificationDefaults = {
  defaultRegimeAtendimento: string | null;
  defaultCaraterAtendimento: string | null;
};

export type ResolvedTissClassification = {
  regimeAtendimento: string;
  caraterAtendimento?: string;
  tipoAtendimento?: string;
  tipoConsulta?: string;
};

export class TissClassificationUnresolvedError extends Error {
  readonly guideId: string;
  readonly missingFields: string[];

  constructor(guideId: string, missingFields: string[]) {
    super(
      `Guia ${guideId}: faltam códigos de classificação obrigatórios para exportação TISS (${missingFields.join(", ")}). ` +
        "Preencha na guia ou configure um default institucional em Instituição > Parametrização.",
    );
    this.name = "TissClassificationUnresolvedError";
    this.guideId = guideId;
    this.missingFields = missingFields;
  }
}

export function resolveTissClassificationCodes(
  guideId: string,
  guide: TissGuideClassificationInput,
  tenantDefaults: TissTenantClassificationDefaults,
): ResolvedTissClassification {
  const missing: string[] = [];

  const regimeAtendimento = guide.regimeAtendimento ?? tenantDefaults.defaultRegimeAtendimento ?? null;
  if (!regimeAtendimento) missing.push("regimeAtendimento");

  let caraterAtendimento: string | undefined;
  let tipoAtendimento: string | undefined;
  if (guide.guideType === "sadt") {
    caraterAtendimento = guide.caraterAtendimento ?? tenantDefaults.defaultCaraterAtendimento ?? undefined;
    if (!caraterAtendimento) missing.push("caraterAtendimento");
    tipoAtendimento = guide.tipoAtendimento ?? undefined;
    if (!tipoAtendimento) missing.push("tipoAtendimento");
  }

  let tipoConsulta: string | undefined;
  if (guide.guideType === "consulta") {
    tipoConsulta = guide.tipoConsulta ?? undefined;
    if (!tipoConsulta) missing.push("tipoConsulta");
  }

  if (missing.length > 0) {
    throw new TissClassificationUnresolvedError(guideId, missing);
  }

  return {
    regimeAtendimento: regimeAtendimento as string,
    ...(caraterAtendimento ? { caraterAtendimento } : {}),
    ...(tipoAtendimento ? { tipoAtendimento } : {}),
    ...(tipoConsulta ? { tipoConsulta } : {}),
  };
}
