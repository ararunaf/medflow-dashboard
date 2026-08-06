/**
 * BusinessDecisionTableEngine — E-06.
 *
 * Coordena regras existentes (BusinessRuleCatalog) para retornar a
 * primeira linha compatível com os fatos de entrada (First Match).
 * Reutiliza BusinessRuleExecutionEngine. Não duplica lógica.
 * Sem persistência. Sem IA. Sem cache. Sem banco.
 */
import { BusinessRuleExecutionEngine } from "../business-rule-execution";
import type { BusinessRuleCatalog } from "../business-rule-catalog";
import type {
  CanonicalBusinessDecisionTable,
  CanonicalBusinessDecisionTableResult,
  CanonicalBusinessRule,
} from "../ports/canonical";

export interface BusinessDecisionTableStore {
  get(tableId: string): CanonicalBusinessDecisionTable | undefined;
  set(table: CanonicalBusinessDecisionTable): void;
  list(): CanonicalBusinessDecisionTable[];
}

export class InMemoryBusinessDecisionTableStore implements BusinessDecisionTableStore {
  private readonly tables = new Map<string, CanonicalBusinessDecisionTable>();

  get(tableId: string): CanonicalBusinessDecisionTable | undefined {
    return this.tables.get(tableId);
  }

  set(table: CanonicalBusinessDecisionTable): void {
    this.tables.set(table.tableId, table);
  }

  list(): CanonicalBusinessDecisionTable[] {
    return [...this.tables.values()];
  }
}

export class BusinessDecisionTableEngine {
  private readonly execution = new BusinessRuleExecutionEngine();

  constructor(
    private readonly catalog: BusinessRuleCatalog,
    private readonly store: BusinessDecisionTableStore = new InMemoryBusinessDecisionTableStore(),
  ) {}

  register(table: CanonicalBusinessDecisionTable): { ok: boolean; code: string; message: string } {
    if (!table.tableId) {
      return {
        ok: false,
        code: "BUSINESS_DECISION_TABLE_MISSING_ID",
        message: "tableId is required",
      };
    }
    this.store.set(table);
    return {
      ok: true,
      code: "BUSINESS_DECISION_TABLE_REGISTERED",
      message: "decision table registered",
    };
  }

  find(tableId: string): CanonicalBusinessDecisionTable | undefined {
    return this.store.get(tableId);
  }

  list(): CanonicalBusinessDecisionTable[] {
    return this.store.list();
  }

  execute(tableId: string, facts: Record<string, unknown>): CanonicalBusinessDecisionTableResult {
    const table = this.store.get(tableId);
    if (!table) {
      return {
        kind: "canonical-business-decision-table-result",
        ok: false,
        tableId,
        matched: false,
        code: "BUSINESS_DECISION_TABLE_NOT_FOUND",
        message: "decision table not found",
        rule: null,
      };
    }

    for (const ruleId of table.rows) {
      const found = this.catalog.find(ruleId);
      if (!found.ok || !found.rule) {
        return {
          kind: "canonical-business-decision-table-result",
          ok: false,
          tableId,
          matched: false,
          code: "BUSINESS_DECISION_TABLE_RULE_NOT_FOUND",
          message: `rule ${ruleId} not found`,
          rule: null,
        };
      }
      const rule = found.rule as CanonicalBusinessRule;
      const exec = this.execution.execute(rule, facts);
      if (exec.matched) {
        return {
          kind: "canonical-business-decision-table-result",
          ok: true,
          tableId,
          matched: true,
          code: "BUSINESS_DECISION_TABLE_MATCHED",
          message: "rule matched",
          ruleId,
          rule,
          output: exec.output,
        };
      }
    }

    return {
      kind: "canonical-business-decision-table-result",
      ok: true,
      tableId,
      matched: false,
      code: "BUSINESS_DECISION_TABLE_NOT_MATCHED",
      message: "no row matched",
      rule: null,
    };
  }
}
