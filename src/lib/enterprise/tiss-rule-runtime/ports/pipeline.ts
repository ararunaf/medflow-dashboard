/**
 * ExecutionPipeline helpers — orquestração estrutural (EPC-23 / FASE 7).
 *
 * Representa exclusivamente o fluxo canônico.
 * Sem executar regras. Sem validações. Sem decisões.
 */

import type { ExecutionStage, ExecutionStageName } from "./models";
import { createStageId } from "./identity";

/**
 * Pipeline arquitetural obrigatório (documentação estrutural).
 *
 * Healthcare Model → TISS Profile → Contract Rule Binding → Rule Packs
 * → Rule Engine → Expression Engine → Execution Result → AI Auditor (futuro)
 */
export const RUNTIME_ORCHESTRATION_PIPELINE = [
  "healthcare-model",
  "tiss-profile",
  "contract-rule-binding",
  "rule-packs",
  "rule-engine",
  "expression-engine",
  "execution-result",
  "ai-auditor",
] as const;

/**
 * Estágios canônicos do ExecutionPipeline (ordem fixa — FASE 7).
 */
export const EXECUTION_PIPELINE_STAGES = [
  "receive-healthcare-model",
  "resolve-profile",
  "resolve-contract-binding",
  "resolve-rule-packs",
  "dispatch-rule-engine",
  "collect-result",
] as const satisfies readonly ExecutionStageName[];

/**
 * Cadeia estrutural de modelos canônicos (não executável).
 */
export const RUNTIME_STRUCTURAL_CHAIN = [
  "execution-context",
  "execution-stage",
  "execution-pipeline",
  "execution-result",
  "execution-metadata",
  "execution-trace",
] as const;

/**
 * Componentes Enterprise que o Runtime orquestra (referência estrutural).
 * Sem integração funcional nesta fundação.
 */
export const RUNTIME_ORCHESTRATED_COMPONENTS = [
  "healthcare-model",
  "tiss-profile",
  "contract",
  "contract-rule-binding",
  "rule-pack",
  "rule",
  "rule/expression",
  "ai-auditor",
  "ocr-provider",
] as const;

/**
 * Cria os estágios canônicos do pipeline em estado pending.
 * Somente estrutura — sem execução.
 */
export function createCanonicalPipelineStages(
  createId: () => string = createStageId,
): ExecutionStage[] {
  return EXECUTION_PIPELINE_STAGES.map((name, order) => ({
    kind: "execution-stage" as const,
    id: createId(),
    name,
    order,
    status: "pending" as const,
  }));
}

/**
 * Integração futura documentada (FASE 9) — sem implementação funcional.
 *
 * Como o Runtime utilizará cada componente Enterprise:
 */
export const FUTURE_INTEGRATION_NOTES = {
  healthcareModel:
    "Entrada exclusiva do Runtime. startExecution recebe healthcareModelRef. " +
    "Nunca aplica regras sobre dados brutos de origem.",
  tissProfile:
    "resolveProfile registra referência estrutural ao Profile. " +
    "Integração futura via TISSProfilePort (EPC-22) — sem lookup nesta fundação.",
  contractFoundation:
    "Contratos (EPC-11) permanecem fora do Runtime. " +
    "Runtime não interpreta cláusulas nem contratos específicos.",
  contractRuleBinding:
    "resolveBindings registra referências estruturais a bindings (EPC-17). " +
    "Sem interpretação contratual.",
  rulePacks:
    "resolveRulePacks registra referências estruturais a packs (EPC-09). " +
    "Sem carregar ou executar packs.",
  ruleEngine:
    "dispatchRules registra intenção de despacho ao Rule Engine (EPC-06A). " +
    "Nenhuma regra é executada nesta fundação.",
  expressionEngine:
    "Expression Engine (EPC-06B) será invocado futuramente pelo Rule Engine, " +
    "não diretamente pelo Runtime. Runtime apenas orquestra.",
  aiAuditor:
    "Após ExecutionResult, AI Auditor (EPC-18) consumirá o resultado " +
    "para explicação futura. Runtime marca aiAuditorPrepared: true.",
  ocr:
    "OCR (EPC-15) permanece upstream do Healthcare Model. " +
    "Runtime nunca chama OCRProviderPort.",
} as const;
