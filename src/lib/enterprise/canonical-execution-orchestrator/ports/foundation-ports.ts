/**
 * Referências estruturais aos Ports oficiais da Enterprise Foundation — EPC-24.
 *
 * O Orquestrador comunica-se exclusivamente através destes Ports.
 * Nenhum Engine é importado ou acoplado diretamente.
 *
 * Imports são type-only — sem execução de OCR, IA, Mapping, regras ou parsers.
 */
import type { ContractRuleBindingPort } from "../../contract-rule-binding/ports/contract-rule-binding-port";
import type { DocumentIntakePort } from "../../document-intake/ports/document-intake-port";
import type { DocumentProcessorPort } from "../../document-processor/ports/document-processor-port";
import type { HealthcareModelPort } from "../../healthcare-model/ports/healthcare-model-port";
import type { OCRProviderPort } from "../../ocr-provider/ports/ocr-provider-port";
import type { ProcessingProviderPort } from "../../processing-provider/ports/processing-provider-port";
import type { TISSProfilePort } from "../../tiss-profile/ports/tiss-profile-port";
import type { TISSRuleRuntimePort } from "../../tiss-rule-runtime/ports/tiss-rule-runtime-port";
import type { CanonicalExecutionStepName } from "./models";

/** Identificadores estáveis dos Ports Foundation orquestrados. */
export type FoundationPortRef =
  | "document-intake"
  | "document-processor"
  | "processing-provider"
  | "ocr-provider"
  | "tiss-profile"
  | "healthcare-model"
  | "contract-rule-binding"
  | "tiss-rule-runtime";

/** Nome do contrato Port correspondente. */
export type FoundationPortContract =
  | "DocumentIntakePort"
  | "DocumentProcessorPort"
  | "ProcessingProviderPort"
  | "OCRProviderPort"
  | "TISSProfilePort"
  | "HealthcareModelPort"
  | "ContractRuleBindingPort"
  | "TISSRuleRuntimePort";

/**
 * União tipada dos Ports Foundation orquestrados.
 * Uso exclusivo para tipagem / injeção futura — sem invocação de negócio nesta sprint.
 */
export type FoundationOrchestratedPort =
  | DocumentIntakePort
  | DocumentProcessorPort
  | ProcessingProviderPort
  | OCRProviderPort
  | TISSProfilePort
  | HealthcareModelPort
  | ContractRuleBindingPort
  | TISSRuleRuntimePort;

/**
 * Registry opcional de Ports injetáveis (DI estrutural).
 * Nesta fundação os Ports NÃO são invocados para OCR/IA/Mapping/regras.
 * Podem ser usados apenas para health() agregado futuro.
 */
export type FoundationPortRegistry = {
  documentIntake?: DocumentIntakePort;
  documentProcessor?: DocumentProcessorPort;
  processingProvider?: ProcessingProviderPort;
  ocrProvider?: OCRProviderPort;
  tissProfile?: TISSProfilePort;
  healthcareModel?: HealthcareModelPort;
  contractRuleBinding?: ContractRuleBindingPort;
  tissRuleRuntime?: TISSRuleRuntimePort;
};

/** Descritor estrutural de um elo do pipeline → Port. */
export type FoundationPortStepDescriptor = {
  stepName: CanonicalExecutionStepName;
  portRef: FoundationPortRef;
  portContract: FoundationPortContract;
  order: number;
};

/**
 * Cadeia canônica Document Intake → … → TISS Rule Runtime.
 * Ordem fixa — exclusivamente orquestração estrutural via Ports.
 */
export const FOUNDATION_PORT_CHAIN = [
  {
    stepName: "document-intake",
    portRef: "document-intake",
    portContract: "DocumentIntakePort",
    order: 0,
  },
  {
    stepName: "document-processing",
    portRef: "document-processor",
    portContract: "DocumentProcessorPort",
    order: 1,
  },
  {
    stepName: "processing-provider",
    portRef: "processing-provider",
    portContract: "ProcessingProviderPort",
    order: 2,
  },
  {
    stepName: "ocr-provider",
    portRef: "ocr-provider",
    portContract: "OCRProviderPort",
    order: 3,
  },
  {
    stepName: "tiss-profile",
    portRef: "tiss-profile",
    portContract: "TISSProfilePort",
    order: 4,
  },
  {
    stepName: "healthcare-model",
    portRef: "healthcare-model",
    portContract: "HealthcareModelPort",
    order: 5,
  },
  {
    stepName: "contract-rule-binding",
    portRef: "contract-rule-binding",
    portContract: "ContractRuleBindingPort",
    order: 6,
  },
  {
    stepName: "tiss-rule-runtime",
    portRef: "tiss-rule-runtime",
    portContract: "TISSRuleRuntimePort",
    order: 7,
  },
] as const satisfies readonly FoundationPortStepDescriptor[];

/** Lista plana de Port refs orquestrados. */
export const ORCHESTRATED_FOUNDATION_PORTS = FOUNDATION_PORT_CHAIN.map(
  (entry) => entry.portRef,
) as readonly FoundationPortRef[];

/** Lista plana de contratos Port orquestrados. */
export const ORCHESTRATED_FOUNDATION_PORT_CONTRACTS = FOUNDATION_PORT_CHAIN.map(
  (entry) => entry.portContract,
) as readonly FoundationPortContract[];
