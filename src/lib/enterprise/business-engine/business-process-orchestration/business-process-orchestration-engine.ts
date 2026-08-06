/**
 * BusinessProcessOrchestrationEngine — E-05.
 *
 * Coordena múltiplos Workflows (E-04) em um processo de negócio.
 * Reutiliza BusinessWorkflowEngine. Não acessa BusinessTransactionEngine.
 * Não acessa BusinessRuleCatalog. Sem persistência. Sem banco.
 */
import { BusinessWorkflowEngine, type BusinessWorkflowInput } from "../business-workflow";
import type {
  CanonicalBusinessProcessOrchestrationResult,
  CanonicalBusinessWorkflowResult,
} from "../ports/canonical";

export interface BusinessProcessInput {
  readonly orchestrationId: string;
  readonly processes: readonly { processId: string; workflows: readonly BusinessWorkflowInput[] }[];
}

export class BusinessProcessOrchestrationEngine {
  private readonly workflowEngine = new BusinessWorkflowEngine();

  execute(input: BusinessProcessInput): CanonicalBusinessProcessOrchestrationResult {
    const output: Record<string, unknown> = {};
    const processResults: CanonicalBusinessWorkflowResult[] = [];

    for (const process of input.processes) {
      for (const workflow of process.workflows) {
        const workflowResult = this.workflowEngine.execute(workflow);
        processResults.push(workflowResult);

        if (workflowResult.output) {
          Object.assign(output, workflowResult.output);
        }

        if (!workflowResult.ok) {
          return {
            kind: "canonical-business-process-orchestration-result",
            ok: false,
            orchestrationId: input.orchestrationId,
            code: "BUSINESS_PROCESS_ORCHESTRATION_STOPPED",
            message: `process ${process.processId} workflow ${workflow.workflowId} failed`,
            processResults,
            completed: false,
            output,
          };
        }
      }
    }

    return {
      kind: "canonical-business-process-orchestration-result",
      ok: true,
      orchestrationId: input.orchestrationId,
      code: "BUSINESS_PROCESS_ORCHESTRATION_COMPLETED",
      message: "process orchestration completed",
      processResults,
      completed: true,
      output,
    };
  }
}
