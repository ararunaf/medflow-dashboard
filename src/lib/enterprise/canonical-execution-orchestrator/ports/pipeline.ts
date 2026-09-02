/**
 * Pipeline canônico do Canonical Execution Orchestrator — EPC-24.
 *
 * Sprint 02: constantes de documentação / compatibilidade.
 * A composição em runtime é obtida exclusivamente via PipelineResolverPort.
 * Sem executar OCR, IA, Mapping, regras, validações ou parsers.
 */

import { FOUNDATION_PORT_CHAIN } from "./foundation-ports";
import type { CanonicalExecutionStep, CanonicalExecutionStepName } from "./models";
import { createStepId } from "./identity";

/**
 * Pipeline arquitetural obrigatório (documentação estrutural).
 *
 * Document Intake → Document Processing → Processing Provider → OCR Provider
 * → TISS Profile → Healthcare Model → Contract Rule Binding → TISS Rule Runtime
 */
export const CANONICAL_ORCHESTRATION_PIPELINE = [
  "document-intake",
  "document-processing",
  "processing-provider",
  "ocr-provider",
  "tiss-profile",
  "healthcare-model",
  "contract-rule-binding",
  "tiss-rule-runtime",
] as const satisfies readonly CanonicalExecutionStepName[];

/**
 * Estágios canônicos do pipeline (ordem fixa).
 * Alias estrutural de CANONICAL_ORCHESTRATION_PIPELINE.
 */
export const CANONICAL_EXECUTION_STEPS = CANONICAL_ORCHESTRATION_PIPELINE;

/**
 * Cadeia estrutural de modelos canônicos (não executável).
 */
export const CANONICAL_STRUCTURAL_CHAIN = [
  "canonical-execution-request",
  "canonical-execution-context",
  "canonical-execution-step",
  "canonical-execution-result",
  "canonical-execution-trace",
] as const;

/**
 * Componentes Enterprise orquestrados (referência estrutural).
 * Sem integração funcional de negócio nesta fundação.
 */
export const CANONICAL_ORCHESTRATED_COMPONENTS = [
  "document-intake",
  "document-processor",
  "processing-provider",
  "ocr-provider",
  "tiss-profile",
  "healthcare-model",
  "contract-rule-binding",
  "tiss-rule-runtime",
] as const;

/**
 * Cria os steps canônicos do pipeline em estado pending,
 * cada um referenciando exclusivamente o Port Foundation correspondente.
 */
export function createCanonicalExecutionSteps(
  createId: () => string = createStepId,
): CanonicalExecutionStep[] {
  return FOUNDATION_PORT_CHAIN.map((entry) => ({
    kind: "canonical-execution-step" as const,
    id: createId(),
    name: entry.stepName,
    order: entry.order,
    status: "pending" as const,
    portRef: entry.portRef,
    portContract: entry.portContract,
  }));
}

/**
 * Integração futura documentada — sem implementação funcional nesta sprint.
 *
 * Como o Orquestrador utilizará cada Port Foundation:
 */
export const FUTURE_PORT_INTEGRATION_NOTES = {
  documentIntake:
    "startExecution registra intakeRef estrutural. " +
    "Integração futura via DocumentIntakePort.createIntake — sem invocação nesta fundação.",
  documentProcessor:
    "Step document-processing registra documentRef estrutural. " +
    "Integração futura via DocumentProcessorPort — sem processamento real.",
  processingProvider:
    "Step processing-provider registra referência estrutural ao ProcessingProviderPort. " +
    "Sem despacho real de providers.",
  ocrProvider:
    "Step ocr-provider registra ocrRef estrutural. " +
    "OCRProviderPort NÃO é invocado para OCR real nesta fundação.",
  tissProfile: "Step tiss-profile registra profileRef estrutural. " + "Sem validação de profile.",
  healthcareModel:
    "Step healthcare-model registra healthcareModelRef estrutural. " +
    "Sem montagem real do modelo.",
  contractRuleBinding:
    "Step contract-rule-binding registra bindingRef estrutural. " + "Sem interpretação contratual.",
  tissRuleRuntime:
    "Step tiss-rule-runtime registra runtimeRef estrutural. " +
    "TISSRuleRuntimePort NÃO executa regras nesta fundação.",
} as const;
