/**
 * ContractKnowledgeRegistry — registro versionado de regras contratuais.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import type {
  ContractKnowledgeRegistry,
  ContractRegistryVersion,
  ContractRule,
} from "../types/contract-rule";
import { DEFAULT_CONTRACT_REGISTRY, DEFAULT_CONTRACT_RULES } from "./default-contract-rules";

export class ContractKnowledgeRegistryStore {
  private registry: ContractKnowledgeRegistry;

  constructor(registry: ContractKnowledgeRegistry = DEFAULT_CONTRACT_REGISTRY) {
    this.registry = registry;
  }

  getRegistry(): ContractKnowledgeRegistry {
    return this.registry;
  }

  getAllRules(): ContractRule[] {
    return [...DEFAULT_CONTRACT_RULES];
  }

  getRulesForOperator(operatorAns: string | null, tenantId?: string): ContractRule[] {
    if (!operatorAns) {
      return this.getGenericRules();
    }

    const normalized = operatorAns.replace(/\D/g, "").padStart(6, "0").slice(-6);
    const now = new Date();

    const activeVersions = this.registry.versions.filter((v) => {
      if (v.operator !== normalized && v.operator !== "*") return false;
      if (tenantId && v.tenantId && v.tenantId !== tenantId) return false;
      const from = new Date(v.effectiveFrom);
      if (from > now) return false;
      if (v.effectiveTo) {
        const to = new Date(v.effectiveTo);
        if (to < now) return false;
      }
      return true;
    });

    if (activeVersions.length === 0) {
      return this.getGenericRules();
    }

    const rules: ContractRule[] = [];
    for (const version of activeVersions) {
      rules.push(...version.rules);
    }

    return rules.length > 0 ? rules : this.getGenericRules();
  }

  getGenericRules(): ContractRule[] {
    return DEFAULT_CONTRACT_RULES.filter((r) => r.operator === "*");
  }

  getActiveContractVersion(operatorAns: string, tenantId?: string): ContractRegistryVersion | null {
    const normalized = operatorAns.replace(/\D/g, "").padStart(6, "0").slice(-6);
    const now = new Date();

    const versions = this.registry.versions
      .filter((v) => {
        if (v.operator !== normalized) return false;
        if (tenantId && v.tenantId && v.tenantId !== tenantId) return false;
        const from = new Date(v.effectiveFrom);
        if (from > now) return false;
        if (v.effectiveTo) {
          const to = new Date(v.effectiveTo);
          if (to < now) return false;
        }
        return true;
      })
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

    return versions[0] ?? null;
  }

  registerTenantVersion(version: ContractRegistryVersion): void {
    this.registry = {
      ...this.registry,
      updatedAt: new Date().toISOString(),
      versions: [...this.registry.versions, version],
    };
  }

  /**
   * Substitui (upsert por operator+contract+version) as versões carregadas de
   * uma fonte externa (ex.: Supabase, ver src/lib/server/contract-rules-backend.ts).
   * Idempotente — chamar de novo com os mesmos dados não duplica versões.
   * Versões registradas via registerTenantVersion() (override de tenant) não
   * são afetadas — só as que colidem na chave (operator, contract, version).
   */
  loadVersions(versions: readonly ContractRegistryVersion[]): void {
    const key = (v: ContractRegistryVersion) => `${v.operator}::${v.contract}::${v.version}`;
    const incoming = new Map(versions.map((v) => [key(v), v]));
    const kept = this.registry.versions.filter((v) => !incoming.has(key(v)));
    this.registry = {
      ...this.registry,
      updatedAt: new Date().toISOString(),
      versions: [...kept, ...versions],
    };
  }
}

let defaultStore: ContractKnowledgeRegistryStore | null = null;

export function getDefaultContractRegistry(): ContractKnowledgeRegistryStore {
  if (!defaultStore) defaultStore = new ContractKnowledgeRegistryStore();
  return defaultStore;
}

export {
  DEFAULT_CONTRACT_REGISTRY,
  DEFAULT_CONTRACT_RULES,
  CONTRACT_RULE_COUNT,
} from "./default-contract-rules";
