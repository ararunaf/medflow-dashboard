/**
 * Tipos vendor-agnósticos da Enterprise Business Engine.
 */
import type {
  CanonicalBusinessRule,
  CanonicalBusinessRuleCatalogHealth,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
} from "./canonical";
import type { BusinessEngineCapabilities } from "./capabilities";

export type BusinessEngineProviderId = "enterprise" | "default" | "mock" | "test";

export interface BusinessEngineInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly vendor: string;
  readonly provider: BusinessEngineProviderId;
}

export interface BusinessEngineHealth {
  readonly ok: boolean;
  readonly businessEngineOk: boolean;
  readonly businessRuleCatalogOk: boolean;
  readonly businessRuleExecutionOk: boolean;
  readonly businessTransactionOk: boolean;
}

export interface RegisterBusinessRuleInput {
  readonly rule: CanonicalBusinessRule;
  readonly requestId?: string;
}

export interface RegisterBusinessRuleResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly ruleId?: string;
  readonly rule?: CanonicalBusinessRule | null;
}

export interface ListBusinessRulesInput {
  readonly tag?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly requestId?: string;
}

export interface ListBusinessRulesResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly rules: readonly CanonicalBusinessRule[];
  readonly total: number;
}

export interface FindBusinessRuleInput {
  readonly ruleId: string;
  readonly requestId?: string;
}

export type FindBusinessRuleResult = CanonicalBusinessRuleCatalogResult;

export interface GetBusinessRuleCatalogStatsInput {
  readonly requestId?: string;
}

export interface GetBusinessRuleCatalogStatsResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly stats: CanonicalBusinessRuleCatalogStats;
}

export interface ExecuteBusinessRuleInput {
  readonly ruleId: string;
  readonly facts: Record<string, unknown>;
  readonly requestId?: string;
}

export type ExecuteBusinessRuleResult = CanonicalBusinessRuleExecutionResult;

export interface ExecuteBusinessTransactionInput {
  readonly transactionId: string;
  readonly steps: readonly CanonicalBusinessTransactionStep[];
  readonly requestId?: string;
}

export type ExecuteBusinessTransactionResult = CanonicalBusinessTransactionResult;

export type {
  BusinessEngineCapabilities,
  CanonicalBusinessRule,
  CanonicalBusinessRuleCatalogHealth,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
};
