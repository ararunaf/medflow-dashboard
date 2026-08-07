/**
 * TissSerializerEngine — G-04.
 *
 * Responsável por registrar serializers e serializar representação
 * canônica de documentos TISS em string XML.
 *
 * Não valida XSD, regras de negócio, operadoras, reparo ou correção.
 * Não acessa banco.
 * Reutiliza TissKnowledgeEngine, TissLayoutEngine e TissParserEngine.
 */
import type {
  CanonicalTissParseResult,
  CanonicalTissSerializer,
  GetTissSerializerStatsResult,
  ListTissSerializersResult,
  RegisterTissSerializerInput,
  RegisterTissSerializerResult,
  SerializeTissInput,
  SerializeTissResult,
} from "../ports";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissParserEngine } from "../tiss-parser";

export class TissSerializerEngine {
  private readonly store = new Map<string, CanonicalTissSerializer>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
    private readonly parser: TissParserEngine,
  ) {}

  private canonicalize(serializer: CanonicalTissSerializer): CanonicalTissSerializer {
    return {
      kind: "tiss-serializer",
      serializerId: serializer.serializerId,
      name: serializer.name,
      knowledgeId: serializer.knowledgeId,
      layoutId: serializer.layoutId,
      parserId: serializer.parserId,
      description: serializer.description ?? "",
      version: serializer.version ?? "",
      tags: serializer.tags ?? [],
    };
  }

  register(input: RegisterTissSerializerInput): RegisterTissSerializerResult {
    const { serializer } = input;

    if (!serializer.serializerId || serializer.serializerId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SERIALIZER_MISSING_ID",
        message: "serializerId is required",
      };
    }

    if (!serializer.name || serializer.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_SERIALIZER_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!serializer.knowledgeId || serializer.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SERIALIZER_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!serializer.layoutId || serializer.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SERIALIZER_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!serializer.parserId || serializer.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_SERIALIZER_MISSING_PARSER_ID",
        message: "parserId is required",
      };
    }

    if (!this.knowledge.get(serializer.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(serializer.layoutId)) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const parser = this.parser.get(serializer.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_UNKNOWN_PARSER",
        message: "parserId not found",
      };
    }

    if (parser.knowledgeId !== serializer.knowledgeId || parser.layoutId !== serializer.layoutId) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_INCOHERENT_PARSER",
        message: "parser knowledgeId/layoutId does not match serializer",
      };
    }

    const canonical = this.canonicalize(serializer);
    this.store.set(canonical.serializerId, canonical);

    return {
      ok: true,
      code: "TISS_SERIALIZER_REGISTERED",
      message: "serializer registered",
      serializerId: canonical.serializerId,
      serializer: canonical,
    };
  }

  get(serializerId: string): CanonicalTissSerializer | null {
    return this.store.get(serializerId) ?? null;
  }

  list(tag?: string): CanonicalTissSerializer[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((s) => s.tags?.includes(tag));
  }

  stats(): GetTissSerializerStatsResult["stats"] {
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
      serializerIds: all.map((s) => s.serializerId),
    };
  }

  listResult(tag?: string): ListTissSerializersResult {
    return {
      ok: true,
      code: "TISS_SERIALIZER_LIST_OK",
      message: "serializers listed",
      serializers: this.list(tag),
    };
  }

  statsResult(): GetTissSerializerStatsResult {
    return {
      ok: true,
      code: "TISS_SERIALIZER_STATS_OK",
      message: "serializer stats computed",
      stats: this.stats(),
    };
  }

  serialize(input: SerializeTissInput): SerializeTissResult {
    const { serializerId, result } = input;
    const serializer = this.get(serializerId);

    if (!serializer) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_NOT_FOUND",
        message: "serializer not found",
        document: null,
      };
    }

    if (
      result.knowledgeId !== serializer.knowledgeId ||
      result.layoutId !== serializer.layoutId ||
      result.parserId !== serializer.parserId
    ) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_INCOHERENT_RESULT",
        message: "result knowledgeId/layoutId/parserId does not match serializer",
        document: null,
      };
    }

    const document = this.toXml(result);

    return {
      ok: true,
      code: "TISS_SERIALIZER_OK",
      message: "document serialized",
      document,
    };
  }

  private toXml(result: CanonicalTissParseResult): string {
    const rootElement = result.elements[0];
    if (!rootElement) return `<?xml version="1.0" encoding="UTF-8"?>\n<${result.root} />`;

    const attrString = this.renderAttributes(rootElement.attributes);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${result.root}${attrString}>`;

    for (const child of rootElement.children) {
      const childAttrs = this.renderAttributes(child.attributes);
      xml += `\n  <${child.tag}${childAttrs}>${this.escapeXml(child.text)}</${child.tag}>`;
    }

    xml += `\n</${result.root}>`;
    return xml;
  }

  private renderAttributes(attributes: string): string {
    const attrs = JSON.parse(attributes || "{}") as Record<string, string>;
    const entries = Object.entries(attrs);
    if (entries.length === 0) return "";
    return " " + entries.map(([key, value]) => `${key}="${this.escapeXml(value)}"`).join(" ");
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
