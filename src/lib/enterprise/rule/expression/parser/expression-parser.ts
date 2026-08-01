/**
 * Expression Parser — EPC-06B FASE 1.
 *
 * Transforma uma expressão textual em AST.
 * Sem conhecimento de domínio clínico, TISS, contratos, OCR ou IA.
 *
 * Gramática (resumo):
 *   expression := orExpr
 *   orExpr     := andExpr (OR andExpr)*
 *   andExpr    := notExpr (AND notExpr)*
 *   notExpr    := NOT notExpr | comparison
 *   comparison := EXISTS primary | ISNULL primary
 *               | primary ( (==|!=|>|>=|<|<=|IN|REGEX) primary )?
 *   primary    := literal | path | call | array | "(" expression ")"
 */

import type { AstNode, ExpressionBinaryOperator, ParsedExpression } from "../ast/types";

/* ─────────────────────────────────────────────────────────────────────────
 * Tokens
 * ───────────────────────────────────────────────────────────────────────── */

type TokenKind =
  | "number"
  | "string"
  | "ident"
  | "true"
  | "false"
  | "null"
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "AND"
  | "OR"
  | "NOT"
  | "IN"
  | "EXISTS"
  | "REGEX"
  | "ISNULL"
  | "("
  | ")"
  | "["
  | "]"
  | ","
  | "."
  | "eof";

type Token = {
  kind: TokenKind;
  value?: string | number;
  index: number;
};

const KEYWORDS: Readonly<Record<string, TokenKind>> = {
  true: "true",
  false: "false",
  null: "null",
  and: "AND",
  or: "OR",
  not: "NOT",
  in: "IN",
  exists: "EXISTS",
  regex: "REGEX",
  isnull: "ISNULL",
};

export class ExpressionParseError extends Error {
  readonly index: number;

  constructor(message: string, index: number) {
    super(`ExpressionParseError at ${index}: ${message}`);
    this.name = "ExpressionParseError";
    this.index = index;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Lexer
 * ───────────────────────────────────────────────────────────────────────── */

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const peek = (offset = 0): string => source[i + offset] ?? "";
  const advance = (): string => source[i++] ?? "";

  while (i < source.length) {
    const ch = peek();

    if (/\s/.test(ch)) {
      advance();
      continue;
    }

    const start = i;

    if (ch === "=" && peek(1) === "=") {
      advance();
      advance();
      tokens.push({ kind: "==", index: start });
      continue;
    }
    if (ch === "!" && peek(1) === "=") {
      advance();
      advance();
      tokens.push({ kind: "!=", index: start });
      continue;
    }
    if (ch === ">" && peek(1) === "=") {
      advance();
      advance();
      tokens.push({ kind: ">=", index: start });
      continue;
    }
    if (ch === "<" && peek(1) === "=") {
      advance();
      advance();
      tokens.push({ kind: "<=", index: start });
      continue;
    }
    if (ch === ">") {
      advance();
      tokens.push({ kind: ">", index: start });
      continue;
    }
    if (ch === "<") {
      advance();
      tokens.push({ kind: "<", index: start });
      continue;
    }
    if (ch === "(" || ch === ")" || ch === "[" || ch === "]" || ch === "," || ch === ".") {
      advance();
      tokens.push({ kind: ch, index: start });
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = advance();
      let value = "";
      while (i < source.length && peek() !== quote) {
        if (peek() === "\\" && i + 1 < source.length) {
          advance();
          const escaped = advance();
          const map: Record<string, string> = {
            n: "\n",
            t: "\t",
            r: "\r",
            "\\": "\\",
            "'": "'",
            '"': '"',
          };
          value += map[escaped] ?? escaped;
        } else {
          value += advance();
        }
      }
      if (peek() !== quote) {
        throw new ExpressionParseError("string literal não terminada", start);
      }
      advance();
      tokens.push({ kind: "string", value, index: start });
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === "-" && /[0-9]/.test(peek(1)))) {
      let raw = advance();
      while (/[0-9]/.test(peek())) raw += advance();
      if (peek() === "." && /[0-9]/.test(peek(1))) {
        raw += advance();
        while (/[0-9]/.test(peek())) raw += advance();
      }
      tokens.push({ kind: "number", value: Number(raw), index: start });
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let raw = advance();
      while (/[A-Za-z0-9_]/.test(peek())) raw += advance();
      const lower = raw.toLowerCase();
      const keyword = KEYWORDS[lower];
      if (keyword) {
        tokens.push({ kind: keyword, index: start });
      } else {
        tokens.push({ kind: "ident", value: raw, index: start });
      }
      continue;
    }

    throw new ExpressionParseError(`caractere inesperado '${ch}'`, start);
  }

  tokens.push({ kind: "eof", index: i });
  return tokens;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Parser
 * ───────────────────────────────────────────────────────────────────────── */

class Parser {
  private readonly tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AstNode {
    const node = this.parseOr();
    this.expect("eof");
    return node;
  }

  private current(): Token {
    return this.tokens[this.pos] ?? { kind: "eof", index: -1 };
  }

  private match(...kinds: TokenKind[]): Token | undefined {
    const cur = this.current();
    if (kinds.includes(cur.kind)) {
      this.pos += 1;
      return cur;
    }
    return undefined;
  }

  private expect(kind: TokenKind): Token {
    const cur = this.current();
    if (cur.kind !== kind) {
      throw new ExpressionParseError(`esperado '${kind}', encontrado '${cur.kind}'`, cur.index);
    }
    this.pos += 1;
    return cur;
  }

  private parseOr(): AstNode {
    let left = this.parseAnd();
    while (this.match("OR")) {
      const right = this.parseAnd();
      left = { kind: "binary", op: "OR", left, right };
    }
    return left;
  }

  private parseAnd(): AstNode {
    let left = this.parseNot();
    while (this.match("AND")) {
      const right = this.parseNot();
      left = { kind: "binary", op: "AND", left, right };
    }
    return left;
  }

  private parseNot(): AstNode {
    if (this.match("NOT")) {
      return { kind: "unary", op: "NOT", argument: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): AstNode {
    if (this.match("EXISTS")) {
      return { kind: "unary", op: "EXISTS", argument: this.parsePrimary() };
    }
    if (this.match("ISNULL")) {
      return { kind: "unary", op: "ISNULL", argument: this.parsePrimary() };
    }

    const left = this.parsePrimary();
    const opToken = this.match("==", "!=", ">", ">=", "<", "<=", "IN", "REGEX");
    if (!opToken) return left;

    const right = this.parsePrimary();
    return {
      kind: "binary",
      op: opToken.kind as ExpressionBinaryOperator,
      left,
      right,
    };
  }

  private parsePrimary(): AstNode {
    const cur = this.current();

    if (this.match("number")) {
      return { kind: "literal", value: cur.value as number };
    }
    if (this.match("string")) {
      return { kind: "literal", value: String(cur.value ?? "") };
    }
    if (this.match("true")) {
      return { kind: "literal", value: true };
    }
    if (this.match("false")) {
      return { kind: "literal", value: false };
    }
    if (this.match("null")) {
      return { kind: "literal", value: null };
    }

    if (this.match("(")) {
      const expr = this.parseOr();
      this.expect(")");
      return expr;
    }

    if (this.match("[")) {
      const elements: AstNode[] = [];
      if (!this.match("]")) {
        do {
          elements.push(this.parseOr());
        } while (this.match(","));
        this.expect("]");
      }
      return { kind: "array", elements };
    }

    if (cur.kind === "ident") {
      const name = String(cur.value ?? "");
      this.pos += 1;

      if (this.match("(")) {
        const args: AstNode[] = [];
        if (!this.match(")")) {
          do {
            args.push(this.parseOr());
          } while (this.match(","));
          this.expect(")");
        }
        return { kind: "call", name, args };
      }

      const path = [name];
      while (this.match(".")) {
        const part = this.expect("ident");
        path.push(String(part.value ?? ""));
      }
      return { kind: "path", path };
    }

    throw new ExpressionParseError(`expressão inválida em '${cur.kind}'`, cur.index);
  }
}

/**
 * Faz o parse de uma expressão textual em AST.
 * @throws ExpressionParseError
 */
export function parseExpression(source: string): ParsedExpression {
  const trimmed = source.trim();
  if (!trimmed) {
    throw new ExpressionParseError("expressão vazia", 0);
  }
  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens);
  return { source: trimmed, ast: parser.parse() };
}
