/**
 * BusinessTransactionEngine — E-03.
 *
 * Executa transações de negócio genéricas composta por passos.
 * Reutiliza o BusinessRuleExecutionEngine (E-02) e o BusinessRuleCatalog (E-01).
 * Sem persistência. Sem workflow. Sem banco.
 */
import type {
  CanonicalBusinessRule,
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
} from "../ports/canonical";
import { BusinessRuleExecutionEngine } from "../business-rule-execution";

export interface BusinessTransactionStepInput {
  readonly stepId: string;
  readonly rule: CanonicalBusinessRule;
  readonly facts: Record<string, unknown>;
}

export interface BusinessTransactionInput {
  readonly transactionId: string;
  readonly steps: readonly BusinessTransactionStepInput[];
}

export class BusinessTransactionEngine {
  private readonly executor = new BusinessRuleExecutionEngine();

  execute(input: BusinessTransactionInput): CanonicalBusinessTransactionResult {
    const stepResults: CanonicalBusinessRuleExecutionResult[] = [];
    const output: Record<string, unknown> = {};

    for (const step of input.steps) {
      const execution = this.executor.execute(step.rule, step.facts);
      stepResults.push(execution);

      if (execution.output) {
        Object.assign(output, execution.output);
      }

      if (!execution.ok) {
        return {
          kind: "canonical-business-transaction-result",
          ok: false,
          transactionId: input.transactionId,
          code: "BUSINESS_TRANSACTION_ROLLED_BACK",
          message: `step ${step.stepId} failed`,
          stepResults,
          committed: false,
          output,
        };
      }
    }

    return {
      kind: "canonical-business-transaction-result",
      ok: true,
      transactionId: input.transactionId,
      code: "BUSINESS_TRANSACTION_COMMITTED",
      message: "transaction committed",
      stepResults,
      committed: true,
      output,
    };
  }
}
