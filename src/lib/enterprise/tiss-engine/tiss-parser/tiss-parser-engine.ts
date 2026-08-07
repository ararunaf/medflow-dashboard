/**
 * TissParserEngine — G-03.
 *
 * Responsável por registrar parsers, validar compatibilidade de
 * knowledge + layout e converter documentos TISS em representação canônica.
 *
 * Não valida XSD, regras de negócio, operadoras, reparo ou correção.
 * Não acessa banco.
 * Reutiliza TissKnowledgeEngine e TissLayoutEngine.
 */
import type {
  CanonicalTissParser,
  CanonicalTissParseResult,
  GetTissParserStatsResult,
  ListTissParsersResult,
  ParseTissInput,
  ParseTissResult,
  RegisterTissParserInput,
  RegisterTissParserResult,
} from "../ports";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";

export class TissParserEngine {
  private readonly store = new Map<string, CanonicalTissParser>();

  constructor(
    private readonly knowledge: TissKnowledgeEngine,
    private readonly layout: TissLayoutEngine,
  ) {}

  private canonicalize(parser: CanonicalTissParser): CanonicalTissParser {
    return {
      kind: "tiss-parser",
      parserId: parser.parserId,
      name: parser.name,
      knowledgeId: parser.knowledgeId,
      layoutId: parser.layoutId,
      description: parser.description ?? "",
      version: parser.version ?? "",
      tags: parser.tags ?? [],
    };
  }

  register(input: RegisterTissParserInput): RegisterTissParserResult {
    const { parser } = input;

    if (!parser.parserId || parser.parserId.trim() === "") {
      return {
        ok: false,
        code: "TISS_PARSER_MISSING_ID",
        message: "parserId is required",
      };
    }

    if (!parser.name || parser.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_PARSER_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!parser.knowledgeId || parser.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_PARSER_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    if (!parser.layoutId || parser.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_PARSER_MISSING_LAYOUT_ID",
        message: "layoutId is required",
      };
    }

    if (!this.knowledge.get(parser.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_PARSER_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not found",
      };
    }

    if (!this.layout.get(parser.layoutId)) {
      return {
        ok: false,
        code: "TISS_PARSER_UNKNOWN_LAYOUT",
        message: "layoutId not found",
      };
    }

    const canonical = this.canonicalize(parser);
    this.store.set(canonical.parserId, canonical);

    return {
      ok: true,
      code: "TISS_PARSER_REGISTERED",
      message: "parser registered",
      parserId: canonical.parserId,
      parser: canonical,
    };
  }

  get(parserId: string): CanonicalTissParser | null {
    return this.store.get(parserId) ?? null;
  }

  list(tag?: string): CanonicalTissParser[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((p) => p.tags?.includes(tag));
  }

  stats(): GetTissParserStatsResult["stats"] {
    const all = this.list();
    const byTag: Record<string, number> = {};

    for (const p of all) {
      for (const t of p.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      parserIds: all.map((p) => p.parserId),
    };
  }

  listResult(tag?: string): ListTissParsersResult {
    return {
      ok: true,
      code: "TISS_PARSER_LIST_OK",
      message: "parsers listed",
      parsers: this.list(tag),
    };
  }

  statsResult(): GetTissParserStatsResult {
    return {
      ok: true,
      code: "TISS_PARSER_STATS_OK",
      message: "parser stats computed",
      stats: this.stats(),
    };
  }

  parse(input: ParseTissInput): ParseTissResult {
    const { parserId, document } = input;
    const parser = this.get(parserId);

    if (!parser) {
      return {
        ok: false,
        code: "TISS_PARSER_NOT_FOUND",
        message: "parser not found",
        result: null,
      };
    }

    if (!document || document.trim() === "") {
      return {
        ok: false,
        code: "TISS_PARSER_EMPTY_DOCUMENT",
        message: "document is required",
        result: null,
      };
    }

    if (!this.knowledge.get(parser.knowledgeId)) {
      return {
        ok: false,
        code: "TISS_PARSER_KNOWLEDGE_MISMATCH",
        message: "knowledge not found",
        result: null,
      };
    }

    if (!this.layout.get(parser.layoutId)) {
      return {
        ok: false,
        code: "TISS_PARSER_LAYOUT_MISMATCH",
        message: "layout not found",
        result: null,
      };
    }

    const parsed = this.toCanonical(document);

    return {
      ok: true,
      code: "TISS_PARSER_OK",
      message: "document parsed",
      result: {
        kind: "tiss-parse-result",
        parserId,
        knowledgeId: parser.knowledgeId,
        layoutId: parser.layoutId,
        root: parsed.root,
        elements: parsed.elements,
        raw: document,
      },
    };
  }

  private toCanonical(document: string): CanonicalTissParseResult {
    const trimmed = document.trim();
    const rootMatch = trimmed.match(/<([a-zA-Z_][\w:.-]*)([^>]*)>/);
    const root = rootMatch?.[1] ?? "";
    const attributes = this.extractAttributes(rootMatch?.[2] ?? "");
    const children: { tag: string; attributes: string; text: string }[] = [];
    const childRegex = /<([a-zA-Z_][\w:.-]*)([^>]*)>([^<]*)<\/\1>/g;
    let match;
    while ((match = childRegex.exec(trimmed)) !== null) {
      children.push({
        tag: match[1],
        attributes: JSON.stringify(this.extractAttributes(match[2])),
        text: match[3].trim(),
      });
    }

    return {
      kind: "tiss-parse-result",
      parserId: "",
      knowledgeId: "",
      layoutId: "",
      root,
      elements: [
        {
          tag: root,
          attributes: JSON.stringify(attributes),
          children,
        },
      ],
      raw: document,
    };
  }

  private extractAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /([a-zA-Z_][\w:.-]*)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  }
}
