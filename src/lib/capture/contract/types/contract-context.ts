/**
 * Contexto de resolução contratual — resultado da análise do StructuredGuide.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import type { TissGuideType } from "../../parser/types/tiss-guide-type";
import type { ContractRule } from "./contract-rule";

export type OperatorResolution = {
  ansCode: string | null;
  name: string | null;
  resolved: boolean;
};

export type ContractResolution = {
  contractId: string | null;
  contractName: string | null;
  registryVersion: string | null;
  resolved: boolean;
};

export type AttendanceTypeResolution = {
  guideType: TissGuideType;
  procedureTypes: string[];
  label: string;
};

export type ContractResolutionContext = {
  operator: OperatorResolution;
  contract: ContractResolution;
  attendanceType: AttendanceTypeResolution;
  tenantId?: string;
  applicableRules: ContractRule[];
  conflictingRulesResolved: number;
  resolvedAt: string;
};
