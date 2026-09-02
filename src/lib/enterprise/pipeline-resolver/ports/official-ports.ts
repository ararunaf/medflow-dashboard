/**
 * Referências estruturais aos Ports oficiais da Enterprise Foundation —
 * EPC-24 Sprint 02 (Pipeline Resolver).
 *
 * O Resolver compõe o pipeline exclusivamente através destas referências.
 * Imports são type-only — sem execução de OCR, IA, Mapping, regras ou parsers.
 * Nenhum Engine é importado ou acoplado diretamente.
 */
import type { ContractRuleBindingPort } from "../../contract-rule-binding/ports/contract-rule-binding-port";
import type { DocumentIntakePort } from "../../document-intake/ports/document-intake-port";
import type { DocumentProcessorPort } from "../../document-processor/ports/document-processor-port";
import type { HealthcareModelPort } from "../../healthcare-model/ports/healthcare-model-port";
import type { OCRProviderPort } from "../../ocr-provider/ports/ocr-provider-port";
import type { ProcessingProviderPort } from "../../processing-provider/ports/processing-provider-port";
import type { TISSProfilePort } from "../../tiss-profile/ports/tiss-profile-port";
import type { TISSRuleRuntimePort } from "../../tiss-rule-runtime/ports/tiss-rule-runtime-port";
import type { OfficialPortContract, OfficialPortRef, PipelineStageName } from "./models";

/**
 * União tipada dos Ports oficiais resolvíveis.
 * Uso exclusivo para tipagem / DI estrutural — sem invocação de negócio.
 */
export type OfficialOrchestratedPort =
  | DocumentIntakePort
  | DocumentProcessorPort
  | ProcessingProviderPort
  | OCRProviderPort
  | TISSProfilePort
  | HealthcareModelPort
  | ContractRuleBindingPort
  | TISSRuleRuntimePort;

/**
 * Registry opcional de Ports oficiais (DI estrutural).
 * Nesta sprint os Ports NÃO são invocados — apenas referenciados na composição.
 */
export type OfficialPortRegistry = {
  documentIntake?: DocumentIntakePort;
  documentProcessor?: DocumentProcessorPort;
  processingProvider?: ProcessingProviderPort;
  ocrProvider?: OCRProviderPort;
  tissProfile?: TISSProfilePort;
  healthcareModel?: HealthcareModelPort;
  contractRuleBinding?: ContractRuleBindingPort;
  tissRuleRuntime?: TISSRuleRuntimePort;
};

/** Descritor estrutural de um elo Port → estágio. */
export type OfficialPortStageDescriptor = {
  stageName: PipelineStageName;
  portRef: OfficialPortRef;
  portContract: OfficialPortContract;
  order: number;
};

/**
 * Cadeia canônica de Ports oficiais.
 *
 * Document Intake → Document Processing → Processing Provider → OCR Provider
 * → TISS Profile → Healthcare Model → Contract Rule Binding → TISS Rule Runtime
 *
 * Ordem canônica — resolução estrutural apenas (sem execução).
 */
export const OFFICIAL_PORT_CHAIN = [
  {
    stageName: "document-intake",
    portRef: "document-intake",
    portContract: "DocumentIntakePort",
    order: 0,
  },
  {
    stageName: "document-processing",
    portRef: "document-processor",
    portContract: "DocumentProcessorPort",
    order: 1,
  },
  {
    stageName: "processing-provider",
    portRef: "processing-provider",
    portContract: "ProcessingProviderPort",
    order: 2,
  },
  {
    stageName: "ocr-provider",
    portRef: "ocr-provider",
    portContract: "OCRProviderPort",
    order: 3,
  },
  {
    stageName: "tiss-profile",
    portRef: "tiss-profile",
    portContract: "TISSProfilePort",
    order: 4,
  },
  {
    stageName: "healthcare-model",
    portRef: "healthcare-model",
    portContract: "HealthcareModelPort",
    order: 5,
  },
  {
    stageName: "contract-rule-binding",
    portRef: "contract-rule-binding",
    portContract: "ContractRuleBindingPort",
    order: 6,
  },
  {
    stageName: "tiss-rule-runtime",
    portRef: "tiss-rule-runtime",
    portContract: "TISSRuleRuntimePort",
    order: 7,
  },
] as const satisfies readonly OfficialPortStageDescriptor[];

/** Lista plana de Port refs oficiais. */
export const OFFICIAL_PORT_REFS = OFFICIAL_PORT_CHAIN.map(
  (entry) => entry.portRef,
) as readonly OfficialPortRef[];

/** Lista plana de contratos Port oficiais. */
export const OFFICIAL_PORT_CONTRACTS = OFFICIAL_PORT_CHAIN.map(
  (entry) => entry.portContract,
) as readonly OfficialPortContract[];

/**
 * Notas de integração futura — sem implementação funcional nesta sprint.
 */
export const OFFICIAL_PORT_RESOLUTION_NOTES = {
  documentIntake:
    "DocumentIntakePort referenciado estruturalmente — sem createIntake nesta sprint.",
  documentProcessor: "DocumentProcessorPort referenciado estruturalmente — sem processamento real.",
  processingProvider:
    "ProcessingProviderPort referenciado estruturalmente — sem despacho de providers.",
  ocrProvider: "OCRProviderPort referenciado estruturalmente — sem OCR real.",
  tissProfile: "TISSProfilePort referenciado estruturalmente — sem validação de profile.",
  healthcareModel: "HealthcareModelPort referenciado estruturalmente — sem montagem do modelo.",
  contractRuleBinding:
    "ContractRuleBindingPort referenciado estruturalmente — sem interpretação contratual.",
  tissRuleRuntime: "TISSRuleRuntimePort referenciado estruturalmente — sem execução de regras.",
} as const;
