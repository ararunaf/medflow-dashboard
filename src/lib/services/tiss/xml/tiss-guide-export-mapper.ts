/**
 * Mapeia uma guia real de `tiss_guides` (+ joins) para o input do
 * serializador ANS oficial — F3-S1 follow-up. Lógica pura, sem Supabase:
 * quem consulta o banco é xml-export-service.ts.
 *
 * Nunca inventa valor: agrega TODOS os campos obrigatórios ausentes numa
 * única TissGuideExportValidationError por guia, para o usuário corrigir
 * de uma vez em vez de descobrir campo por campo a cada nova tentativa de
 * exportar.
 */
import {
  TISS_CONSELHO_CRM,
  TISS_GRAU_PART_CLINICO,
  TISS_TABELA_TUSS,
} from "./tiss-xml-simple-types";
import {
  resolveTissClassificationCodes,
  TissClassificationUnresolvedError,
  type TissTenantClassificationDefaults,
} from "./tiss-classification-resolver";
import { parseCrmForTiss } from "./tiss-professional-mapper";
import type {
  TissBeneficiarioInput,
  TissGuiaConsultaInput,
  TissGuiaHonorarioInput,
  TissGuiaSadtInput,
  TissProfissionalInput,
} from "./tiss-xml-types";
import type { TissGuideType as TissGuideBillingType } from "@/lib/database.types";

export type TissGuideExportItemRow = {
  procedureCode: string;
  procedureDescription: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  executionDate: string;
};

export type TissGuideExportRow = {
  id: string;
  guideNumber: number;
  guideType: TissGuideBillingType;
  attendanceDate: string;
  beneficiaryCardNumber: string | null;
  beneficiaryIsNewborn: boolean;
  regimeAtendimento: string | null;
  caraterAtendimento: string | null;
  tipoAtendimento: string | null;
  tipoConsulta: string | null;
  insuranceProviderAnsCode: string | null;
  professionalCrm: string;
  professionalCboCode: string | null;
  professionalName: string | null;
  hospitalCnes: string | null;
  hospitalName: string | null;
  items: TissGuideExportItemRow[];
};

export type TissExportContext = {
  tenantCnpj: string | null;
  defaultRegimeAtendimento: string | null;
  defaultCaraterAtendimento: string | null;
};

export class TissGuideExportValidationError extends Error {
  readonly guideId: string;
  readonly missingFields: string[];

  constructor(guideId: string, missingFields: string[]) {
    super(`Guia ${guideId}: não é possível exportar — faltam: ${missingFields.join("; ")}.`);
    this.name = "TissGuideExportValidationError";
    this.guideId = guideId;
    this.missingFields = missingFields;
  }
}

export type TissMappedGuide =
  | { kind: "consulta"; input: TissGuiaConsultaInput }
  | { kind: "sadt"; input: TissGuiaSadtInput }
  | { kind: "honorario_individual"; input: TissGuiaHonorarioInput };

export function buildTissGuideExportInput(
  row: TissGuideExportRow,
  ctx: TissExportContext,
): TissMappedGuide {
  const errors: string[] = [];

  if (!ctx.tenantCnpj) {
    errors.push("CNPJ da cooperativa (Instituição > Parametrização)");
  }
  if (!row.beneficiaryCardNumber) {
    errors.push("número da carteirinha do beneficiário");
  }
  if (!row.hospitalCnes) {
    errors.push("CNES do estabelecimento (vincule a guia a uma unidade com CNES cadastrado)");
  }
  if (!row.professionalCboCode) {
    errors.push("CBO do profissional executante");
  }
  if (!row.professionalName) {
    errors.push("nome do profissional executante");
  }
  if (!row.hospitalName) {
    errors.push("nome do estabelecimento (vincule a guia a uma unidade cadastrada)");
  }
  if (!row.insuranceProviderAnsCode) {
    errors.push("registro ANS da operadora");
  }
  if (row.items.length === 0) {
    errors.push("ao menos um procedimento/item na guia");
  }

  let crmUf: string | null = null;
  let crmNumero: string | null = null;
  try {
    const parsed = parseCrmForTiss(row.professionalCrm);
    crmUf = parsed.uf;
    crmNumero = parsed.numero;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const tenantDefaults: TissTenantClassificationDefaults = {
    defaultRegimeAtendimento: ctx.defaultRegimeAtendimento,
    defaultCaraterAtendimento: ctx.defaultCaraterAtendimento,
  };
  let regimeAtendimento: string | undefined;
  let caraterAtendimento: string | undefined;
  let tipoAtendimento: string | undefined;
  let tipoConsulta: string | undefined;
  try {
    const resolved = resolveTissClassificationCodes(
      row.id,
      {
        guideType: row.guideType,
        regimeAtendimento: row.regimeAtendimento,
        caraterAtendimento: row.caraterAtendimento,
        tipoAtendimento: row.tipoAtendimento,
        tipoConsulta: row.tipoConsulta,
      },
      tenantDefaults,
    );
    regimeAtendimento = resolved.regimeAtendimento;
    caraterAtendimento = resolved.caraterAtendimento;
    tipoAtendimento = resolved.tipoAtendimento;
    tipoConsulta = resolved.tipoConsulta;
  } catch (err) {
    if (err instanceof TissClassificationUnresolvedError) {
      errors.push(...err.missingFields);
    } else {
      throw err;
    }
  }

  if (errors.length > 0) {
    throw new TissGuideExportValidationError(row.id, errors);
  }

  const beneficiario: TissBeneficiarioInput = {
    numeroCarteira: row.beneficiaryCardNumber as string,
    atendimentoRN: row.beneficiaryIsNewborn,
  };
  const profissional: TissProfissionalInput = {
    nomeProfissional: row.professionalName as string,
    conselhoProfissional: TISS_CONSELHO_CRM,
    numeroConselhoProfissional: crmNumero as string,
    ufConselho: crmUf as string,
    cbos: row.professionalCboCode as string,
  };
  const numeroGuiaPrestador = String(row.guideNumber);
  const cnpj = ctx.tenantCnpj as string;
  const registroANS = row.insuranceProviderAnsCode as string;
  const cnes = row.hospitalCnes as string;
  const hospitalName = row.hospitalName as string;
  const professionalName = row.professionalName as string;

  if (row.guideType === "consulta") {
    const item = row.items[0]!;
    const input: TissGuiaConsultaInput = {
      registroANS,
      numeroGuiaPrestador,
      beneficiario,
      contratadoExecutante: { kind: "cnpj", cnpj, cnes },
      profissionalExecutante: profissional,
      indicacaoAcidente: "9",
      dadosAtendimento: {
        regimeAtendimento: regimeAtendimento as string,
        dataAtendimento: row.attendanceDate,
        tipoConsulta: tipoConsulta as string,
        procedimento: {
          codigoTabela: TISS_TABELA_TUSS,
          codigoProcedimento: item.procedureCode,
          valorProcedimento: item.unitValue,
        },
      },
    };
    return { kind: "consulta", input };
  }

  if (row.guideType === "sadt") {
    const valorTotalGeral = row.items.reduce((sum, it) => sum + it.totalValue, 0);
    const input: TissGuiaSadtInput = {
      registroANS,
      numeroGuiaPrestador,
      beneficiario,
      contratadoSolicitante: { kind: "cnpj", cnpj },
      nomeContratadoSolicitante: hospitalName,
      profissionalSolicitante: profissional,
      caraterAtendimento: caraterAtendimento as string,
      contratadoExecutante: { kind: "cnpj", cnpj, cnes },
      dadosAtendimento: {
        tipoAtendimento: tipoAtendimento as string,
        indicacaoAcidente: "9",
        regimeAtendimento: regimeAtendimento as string,
      },
      procedimentosExecutados: row.items.map((item, i) => ({
        sequencialItem: i + 1,
        dataExecucao: item.executionDate,
        procedimento: {
          codigoTabela: TISS_TABELA_TUSS,
          codigoProcedimento: item.procedureCode,
          descricaoProcedimento: item.procedureDescription,
        },
        quantidadeExecutada: item.quantity,
        reducaoAcrescimo: 0,
        valorUnitario: item.unitValue,
        valorTotal: item.totalValue,
      })),
      valorTotalGeral,
    };
    return { kind: "sadt", input };
  }

  const valorTotalHonorarios = row.items.reduce((sum, it) => sum + it.totalValue, 0);
  const input: TissGuiaHonorarioInput = {
    registroANS,
    numeroGuiaPrestador,
    guiaSolicInternacao: numeroGuiaPrestador,
    beneficiario,
    localContratado: { kind: "cnpjLocalExecutante", cnpj, nomeContratado: hospitalName, cnes },
    dadosContratadoExecutante: { codigoNaOperadora: cnpj, cnesContratadoExecutante: cnes },
    dadosInternacao: { dataInicioFaturamento: row.attendanceDate, dataFimFaturamento: row.attendanceDate },
    procedimentosRealizados: row.items.map((item, i) => ({
      sequencialItem: i + 1,
      dataExecucao: item.executionDate,
      procedimento: {
        codigoTabela: TISS_TABELA_TUSS,
        codigoProcedimento: item.procedureCode,
        descricaoProcedimento: item.procedureDescription,
      },
      quantidadeExecutada: item.quantity,
      reducaoAcrescimo: 0,
      valorUnitario: item.unitValue,
      valorTotal: item.totalValue,
      profissionais: [
        {
          grauParticipacao: TISS_GRAU_PART_CLINICO,
          // codProfissional só aceita codigoPrestadorNaOperadora/CPF (é
          // identificação de pessoa) — sem CPF do profissional cadastrado,
          // reaproveita o CNPJ da cooperativa como "código" (achado real
          // de F3-S2: cnpj não é opção válida aqui).
          codProfissional: { kind: "codigoNaOperadora", codigo: cnpj },
          nomeProfissional: professionalName,
          conselhoProfissional: TISS_CONSELHO_CRM,
          numeroConselhoProfissional: crmNumero as string,
          ufConselho: crmUf as string,
          cbo: row.professionalCboCode as string,
        },
      ],
    })),
    valorTotalHonorarios,
    dataEmissaoGuia: row.attendanceDate,
  };
  return { kind: "honorario_individual", input };
}
