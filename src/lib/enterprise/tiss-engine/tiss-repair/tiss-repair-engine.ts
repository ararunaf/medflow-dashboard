/**
 * TissRepairEngine — G-08.
 *
 * Responsável por registrar e executar estratégias genéricas de reparo
 * de inconsistências TISS.
 *
 * Não valida regras de negócio ou operadoras, não corrige e não serializa.
 * Não conhece domínio específico da aplicação.
 * Reutiliza TissKnowledgeEngine, TissLayoutEngine, TissParserEngine,
 * TissSerializerEngine, TissSchemaValidationEngine, TissBusinessValidationEngine
 * e TissOperatorValidationEngine.
 */
import type {
  CanonicalTissRepair,
  CanonicalTissRepairRule,
  GetTissRepairStatsResult,
  ListTissRepairsResult,
  RegisterTissRepairInput,
  RegisterTissRepairResult,
  RemoveTissRepairInput,
  RemoveTissRepairResult,
  RepairTissInput,
  RepairTissResult,
  UpdateTissRepairInput,
  UpdateTissRepairResult,
} from "../ports";
import { TissBusinessValidationEngine } from "../tiss-business-validation";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissOperatorValidationEngine } from "../tiss-operator-validation";
import { TissParserEngine } from "../tiss-parser";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";

export class TissRepairEngine {
  private readonly store = new Map<string, CanonicalTissRepair>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
    private readonly parser: TissParserEngine,
    private readonly serializer: TissSerializerEngine,
    private readonly schemaValidation: TissSchemaValidationEngine,
    private readonly businessValidation: TissBusinessValidationEngine,
    private readonly operatorValidation: TissOperatorValidationEngine,
  ) {}

  private canonicalize(repair: CanonicalTissRepair): CanonicalTissRepair {
    return {
      kind: "tiss-repair",
      repairId: repair.repairId,
      name: repair.name,
      knowledgeId: repair.knowledgeId,
      layoutId: repair.layoutId,
      parserId: repair.parserId,
      serializerId: repair.serializerId,
      schemaValidationId: repair.schemaValidationId,
      businessValidationId: repair.businessValidationId,
      operatorValidationId: repair.operatorValidationId,
      rule: repair.rule,
      description: repair.description ?? "",
      version: repair.version ?? "",
      tags: repair.tags ?? [],
    };
  }

  private applyStrategy(document: string, rule: CanonicalTissRepairRule): string {
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

    if (type === "remove-empty-elements") {
      return document.replace(/<([a-zA-Z_][\w:.-]*)\s*\/>/g, "");
    }

    return document;
  }

  register(input: RegisterTissRepairInput): RegisterTissRepairResult {
    const { repair } = input;

    if (!repair.repairId || repair.repairId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_ID",
        message: "repairId is required",
      };
    }

    if (!repair.name || repair.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!repair.knowledgeId || repair.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!repair.layoutId || repair.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!repair.parserId || repair.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_PARSER_ID",
        message: "parserId is required",
      };
    }

    if (!repair.serializerId || repair.serializerId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_SERIALIZER_ID",
        message: "serializerId is required",
      };
    }

    if (!repair.schemaValidationId || repair.schemaValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_SCHEMA_VALIDATION_ID",
        message: "schemaValidationId is required",
      };
    }

    if (!repair.businessValidationId || repair.businessValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_BUSINESS_VALIDATION_ID",
        message: "businessValidationId is required",
      };
    }

    if (!repair.operatorValidationId || repair.operatorValidationId.trim() === "") {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_OPERATOR_VALIDATION_ID",
        message: "operatorValidationId is required",
      };
    }

    if (!repair.rule) {
      return {
        ok: false,
        code: "TISS_REPAIR_MISSING_RULE",
        message: "rule is required",
      };
    }

    if (!this.knowledge.get(repair.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(repair.layoutId)) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const parser = this.parser.get(repair.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_PARSER",
        message: "parserId not found",
      };
    }

    if (parser.knowledgeId !== repair.knowledgeId || parser.layoutId !== repair.layoutId) {
      return {
        ok: false,
        code: "TISS_REPAIR_INCOHERENT_PARSER",
        message: "parser knowledgeId/layoutId does not match repair",
      };
    }

    const serializer = this.serializer.get(repair.serializerId);
    if (!serializer) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_SERIALIZER",
        message: "serializerId not found",
      };
    }

    if (
      serializer.knowledgeId !== repair.knowledgeId ||
      serializer.layoutId !== repair.layoutId ||
      serializer.parserId !== repair.parserId
    ) {
      return {
        ok: false,
        code: "TISS_REPAIR_INCOHERENT_SERIALIZER",
        message: "serializer knowledgeId/layoutId/parserId does not match repair",
      };
    }

    const schemaValidation = this.schemaValidation.get(repair.schemaValidationId);
    if (!schemaValidation) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_SCHEMA_VALIDATION",
        message: "schemaValidationId not found",
      };
    }

    if (
      schemaValidation.knowledgeId !== repair.knowledgeId ||
      schemaValidation.layoutId !== repair.layoutId ||
      schemaValidation.parserId !== repair.parserId ||
      schemaValidation.serializerId !== repair.serializerId
    ) {
      return {
        ok: false,
        code: "TISS_REPAIR_INCOHERENT_SCHEMA_VALIDATION",
        message:
          "schema validation knowledgeId/layoutId/parserId/serializerId does not match repair",
      };
    }

    const businessValidation = this.businessValidation.get(repair.businessValidationId);
    if (!businessValidation) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_BUSINESS_VALIDATION",
        message: "businessValidationId not found",
      };
    }

    if (
      businessValidation.knowledgeId !== repair.knowledgeId ||
      businessValidation.layoutId !== repair.layoutId ||
      businessValidation.parserId !== repair.parserId ||
      businessValidation.serializerId !== repair.serializerId ||
      businessValidation.schemaValidationId !== repair.schemaValidationId
    ) {
      return {
        ok: false,
        code: "TISS_REPAIR_INCOHERENT_BUSINESS_VALIDATION",
        message:
          "business validation knowledgeId/layoutId/parserId/serializerId/schemaValidationId does not match repair",
      };
    }

    const operatorValidation = this.operatorValidation.get(repair.operatorValidationId);
    if (!operatorValidation) {
      return {
        ok: false,
        code: "TISS_REPAIR_UNKNOWN_OPERATOR_VALIDATION",
        message: "operatorValidationId not found",
      };
    }

    if (
      operatorValidation.knowledgeId !== repair.knowledgeId ||
      operatorValidation.layoutId !== repair.layoutId ||
      operatorValidation.parserId !== repair.parserId ||
      operatorValidation.serializerId !== repair.serializerId ||
      operatorValidation.schemaValidationId !== repair.schemaValidationId ||
      operatorValidation.businessValidationId !== repair.businessValidationId
    ) {
      return {
        ok: false,
        code: "TISS_REPAIR_INCOHERENT_OPERATOR_VALIDATION",
        message:
          "operator validation knowledgeId/layoutId/parserId/serializerId/schemaValidationId/businessValidationId does not match repair",
      };
    }

    const canonical = this.canonicalize(repair);
    this.store.set(canonical.repairId, canonical);

    return {
      ok: true,
      code: "TISS_REPAIR_REGISTERED",
      message: "repair registered",
      repairId: canonical.repairId,
      repair: canonical,
    };
  }

  get(repairId: string): CanonicalTissRepair | null {
    return this.store.get(repairId) ?? null;
  }

  list(tag?: string): CanonicalTissRepair[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((r) => r.tags?.includes(tag));
  }

  stats(): GetTissRepairStatsResult["stats"] {
    const all = this.list();
    const byTag: Record<string, number> = {};

    for (const r of all) {
      for (const t of r.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      repairIds: all.map((r) => r.repairId),
    };
  }

  listResult(tag?: string): ListTissRepairsResult {
    return {
      ok: true,
      code: "TISS_REPAIR_LIST_OK",
      message: "repairs listed",
      repairs: this.list(tag),
    };
  }

  statsResult(): GetTissRepairStatsResult {
    return {
      ok: true,
      code: "TISS_REPAIR_STATS_OK",
      message: "repair stats computed",
      stats: this.stats(),
    };
  }

  repair(input: RepairTissInput): RepairTissResult {
    const { repairId, document } = input;
    const repair = this.get(repairId);

    if (!repair) {
      return {
        ok: false,
        code: "TISS_REPAIR_NOT_FOUND",
        message: "repair not found",
      };
    }

    const original = this.parser.parse({ parserId: repair.parserId, document });
    if (!original.ok) {
      return {
        ok: false,
        code: "TISS_REPAIR_PARSE_FAILED",
        message: original.message,
        document: null,
        details: ["document could not be parsed"],
      };
    }

    const repaired = this.applyStrategy(document, repair.rule);

    const verify = this.parser.parse({ parserId: repair.parserId, document: repaired });
    if (!verify.ok) {
      return {
        ok: false,
        code: "TISS_REPAIR_VERIFY_FAILED",
        message: verify.message,
        document: null,
        details: ["repaired document could not be parsed"],
      };
    }

    return {
      ok: true,
      code: "TISS_REPAIR_OK",
      message: "document repaired",
      document: repaired,
      details: ["repair strategy applied successfully"],
    };
  }

  update(input: UpdateTissRepairInput): UpdateTissRepairResult {
    const { repairId, repair } = input;
    const existing = this.get(repairId);

    if (!existing) {
      return {
        ok: false,
        code: "TISS_REPAIR_NOT_FOUND",
        message: "repair not found",
      };
    }

    const updated: CanonicalTissRepair = {
      ...existing,
      ...repair,
      kind: "tiss-repair",
      repairId: existing.repairId,
    };

    const result = this.register({ repair: updated });

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
      };
    }

    return {
      ok: true,
      code: "TISS_REPAIR_UPDATED",
      message: "repair updated",
      repair: result.repair,
    };
  }

  remove(input: RemoveTissRepairInput): RemoveTissRepairResult {
    const { repairId } = input;

    if (!this.store.has(repairId)) {
      return {
        ok: false,
        code: "TISS_REPAIR_NOT_FOUND",
        message: "repair not found",
      };
    }

    this.store.delete(repairId);

    return {
      ok: true,
      code: "TISS_REPAIR_REMOVED",
      message: "repair removed",
    };
  }
}
