/**
 * GenericTissEngine — G-10.
 *
 * Fachada do Bloco G. Não contém lógica própria.
 * Apenas expõe os motores especializados via propriedades readonly.
 */
import { TissBusinessValidationEngine } from "../tiss-business-validation";
import { TissCorrectionEngine } from "../tiss-correction";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissOperatorValidationEngine } from "../tiss-operator-validation";
import { TissParserEngine } from "../tiss-parser";
import { TissRepairEngine } from "../tiss-repair";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";

export class GenericTissEngine {
  constructor(
    readonly knowledge: TissKnowledgeEngine,
    readonly layout: TissLayoutEngine,
    readonly parser: TissParserEngine,
    readonly serializer: TissSerializerEngine,
    readonly schemaValidation: TissSchemaValidationEngine,
    readonly businessValidation: TissBusinessValidationEngine,
    readonly operatorValidation: TissOperatorValidationEngine,
    readonly repair: TissRepairEngine,
    readonly correction: TissCorrectionEngine,
  ) {}
}
