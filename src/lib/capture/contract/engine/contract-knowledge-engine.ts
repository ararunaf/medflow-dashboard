/**
 * ContractKnowledgeEngine — localiza regras aplicáveis a partir do StructuredGuide.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 *
 * Responsabilidades:
 * - localizar regras aplicáveis
 * - identificar operadora
 * - identificar contrato
 * - identificar tipo de atendimento
 * - identificar regras específicas
 *
 * Não altera AuditFindings existentes.
 */
import { normalizeAnsCode } from "../../parser/normalizers";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import type { TissGuideType } from "../../parser/types/tiss-guide-type";
import type { ContractRule } from "../types/contract-rule";
import type {
  AttendanceTypeResolution,
  ContractResolution,
  ContractResolutionContext,
  OperatorResolution,
} from "../types/contract-context";
import {
  ContractKnowledgeRegistryStore,
  getDefaultContractRegistry,
} from "../registry/contract-knowledge-registry";

export const CONTRACT_ENGINE_VERSION = "contract_knowledge_v1";

const GUIDE_TYPE_LABELS: Record<TissGuideType, string> = {
  guia_consulta: "Consulta",
  guia_sadt: "SP/SADT",
  guia_honorario: "Honorários",
  unknown: "Não identificado",
};

const PROCEDURE_TYPE_BY_GUIDE: Record<TissGuideType, string> = {
  guia_consulta: "consulta",
  guia_sadt: "exame",
  guia_honorario: "cirurgia",
  unknown: "*",
};

export type ContractKnowledgeEngineOptions = {
  tenantId?: string;
  registry?: ContractKnowledgeRegistryStore;
  referenceDate?: Date;
};

export class ContractKnowledgeEngine {
  private readonly registry: ContractKnowledgeRegistryStore;

  constructor(registry?: ContractKnowledgeRegistryStore) {
    this.registry = registry ?? getDefaultContractRegistry();
  }

  resolveOperator(guide: StructuredGuide): OperatorResolution {
    const ansField = guide.fields.operator_ans_code;
    const nameField = guide.fields.operator_name;

    const rawAns = ansField?.value ?? ansField?.rawValue ?? null;
    const normalized = rawAns ? normalizeAnsCode(rawAns) : null;

    return {
      ansCode: normalized,
      name: nameField?.value ?? nameField?.rawValue ?? null,
      resolved: normalized != null,
    };
  }

  resolveContract(
    operator: OperatorResolution,
    options: ContractKnowledgeEngineOptions = {},
  ): ContractResolution {
    if (!operator.ansCode) {
      return {
        contractId: null,
        contractName: null,
        registryVersion: null,
        resolved: false,
      };
    }

    const version = this.registry.getActiveContractVersion(operator.ansCode, options.tenantId);

    if (!version) {
      return {
        contractId: "GENERIC-ANS",
        contractName: "Regras Genéricas ANS/TISS",
        registryVersion: null,
        resolved: false,
      };
    }

    return {
      contractId: version.contract,
      contractName: version.contract,
      registryVersion: version.version,
      resolved: true,
    };
  }

  resolveAttendanceType(guide: StructuredGuide): AttendanceTypeResolution {
    const guideType = guide.guideType;
    const procedureTypes: string[] = [];

    const defaultType = PROCEDURE_TYPE_BY_GUIDE[guideType];
    if (defaultType !== "*") procedureTypes.push(defaultType);

    for (const line of guide.procedures) {
      const code = line.fields.procedure_code?.value;
      if (code) procedureTypes.push(code);
    }

    return {
      guideType,
      procedureTypes: [...new Set(procedureTypes)],
      label: GUIDE_TYPE_LABELS[guideType],
    };
  }

  locateApplicableRules(
    guide: StructuredGuide,
    options: ContractKnowledgeEngineOptions = {},
  ): { rules: ContractRule[]; conflictsResolved: number } {
    const operator = this.resolveOperator(guide);
    const attendanceType = this.resolveAttendanceType(guide);

    let candidateRules: ContractRule[];

    if (operator.ansCode) {
      candidateRules = this.registry.getRulesForOperator(operator.ansCode, options.tenantId);
    } else {
      candidateRules = this.registry.getGenericRules();
    }

    const filtered = candidateRules.filter((rule) => {
      if (rule.guideType !== "*" && rule.guideType !== attendanceType.guideType) {
        return false;
      }
      if (rule.procedureType !== "*") {
        const matchesDefault =
          rule.procedureType === PROCEDURE_TYPE_BY_GUIDE[attendanceType.guideType];
        const matchesProcedure = attendanceType.procedureTypes.some(
          (pt) => pt === rule.procedureType || pt.startsWith(rule.procedureType),
        );
        if (!matchesDefault && !matchesProcedure) return false;
      }
      return true;
    });

    const { rules, conflictsResolved } = this.resolveConflicts(filtered);
    return { rules, conflictsResolved };
  }

  resolveConflicts(rules: ContractRule[]): { rules: ContractRule[]; conflictsResolved: number } {
    const byKey = new Map<string, ContractRule>();
    let conflictsResolved = 0;

    for (const rule of rules) {
      const key = [
        rule.auditRuleIds?.join(",") ?? "",
        rule.auditFields?.join(",") ?? "",
        rule.auditCategories?.join(",") ?? "",
        rule.guideType,
        rule.procedureType,
      ].join("|");

      const existing = byKey.get(key);
      if (existing) {
        conflictsResolved++;
        if (rule.priority > existing.priority) {
          byKey.set(key, rule);
        }
      } else {
        byKey.set(key, rule);
      }
    }

    return {
      rules: [...byKey.values()].sort((a, b) => b.priority - a.priority),
      conflictsResolved,
    };
  }

  buildContext(
    guide: StructuredGuide,
    options: ContractKnowledgeEngineOptions = {},
  ): ContractResolutionContext {
    const operator = this.resolveOperator(guide);
    const contract = this.resolveContract(operator, options);
    const attendanceType = this.resolveAttendanceType(guide);
    const { rules, conflictsResolved } = this.locateApplicableRules(guide, options);

    return {
      operator,
      contract,
      attendanceType,
      tenantId: options.tenantId,
      applicableRules: rules,
      conflictingRulesResolved: conflictsResolved,
      resolvedAt: new Date().toISOString(),
    };
  }
}

let defaultEngine: ContractKnowledgeEngine | null = null;

export function getDefaultContractKnowledgeEngine(): ContractKnowledgeEngine {
  if (!defaultEngine) defaultEngine = new ContractKnowledgeEngine();
  return defaultEngine;
}
