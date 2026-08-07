/**
 * TissSchemaValidationEngine — G-05.
 *
 * Responsável por registrar validações de schema e executar
 * validação estrutural genérica de documentos TISS.
 *
 * Não valida regras de negócio, operadoras, repara ou corrige XML.
 * Não conhece domínio médico, procedimentos ou guias TISS.
 * Reutiliza TissKnowledgeEngine, TissLayoutEngine, TissParserEngine e TissSerializerEngine.
 */
import type {
  CanonicalTissSchemaValidation,
  GetTissSchemaValidationStatsResult,
  ListTissSchemaValidationsResult,
  RegisterTissSchemaValidationInput,
  RegisterTissSchemaValidationResult,
  ValidateTissSchemaInput,
  ValidateTissSchemaResult,
} from "../ports";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissParserEngine } from "../tiss-parser";
import { TissSerializerEngine } from "../tiss-serializer";

export class TissSchemaValidationEngine {
  private readonly store = new Map<string, CanonicalTissSchemaValidation>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
    private readonly parser: TissParserEngine,
    private readonly serializer: TissSerializerEngine,
  ) {}

  private canonicalize(
    schemaValidation: CanonicalTissSchemaValidation,
  ): CanonicalTissSchemaValidation {
    return {
      kind: "tiss-schema-validation",
      schemaValidationId: schemaValidation.schemaValidationId,
      name: schemaValidation.name,
      knowledgeId: schemaValidation.knowledgeId,
      layoutId: schemaValidation.layoutId,
      parserId: schemaValidation.parserId,
      serializerId: schemaValidation.serializerId,
      description: schemaValidation.description ?? "",
      version: schemaValidation.version ?? "",
      tags: schemaValidation.tags ?? [],
    };
  }

  register(input: RegisterTissSchemaValidationInput): RegisterTissSchemaValidationResult {
    const { schemaValidation } = input;

    if (!schemaValidation.schemaValidationId || schemaValidation.schemaValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_MISSING_ID",
        message: "schemaValidationId is required",
      };
    }

    if (!schemaValidation.name || schemaValidation.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!schemaValidation.knowledgeId || schemaValidation.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!schemaValidation.layoutId || schemaValidation.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!schemaValidation.parserId || schemaValidation.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_MISSING_PARSER_ID",
        message: "parserId is required",
      };
    }

    if (!schemaValidation.serializerId || schemaValidation.serializerId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_MISSING_SERIALIZER_ID",
        message: "serializerId is required",
      };
    }

    if (!this.knowledge.get(schemaValidation.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(schemaValidation.layoutId)) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const parser = this.parser.get(schemaValidation.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_UNKNOWN_PARSER",
        message: "parserId not found",
      };
    }

    if (
      parser.knowledgeId !== schemaValidation.knowledgeId ||
      parser.layoutId !== schemaValidation.layoutId
    ) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_INCOHERENT_PARSER",
        message: "parser knowledgeId/layoutId does not match schema validation",
      };
    }

    const serializer = this.serializer.get(schemaValidation.serializerId);
    if (!serializer) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_UNKNOWN_SERIALIZER",
        message: "serializerId not found",
      };
    }

    if (
      serializer.knowledgeId !== schemaValidation.knowledgeId ||
      serializer.layoutId !== schemaValidation.layoutId ||
      serializer.parserId !== schemaValidation.parserId
    ) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_INCOHERENT_SERIALIZER",
        message: "serializer knowledgeId/layoutId/parserId does not match schema validation",
      };
    }

    const canonical = this.canonicalize(schemaValidation);
    this.store.set(canonical.schemaValidationId, canonical);

    return {
      ok: true,
      code: "TISS_SCHEMA_VALIDATION_REGISTERED",
      message: "schema validation registered",
      schemaValidationId: canonical.schemaValidationId,
      schemaValidation: canonical,
    };
  }

  get(schemaValidationId: string): CanonicalTissSchemaValidation | null {
    return this.store.get(schemaValidationId) ?? null;
  }

  list(tag?: string): CanonicalTissSchemaValidation[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((s) => s.tags?.includes(tag));
  }

  stats(): GetTissSchemaValidationStatsResult["stats"] {
    const all = this.list();
    const byTag: Record<string, number> = {};

    for (const s of all) {
      for (const t of s.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      schemaValidationIds: all.map((s) => s.schemaValidationId),
    };
  }

  listResult(tag?: string): ListTissSchemaValidationsResult {
    return {
      ok: true,
      code: "TISS_SCHEMA_VALIDATION_LIST_OK",
      message: "schema validations listed",
      schemaValidations: this.list(tag),
    };
  }

  statsResult(): GetTissSchemaValidationStatsResult {
    return {
      ok: true,
      code: "TISS_SCHEMA_VALIDATION_STATS_OK",
      message: "schema validation stats computed",
      stats: this.stats(),
    };
  }

  validate(input: ValidateTissSchemaInput): ValidateTissSchemaResult {
    const { schemaValidationId, document } = input;
    const schemaValidation = this.get(schemaValidationId);

    if (!schemaValidation) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_NOT_FOUND",
        message: "schema validation not found",
        details: [],
      };
    }

    const parseResult = this.parser.parse({
      parserId: schemaValidation.parserId,
      document,
    });

    if (!parseResult.ok) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_PARSE_FAILED",
        message: parseResult.message,
        details: ["document could not be parsed"],
      };
    }

    const parsed = parseResult.result;
    const details: string[] = [];

    if (!parsed || parsed.knowledgeId !== schemaValidation.knowledgeId) {
      details.push("document knowledgeId does not match schema validation");
    }

    if (!parsed || parsed.layoutId !== schemaValidation.layoutId) {
      details.push("document layoutId does not match schema validation");
    }

    if (details.length > 0) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_FAILED",
        message: "schema validation failed",
        details,
      };
    }

    return {
      ok: true,
      code: "TISS_SCHEMA_VALIDATION_OK",
      message: "schema validation passed",
      details: ["document parsed and structural identifiers match"],
    };
  }
}
