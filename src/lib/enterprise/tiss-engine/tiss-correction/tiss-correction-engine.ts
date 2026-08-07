/**
 * TissCorrectionEngine — G-09.
 *
 * Responsável por registrar e executar estratégias genéricas de correção
 * de inconsistências TISS após validações e reparos.
 *
 * Não valida regras de negócio ou operadoras, não serializa.
 * Não conhece domínio específico da aplicação.
 * Reutiliza TissKnowledgeEngine, TissLayoutEngine, TissParserEngine,
 * TissSerializerEngine, TissSchemaValidationEngine, TissBusinessValidationEngine,
 * TissOperatorValidationEngine e TissRepairEngine.
 */
import type {
  CanonicalTissCorrection,
  CanonicalTissCorrectionRule,
  CorrectTissInput,
  CorrectTissResult,
  GetTissCorrectionStatsResult,
  ListTissCorrectionsResult,
  RegisterTissCorrectionInput,
  RegisterTissCorrectionResult,
  RemoveTissCorrectionInput,
  RemoveTissCorrectionResult,
  UpdateTissCorrectionInput,
  UpdateTissCorrectionResult,
} from "../ports";
import { TissBusinessValidationEngine } from "../tiss-business-validation";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissOperatorValidationEngine } from "../tiss-operator-validation";
import { TissParserEngine } from "../tiss-parser";
import { TissRepairEngine } from "../tiss-repair";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";

export class TissCorrectionEngine {
  private readonly store = new Map<string, CanonicalTissCorrection>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
    private readonly parser: TissParserEngine,
    private readonly serializer: TissSerializerEngine,
    private readonly schemaValidation: TissSchemaValidationEngine,
    private readonly businessValidation: TissBusinessValidationEngine,
    private readonly operatorValidation: TissOperatorValidationEngine,
    private readonly repair: TissRepairEngine,
  ) {}

  private canonicalize(correction: CanonicalTissCorrection): CanonicalTissCorrection {
    return {
      kind: "tiss-correction",
      correctionId: correction.correctionId,
      name: correction.name,
      knowledgeId: correction.knowledgeId,
      layoutId: correction.layoutId,
      parserId: correction.parserId,
      serializerId: correction.serializerId,
      schemaValidationId: correction.schemaValidationId,
      businessValidationId: correction.businessValidationId,
      operatorValidationId: correction.operatorValidationId,
      repairId: correction.repairId,
      rule: correction.rule,
      description: correction.description ?? "",
      version: correction.version ?? "",
      tags: correction.tags ?? [],
    };
  }

  private applyRule(document: string, rule: CanonicalTissCorrectionRule): string {
    const { type, options } = rule;

    if (type === "replace") {
      const find = options.find ?? "";
      const replace = options.replace ?? "";
      if (!find) return document;
      return document.split(find).join(replace);
    }

    if (type === "trim") {
      return document.trim();
    }

    if (type === "remove-whitespace") {
      return document.replace(/\s+/g, "");
    }

    if (type === "lowercase") {
      return document.toLowerCase();
    }

    if (type === "uppercase") {
      return document.toUpperCase();
    }

    if (type === "prefix") {
      return `${options.value ?? ""}${document}`;
    }

    if (type === "suffix") {
      return `${document}${options.value ?? ""}`;
    }

    return document;
  }

  register(input: RegisterTissCorrectionInput): RegisterTissCorrectionResult {
    const { correction } = input;

    if (!correction.correctionId || correction.correctionId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_ID",
        message: "correctionId is required",
      };
    }

    if (!correction.name || correction.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!correction.knowledgeId || correction.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!correction.layoutId || correction.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!correction.parserId || correction.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_PARSER_ID",
        message: "parserId is required",
      };
    }

    if (!correction.serializerId || correction.serializerId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_SERIALIZER_ID",
        message: "serializerId is required",
      };
    }

    if (!correction.schemaValidationId || correction.schemaValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_SCHEMA_VALIDATION_ID",
        message: "schemaValidationId is required",
      };
    }

    if (!correction.businessValidationId || correction.businessValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_BUSINESS_VALIDATION_ID",
        message: "businessValidationId is required",
      };
    }

    if (!correction.operatorValidationId || correction.operatorValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_OPERATOR_VALIDATION_ID",
        message: "operatorValidationId is required",
      };
    }

    if (!correction.repairId || correction.repairId.trim() === "") {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_REPAIR_ID",
        message: "repairId is required",
      };
    }

    if (!correction.rule) {
      return {
        ok: false,
        code: "TISS_CORRECTION_MISSING_RULE",
        message: "rule is required",
      };
    }

    if (!this.knowledge.get(correction.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(correction.layoutId)) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const parser = this.parser.get(correction.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_PARSER",
        message: "parserId not found",
      };
    }

    if (parser.knowledgeId !== correction.knowledgeId || parser.layoutId !== correction.layoutId) {
      return {
        ok: false,
        code: "TISS_CORRECTION_INCOHERENT_PARSER",
        message: "parser knowledgeId/layoutId does not match correction",
      };
    }

    const serializer = this.serializer.get(correction.serializerId);
    if (!serializer) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_SERIALIZER",
        message: "serializerId not found",
      };
    }

    if (
      serializer.knowledgeId !== correction.knowledgeId ||
      serializer.layoutId !== correction.layoutId ||
      serializer.parserId !== correction.parserId
    ) {
      return {
        ok: false,
        code: "TISS_CORRECTION_INCOHERENT_SERIALIZER",
        message: "serializer knowledgeId/layoutId/parserId does not match correction",
      };
    }

    const schemaValidation = this.schemaValidation.get(correction.schemaValidationId);
    if (!schemaValidation) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_SCHEMA_VALIDATION",
        message: "schemaValidationId not found",
      };
    }

    if (
      schemaValidation.knowledgeId !== correction.knowledgeId ||
      schemaValidation.layoutId !== correction.layoutId ||
      schemaValidation.parserId !== correction.parserId ||
      schemaValidation.serializerId !== correction.serializerId
    ) {
      return {
        ok: false,
        code: "TISS_CORRECTION_INCOHERENT_SCHEMA_VALIDATION",
        message:
          "schema validation knowledgeId/layoutId/parserId/serializerId does not match correction",
      };
    }

    const businessValidation = this.businessValidation.get(correction.businessValidationId);
    if (!businessValidation) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_BUSINESS_VALIDATION",
        message: "businessValidationId not found",
      };
    }

    if (
      businessValidation.knowledgeId !== correction.knowledgeId ||
      businessValidation.layoutId !== correction.layoutId ||
      businessValidation.parserId !== correction.parserId ||
      businessValidation.serializerId !== correction.serializerId ||
      businessValidation.schemaValidationId !== correction.schemaValidationId
    ) {
      return {
        ok: false,
        code: "TISS_CORRECTION_INCOHERENT_BUSINESS_VALIDATION",
        message:
          "business validation knowledgeId/layoutId/parserId/serializerId/schemaValidationId does not match correction",
      };
    }

    const operatorValidation = this.operatorValidation.get(correction.operatorValidationId);
    if (!operatorValidation) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_OPERATOR_VALIDATION",
        message: "operatorValidationId not found",
      };
    }

    if (
      operatorValidation.knowledgeId !== correction.knowledgeId ||
      operatorValidation.layoutId !== correction.layoutId ||
      operatorValidation.parserId !== correction.parserId ||
      operatorValidation.serializerId !== correction.serializerId ||
      operatorValidation.schemaValidationId !== correction.schemaValidationId ||
      operatorValidation.businessValidationId !== correction.businessValidationId
    ) {
      return {
        ok: false,
        code: "TISS_CORRECTION_INCOHERENT_OPERATOR_VALIDATION",
        message:
          "operator validation knowledgeId/layoutId/parserId/serializerId/schemaValidationId/businessValidationId does not match correction",
      };
    }

    const repair = this.repair.get(correction.repairId);
    if (!repair) {
      return {
        ok: false,
        code: "TISS_CORRECTION_UNKNOWN_REPAIR",
        message: "repairId not found",
      };
    }

    if (
      repair.knowledgeId !== correction.knowledgeId ||
      repair.layoutId !== correction.layoutId ||
      repair.parserId !== correction.parserId ||
      repair.serializerId !== correction.serializerId ||
      repair.schemaValidationId !== correction.schemaValidationId ||
      repair.businessValidationId !== correction.businessValidationId ||
      repair.operatorValidationId !== correction.operatorValidationId
    ) {
      return {
        ok: false,
        code: "TISS_CORRECTION_INCOHERENT_REPAIR",
        message:
          "repair knowledgeId/layoutId/parserId/serializerId/schemaValidationId/businessValidationId/operatorValidationId does not match correction",
      };
    }

    const canonical = this.canonicalize(correction);
    this.store.set(canonical.correctionId, canonical);

    return {
      ok: true,
      code: "TISS_CORRECTION_REGISTERED",
      message: "correction registered",
      correctionId: canonical.correctionId,
      correction: canonical,
    };
  }

  get(correctionId: string): CanonicalTissCorrection | null {
    return this.store.get(correctionId) ?? null;
  }

  list(tag?: string): CanonicalTissCorrection[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((c) => c.tags?.includes(tag));
  }

  stats(): GetTissCorrectionStatsResult["stats"] {
    const all = this.list();
    const byTag: Record<string, number> = {};

    for (const c of all) {
      for (const t of c.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      correctionIds: all.map((c) => c.correctionId),
    };
  }

  listResult(tag?: string): ListTissCorrectionsResult {
    return {
      ok: true,
      code: "TISS_CORRECTION_LIST_OK",
      message: "corrections listed",
      corrections: this.list(tag),
    };
  }

  statsResult(): GetTissCorrectionStatsResult {
    return {
      ok: true,
      code: "TISS_CORRECTION_STATS_OK",
      message: "correction stats computed",
      stats: this.stats(),
    };
  }

  correct(input: CorrectTissInput): CorrectTissResult {
    const { correctionId, document } = input;
    const correction = this.get(correctionId);

    if (!correction) {
      return {
        ok: false,
        code: "TISS_CORRECTION_NOT_FOUND",
        message: "correction not found",
      };
    }

    const repaired = this.repair.repair({
      repairId: correction.repairId,
      document,
    });

    if (!repaired.ok || !repaired.document) {
      return {
        ok: false,
        code: "TISS_CORRECTION_REPAIR_FAILED",
        message: repaired.message,
        document: null,
        details: repaired.details,
      };
    }

    const corrected = this.applyRule(repaired.document, correction.rule);

    const verify = this.parser.parse({
      parserId: correction.parserId,
      document: corrected,
    });
    if (!verify.ok) {
      return {
        ok: false,
        code: "TISS_CORRECTION_VERIFY_FAILED",
        message: verify.message,
        document: null,
        details: ["corrected document could not be parsed"],
      };
    }

    return {
      ok: true,
      code: "TISS_CORRECTION_OK",
      message: "document corrected",
      document: corrected,
      details: ["repair and correction rules applied successfully"],
    };
  }

  update(input: UpdateTissCorrectionInput): UpdateTissCorrectionResult {
    const { correctionId, correction } = input;
    const existing = this.get(correctionId);

    if (!existing) {
      return {
        ok: false,
        code: "TISS_CORRECTION_NOT_FOUND",
        message: "correction not found",
      };
    }

    const updated: CanonicalTissCorrection = {
      ...existing,
      ...correction,
      kind: "tiss-correction",
      correctionId: existing.correctionId,
    };

    const result = this.register({ correction: updated });

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }

    return {
      ok: true,
      code: "TISS_CORRECTION_UPDATED",
      message: "correction updated",
      correction: result.correction,
    };
  }

  remove(input: RemoveTissCorrectionInput): RemoveTissCorrectionResult {
    const { correctionId } = input;

    if (!this.store.has(correctionId)) {
      return {
        ok: false,
        code: "TISS_CORRECTION_NOT_FOUND",
        message: "correction not found",
      };
    }

    this.store.delete(correctionId);

    return {
      ok: true,
      code: "TISS_CORRECTION_REMOVED",
      message: "correction removed",
    };
  }
}
