/**
 * BusinessWorkflowEngine — E-04.
 *
 * Orquestra transações de negócio (E-03) em um fluxo de estágios.
 * Reutiliza BusinessTransactionEngine. Não acessa BusinessRuleCatalog.
 * Sem persistência. Sem process orchestration. Sem banco.
 */
import { BusinessTransactionEngine, type BusinessTransactionInput } from "../business-transaction";
import type {
  CanonicalBusinessRule,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessWorkflowResult,
} from "../ports/canonical";

export interface BusinessWorkflowStepInput {
  readonly stepId: string;
  readonly rule: CanonicalBusinessRule;
  readonly facts: Record<string, unknown>;
}

export interface BusinessWorkflowStageInput {
  readonly stageId: string;
  readonly transactionId: string;
  readonly steps: readonly BusinessWorkflowStepInput[];
}

export interface BusinessWorkflowInput {
  readonly workflowId: string;
  readonly stages: readonly BusinessWorkflowStageInput[];
}

export class BusinessWorkflowEngine {
  private readonly transactionEngine = new BusinessTransactionEngine();

  execute(input: BusinessWorkflowInput): CanonicalBusinessWorkflowResult {
    const stageResults: CanonicalBusinessTransactionResult[] = [];
    const output: Record<string, unknown> = {};

    for (const stage of input.stages) {
      const transaction: BusinessTransactionInput = {
        transactionId: stage.transactionId,
        steps: stage.steps,
      };
      const stageResult = this.transactionEngine.execute(transaction);
      stageResults.push(stageResult);

      if (stageResult.output) {
        Object.assign(output, stageResult.output);
      }

      if (!stageResult.ok) {
        return {
          kind: "canonical-business-workflow-result",
          ok: false,
          workflowId: input.workflowId,
          code: "BUSINESS_WORKFLOW_STOPPED",
          message: `stage ${stage.stageId} transaction failed`,
          stageResults,
          completed: false,
          output,
        };
      }
    }

    return {
      kind: "canonical-business-workflow-result",
      ok: true,
      workflowId: input.workflowId,
      code: "BUSINESS_WORKFLOW_COMPLETED",
      message: "workflow completed",
      stageResults,
      completed: true,
      output,
    };
  }
}
