/**
 * TissBusinessValidationEngine — G-06.
 *
 * Responsável por registrar e executar validações de regras de negócio
 * genéricas sobre documentos TISS.
 *
 * Não valida schema XML, operadoras, repara, corrige ou serializa XML.
 * Não conhece domínio específico da aplicação.
 * Reutiliza TissKnowledgeEngine, TissLayoutEngine, TissParserEngine,
 * TissSerializerEngine e TissSchemaValidationEngine.
 */
import type {
  CanonicalTissBusinessValidation,
  GetTissBusinessValidationStatsResult,
  ListTissBusinessValidationsResult,
  RegisterTissBusinessValidationInput,
  RegisterTissBusinessValidationResult,
  ValidateTissBusinessInput,
  ValidateTissBusinessResult,
} from "../ports";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissParserEngine } from "../tiss-parser";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";

export class TissBusinessValidationEngine {
  private readonly store = new Map<string, CanonicalTissBusinessValidation>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
    private readonly parser: TissParserEngine,
    private readonly serializer: TissSerializerEngine,
    private readonly schemaValidation: TissSchemaValidationEngine,
  ) {}

  private canonicalize(
    businessValidation: CanonicalTissBusinessValidation,
  ): CanonicalTissBusinessValidation {
    return {
      kind: "tiss-business-validation",
      businessValidationId: businessValidation.businessValidationId,
      name: businessValidation.name,
      knowledgeId: businessValidation.knowledgeId,
      layoutId: businessValidation.layoutId,
      parserId: businessValidation.parserId,
      serializerId: businessValidation.serializerId,
      schemaValidationId: businessValidation.schemaValidationId,
      rule: businessValidation.rule,
      description: businessValidation.description ?? "",
      version: businessValidation.version ?? "",
      tags: businessValidation.tags ?? [],
    };
  }

  register(input: RegisterTissBusinessValidationInput): RegisterTissBusinessValidationResult {
    const { businessValidation } = input;

    if (
      !businessValidation.businessValidationId ||
      businessValidation.businessValidationId.trim() === ""
    ) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_ID",
        message: "businessValidationId is required",
      };
    }

    if (!businessValidation.name || businessValidation.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!businessValidation.knowledgeId || businessValidation.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!businessValidation.layoutId || businessValidation.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!businessValidation.parserId || businessValidation.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_PARSER_ID",
        message: "parserId is required",
      };
    }

    if (!businessValidation.serializerId || businessValidation.serializerId.trim() === "") {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_SERIALIZER_ID",
        message: "serializerId is required",
      };
    }

    if (
      !businessValidation.schemaValidationId ||
      businessValidation.schemaValidationId.trim() === ""
    ) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_SCHEMA_VALIDATION_ID",
        message: "schemaValidationId is required",
      };
    }

    if (!businessValidation.rule) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_MISSING_RULE",
        message: "rule is required",
      };
    }

    if (!this.knowledge.get(businessValidation.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(businessValidation.layoutId)) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const parser = this.parser.get(businessValidation.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_UNKNOWN_PARSER",
        message: "parserId not found",
      };
    }

    if (
      parser.knowledgeId !== businessValidation.knowledgeId ||
      parser.layoutId !== businessValidation.layoutId
    ) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_INCOHERENT_PARSER",
        message: "parser knowledgeId/layoutId does not match business validation",
      };
    }

    const serializer = this.serializer.get(businessValidation.serializerId);
    if (!serializer) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_UNKNOWN_SERIALIZER",
        message: "serializerId not found",
      };
    }

    if (
      serializer.knowledgeId !== businessValidation.knowledgeId ||
      serializer.layoutId !== businessValidation.layoutId ||
      serializer.parserId !== businessValidation.parserId
    ) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_INCOHERENT_SERIALIZER",
        message: "serializer knowledgeId/layoutId/parserId does not match business validation",
      };
    }

    const schemaValidation = this.schemaValidation.get(businessValidation.schemaValidationId);
    if (!schemaValidation) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_UNKNOWN_SCHEMA_VALIDATION",
        message: "schemaValidationId not found",
      };
    }

    if (
      schemaValidation.knowledgeId !== businessValidation.knowledgeId ||
      schemaValidation.layoutId !== businessValidation.layoutId ||
      schemaValidation.parserId !== businessValidation.parserId ||
      schemaValidation.serializerId !== businessValidation.serializerId
    ) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_INCOHERENT_SCHEMA_VALIDATION",
        message:
          "schema validation knowledgeId/layoutId/parserId/serializerId does not match business validation",
      };
    }

    const canonical = this.canonicalize(businessValidation);
    this.store.set(canonical.businessValidationId, canonical);

    return {
      ok: true,
      code: "TISS_BUSINESS_VALIDATION_REGISTERED",
      message: "business validation registered",
      businessValidationId: canonical.businessValidationId,
      businessValidation: canonical,
    };
  }

  get(businessValidationId: string): CanonicalTissBusinessValidation | null {
    return this.store.get(businessValidationId) ?? null;
  }

  list(tag?: string): CanonicalTissBusinessValidation[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((b) => b.tags?.includes(tag));
  }

  stats(): GetTissBusinessValidationStatsResult["stats"] {
    const all = this.list();
    const byTag: Record<string, number> = {};

    for (const b of all) {
      for (const t of b.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      businessValidationIds: all.map((b) => b.businessValidationId),
    };
  }

  listResult(tag?: string): ListTissBusinessValidationsResult {
    return {
      ok: true,
      code: "TISS_BUSINESS_VALIDATION_LIST_OK",
      message: "business validations listed",
      businessValidations: this.list(tag),
    };
  }

  statsResult(): GetTissBusinessValidationStatsResult {
    return {
      ok: true,
      code: "TISS_BUSINESS_VALIDATION_STATS_OK",
      message: "business validation stats computed",
      stats: this.stats(),
    };
  }

  validate(input: ValidateTissBusinessInput): ValidateTissBusinessResult {
    const { businessValidationId, document, facts } = input;
    const businessValidation = this.get(businessValidationId);

    if (!businessValidation) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_NOT_FOUND",
        message: "business validation not found",
        details: [],
      };
    }

    const schemaResult = this.schemaValidation.validate({
      schemaValidationId: businessValidation.schemaValidationId,
      document,
    });

    if (!schemaResult.ok) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_SCHEMA_FAILED",
        message: schemaResult.message,
        details: ["schema validation failed"],
      };
    }

    const parseResult = this.parser.parse({
      parserId: businessValidation.parserId,
      document,
    });

    if (!parseResult.ok || !parseResult.result) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_PARSE_FAILED",
        message: parseResult.message ?? "parse failed",
        details: ["document could not be parsed"],
      };
    }

    const details: string[] = [];

    if (parseResult.result.knowledgeId !== businessValidation.knowledgeId) {
      details.push("document knowledgeId does not match business validation");
    }

    if (parseResult.result.layoutId !== businessValidation.layoutId) {
      details.push("document layoutId does not match business validation");
    }

    if (facts[businessValidation.rule.field] !== businessValidation.rule.expectedValue) {
      details.push(
        `business rule not satisfied: expected ${businessValidation.rule.field} = ${businessValidation.rule.expectedValue}, got ${facts[businessValidation.rule.field] ?? "undefined"}`,
      );
    }

    if (details.length > 0) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_FAILED",
        message: "business validation failed",
        details,
      };
    }

    return {
      ok: true,
      code: "TISS_BUSINESS_VALIDATION_OK",
      message: "business validation passed",
      details: ["schema, identifiers and business rule are consistent"],
    };
  }
}
