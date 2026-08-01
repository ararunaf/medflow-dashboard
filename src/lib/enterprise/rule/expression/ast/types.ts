/**
 * AST (Abstract Syntax Tree) — EPC-06B FASE 2.
 *
 * Estrutura de nós genérica, sem conhecimento de domínio.
 * Sem regras clínicas, TISS, contratos, OCR ou IA.
 */

/** Operadores binários suportados pela linguagem de expressão. */
export type ExpressionBinaryOperator =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "AND"
  | "OR"
  | "IN"
  | "REGEX";

/** Operadores unários suportados pela linguagem de expressão. */
export type ExpressionUnaryOperator = "NOT" | "EXISTS" | "ISNULL";

/** Literal tipado estruturalmente (sem semântica de negócio). */
export type ExpressionLiteralValue = string | number | boolean | null;

/** Nó raiz / qualquer nó da AST. */
export type AstNode =
  | AstLiteralNode
  | AstPathNode
  | AstUnaryNode
  | AstBinaryNode
  | AstCallNode
  | AstArrayNode;

/** Literal: número, string, boolean ou null. */
export type AstLiteralNode = {
  kind: "literal";
  value: ExpressionLiteralValue;
};

/**
 * Caminho de dados no Evaluation Context.
 * Ex.: ["user", "age"] → context.data.user.age
 */
export type AstPathNode = {
  kind: "path";
  path: readonly string[];
};

/** Operação unária (NOT / EXISTS / ISNULL). */
export type AstUnaryNode = {
  kind: "unary";
  op: ExpressionUnaryOperator;
  argument: AstNode;
};

/** Operação binária (==, AND, IN, …). */
export type AstBinaryNode = {
  kind: "binary";
  op: ExpressionBinaryOperator;
  left: AstNode;
  right: AstNode;
};

/** Chamada de função nativa (length, contains, today, …). */
export type AstCallNode = {
  kind: "call";
  name: string;
  args: readonly AstNode[];
};

/** Array literal (ex.: para operador IN). */
export type AstArrayNode = {
  kind: "array";
  elements: readonly AstNode[];
};

/** Resultado do parse: AST + expressão fonte. */
export type ParsedExpression = {
  source: string;
  ast: AstNode;
};
