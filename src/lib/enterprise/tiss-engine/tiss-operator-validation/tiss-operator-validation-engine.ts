/**
 * TissOperatorValidationEngine — G-07.
 *
 * Responsável por registrar e executar validações de regras específicas de
 * operadoras sobre documentos TISS.
 *
 * Não valida schema XML, repara, corrige ou serializa XML.
 * Não conhece domínio específico da aplicação.
 * Reutiliza TissKnowledgeEngine, TissLayoutEngine, TissParserEngine,
 * TissSerializerEngine, TissSchemaValidationEngine e TissBusinessValidationEngine.
 */
import type {
  CanonicalTissOperatorValidation,
  GetTissOperatorValidationStatsResult,
  ListTissOperatorValidationsResult,
  RegisterTissOperatorValidationInput,
  RegisterTissOperatorValidationResult,
  RemoveTissOperatorValidationInput,
  RemoveTissOperatorValidationResult,
  UpdateTissOperatorValidationInput,
  UpdateTissOperatorValidationResult,
  ValidateTissOperatorInput,
  ValidateTissOperatorResult,
} from "../ports";
import { TissBusinessValidationEngine } from "../tiss-business-validation";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissParserEngine } from "../tiss-parser";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";

export class TissOperatorValidationEngine {
  private readonly store = new Map<string, CanonicalTissOperatorValidation>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
    private readonly parser: TissParserEngine,
    private readonly serializer: TissSerializerEngine,
    private readonly schemaValidation: TissSchemaValidationEngine,
    private readonly businessValidation: TissBusinessValidationEngine,
  ) {}

  private canonicalize(
    operatorValidation: CanonicalTissOperatorValidation,
  ): CanonicalTissOperatorValidation {
    return {
      kind: "tiss-operator-validation",
      operatorValidationId: operatorValidation.operatorValidationId,
      name: operatorValidation.name,
      knowledgeId: operatorValidation.knowledgeId,
      layoutId: operatorValidation.layoutId,
      parserId: operatorValidation.parserId,
      serializerId: operatorValidation.serializerId,
      schemaValidationId: operatorValidation.schemaValidationId,
      businessValidationId: operatorValidation.businessValidationId,
      operatorId: operatorValidation.operatorId,
      rule: operatorValidation.rule,
      description: operatorValidation.description ?? "",
      version: operatorValidation.version ?? "",
      tags: operatorValidation.tags ?? [],
    };
  }

  register(input: RegisterTissOperatorValidationInput): RegisterTissOperatorValidationResult {
    const { operatorValidation } = input;

    if (
      !operatorValidation.operatorValidationId ||
      operatorValidation.operatorValidationId.trim() === ""
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_ID",
        message: "operatorValidationId is required",
      };
    }

    if (!operatorValidation.name || operatorValidation.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!operatorValidation.knowledgeId || operatorValidation.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!operatorValidation.layoutId || operatorValidation.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!operatorValidation.parserId || operatorValidation.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_PARSER_ID",
        message: "parserId is required",
      };
    }

    if (!operatorValidation.serializerId || operatorValidation.serializerId.trim() === "") {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_SERIALIZER_ID",
        message: "serializerId is required",
      };
    }

    if (
      !operatorValidation.schemaValidationId ||
      operatorValidation.schemaValidationId.trim() === ""
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_SCHEMA_VALIDATION_ID",
        message: "schemaValidationId is required",
      };
    }

    if (
      !operatorValidation.businessValidationId ||
      operatorValidation.businessValidationId.trim() === ""
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_BUSINESS_VALIDATION_ID",
        message: "businessValidationId is required",
      };
    }

    if (!operatorValidation.operatorId || operatorValidation.operatorId.trim() === "") {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_OPERATOR_ID",
        message: "operatorId is required",
      };
    }

    if (!operatorValidation.rule) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_MISSING_RULE",
        message: "rule is required",
      };
    }

    if (!this.knowledge.get(operatorValidation.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(operatorValidation.layoutId)) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const parser = this.parser.get(operatorValidation.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_UNKNOWN_PARSER",
        message: "parserId not found",
      };
    }

    if (
      parser.knowledgeId !== operatorValidation.knowledgeId ||
      parser.layoutId !== operatorValidation.layoutId
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_INCOHERENT_PARSER",
        message: "parser knowledgeId/layoutId does not match operator validation",
      };
    }

    const serializer = this.serializer.get(operatorValidation.serializerId);
    if (!serializer) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_UNKNOWN_SERIALIZER",
        message: "serializerId not found",
      };
    }

    if (
      serializer.knowledgeId !== operatorValidation.knowledgeId ||
      serializer.layoutId !== operatorValidation.layoutId ||
      serializer.parserId !== operatorValidation.parserId
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_INCOHERENT_SERIALIZER",
        message: "serializer knowledgeId/layoutId/parserId does not match operator validation",
      };
    }

    const schemaValidation = this.schemaValidation.get(operatorValidation.schemaValidationId);
    if (!schemaValidation) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_UNKNOWN_SCHEMA_VALIDATION",
        message: "schemaValidationId not found",
      };
    }

    if (
      schemaValidation.knowledgeId !== operatorValidation.knowledgeId ||
      schemaValidation.layoutId !== operatorValidation.layoutId ||
      schemaValidation.parserId !== operatorValidation.parserId ||
      schemaValidation.serializerId !== operatorValidation.serializerId
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_INCOHERENT_SCHEMA_VALIDATION",
        message:
          "schema validation knowledgeId/layoutId/parserId/serializerId does not match operator validation",
      };
    }

    const businessValidation = this.businessValidation.get(operatorValidation.businessValidationId);
    if (!businessValidation) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_UNKNOWN_BUSINESS_VALIDATION",
        message: "businessValidationId not found",
      };
    }

    if (
      businessValidation.knowledgeId !== operatorValidation.knowledgeId ||
      businessValidation.layoutId !== operatorValidation.layoutId ||
      businessValidation.parserId !== operatorValidation.parserId ||
      businessValidation.serializerId !== operatorValidation.serializerId ||
      businessValidation.schemaValidationId !== operatorValidation.schemaValidationId
    ) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_INCOHERENT_BUSINESS_VALIDATION",
        message:
          "business validation knowledgeId/layoutId/parserId/serializerId/schemaValidationId does not match operator validation",
      };
    }

    const canonical = this.canonicalize(operatorValidation);
    this.store.set(canonical.operatorValidationId, canonical);

    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_REGISTERED",
      message: "operator validation registered",
      operatorValidationId: canonical.operatorValidationId,
      operatorValidation: canonical,
    };
  }

  get(operatorValidationId: string): CanonicalTissOperatorValidation | null {
    return this.store.get(operatorValidationId) ?? null;
  }

  list(tag?: string): CanonicalTissOperatorValidation[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((o) => o.tags?.includes(tag));
  }

  stats(): GetTissOperatorValidationStatsResult["stats"] {
    const all = this.list();
    const byTag: Record<string, number> = {};

    for (const o of all) {
      for (const t of o.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      operatorValidationIds: all.map((o) => o.operatorValidationId),
    };
  }

  listResult(tag?: string): ListTissOperatorValidationsResult {
    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_LIST_OK",
      message: "operator validations listed",
      operatorValidations: this.list(tag),
    };
  }

  statsResult(): GetTissOperatorValidationStatsResult {
    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_STATS_OK",
      message: "operator validation stats computed",
      stats: this.stats(),
    };
  }

  validate(input: ValidateTissOperatorInput): ValidateTissOperatorResult {
    const { operatorValidationId, document, operatorId, facts } = input;
    const operatorValidation = this.get(operatorValidationId);

    if (!operatorValidation) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_NOT_FOUND",
        message: "operator validation not found",
        details: [],
      };
    }

    if (operatorId !== operatorValidation.operatorId) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_OPERATOR_ID_MISMATCH",
        message: `operatorId does not match expected ${operatorValidation.operatorId}`,
        details: [`expected operatorId ${operatorValidation.operatorId}, got ${operatorId}`],
      };
    }

    const businessResult = this.businessValidation.validate({
      businessValidationId: operatorValidation.businessValidationId,
      document,
      facts,
    });

    if (!businessResult.ok) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_BUSINESS_FAILED",
        message: businessResult.message,
        details: businessResult.details,
      };
    }

    const details: string[] = [];

    if (facts[operatorValidation.rule.field] !== operatorValidation.rule.expectedValue) {
      details.push(
        `operator rule not satisfied: expected ${operatorValidation.rule.field} = ${operatorValidation.rule.expectedValue}, got ${facts[operatorValidation.rule.field] ?? "undefined"}`,
      );
    }

    if (details.length > 0) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_FAILED",
        message: "operator validation failed",
        details,
      };
    }

    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_OK",
      message: "operator validation passed",
      details: ["schema, business rule, operatorId and operator rule are consistent"],
    };
  }

  update(input: UpdateTissOperatorValidationInput): UpdateTissOperatorValidationResult {
    const { operatorValidationId, operatorValidation } = input;
    const existing = this.get(operatorValidationId);

    if (!existing) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_NOT_FOUND",
        message: "operator validation not found",
      };
    }

    const updated: CanonicalTissOperatorValidation = {
      ...existing,
      ...operatorValidation,
      kind: "tiss-operator-validation",
      operatorValidationId: existing.operatorValidationId,
    };

    const result = this.register({ operatorValidation: updated });

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }

    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_UPDATED",
      message: "operator validation updated",
      operatorValidation: result.operatorValidation,
    };
  }

  remove(input: RemoveTissOperatorValidationInput): RemoveTissOperatorValidationResult {
    const { operatorValidationId } = input;

    if (!this.store.has(operatorValidationId)) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_NOT_FOUND",
        message: "operator validation not found",
      };
    }

    this.store.delete(operatorValidationId);

    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_REMOVED",
      message: "operator validation removed",
    };
  }
}
