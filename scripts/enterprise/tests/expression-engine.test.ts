#!/usr/bin/env node
/**
 * EPC-06B — Rule Expression Engine
 * Prova Parser → AST → Context → Runtime → Evaluator sem tocar produto.
 * Sem regras clínicas / TISS / contratos / OCR / IA.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXPRESSION_REGISTRY,
  EXPRESSION_FUNCTIONS,
  EXPRESSION_FUNCTION_CATALOG,
  EXPRESSION_OPERATORS,
  EXPRESSION_OPERATOR_CATALOG,
  ExpressionParseError,
  createEvaluationContext,
  createRulePort,
  evaluateAst,
  evaluateExpression,
  evaluateRule,
  isKnownExpressionFunction,
  isKnownExpressionOperator,
  listExpressionFunctions,
  listExpressionOperators,
  parseExpression,
  type RuleDefinition,
} from "../../../src/lib/enterprise/rule/index.ts";

function sampleRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: "rule-expr",
    name: "GenericExpressionRule",
    namespace: "enterprise.core",
    status: "enabled",
    version: "1",
    priority: "medium",
    severity: "info",
    category: "foundation",
    conditions: [
      {
        id: "c1",
        field: "status",
        operator: "equals",
        value: "active",
      },
    ],
    actions: [{ kind: "continue", name: "continue-generic" }],
    ...overrides,
  };
}

describe("EPC-06B Expression Parser + AST", () => {
  it("parseia literais, paths e comparações em AST", () => {
    const parsed = parseExpression('status == "active"');
    assert.equal(parsed.ast.kind, "binary");
    if (parsed.ast.kind !== "binary") return;
    assert.equal(parsed.ast.op, "==");
    assert.equal(parsed.ast.left.kind, "path");
    assert.equal(parsed.ast.right.kind, "literal");
  });

  it("parseia AND / OR / NOT / IN / EXISTS / ISNULL / REGEX", () => {
    const expr =
      'EXISTS user.id AND NOT ISNULL user.name AND status IN ["a","b"] OR code REGEX "^X"';
    const parsed = parseExpression(expr);
    assert.equal(parsed.ast.kind, "binary");
    assert.equal(parsed.source.includes("EXISTS"), true);
  });

  it("parseia chamadas de função", () => {
    const parsed = parseExpression('startsWith(name, "A") AND length(name) > 0');
    assert.equal(parsed.ast.kind, "binary");
  });

  it("falha em expressão vazia ou inválida", () => {
    assert.throws(() => parseExpression("   "), ExpressionParseError);
    assert.throws(() => parseExpression("status =="), /ExpressionParseError/);
  });
});

describe("EPC-06B Evaluation Context + Runtime", () => {
  it("avalia expressões genéricas sem domínio", () => {
    const ctx = createEvaluationContext({
      status: "active",
      amount: 10,
      user: { id: "u1", name: "Ada" },
      tags: ["a", "b"],
    });

    assert.equal(evaluateAst(parseExpression('status == "active"').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression("amount >= 10").ast, ctx), true);
    assert.equal(evaluateAst(parseExpression("amount < 5").ast, ctx), false);
    assert.equal(evaluateAst(parseExpression("EXISTS user.id").ast, ctx), true);
    assert.equal(evaluateAst(parseExpression("ISNULL user.missing").ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('status IN ["active","pending"]').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('user.name REGEX "^A"').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('status == "active" AND amount > 0').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('status == "x" OR amount == 10').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('NOT status == "x"').ast, ctx), true);
  });

  it("avalia funções nativas", () => {
    const fixed = new Date("2026-07-31T12:00:00.000Z");
    const ctx = createEvaluationContext({ name: "MedicFlow", items: [1, 2, 3] }, { now: fixed });

    assert.equal(evaluateAst(parseExpression("length(name)").ast, ctx), 9);
    assert.equal(evaluateAst(parseExpression("length(items)").ast, ctx), 3);
    assert.equal(evaluateAst(parseExpression('contains(name, "Flow")').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('startsWith(name, "Med")').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('endsWith(name, "Flow")').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression('matches(name, "^Med")').ast, ctx), true);
    assert.equal(evaluateAst(parseExpression("today()").ast, ctx), "2026-07-31");
    assert.equal(evaluateAst(parseExpression("now()").ast, ctx), "2026-07-31T12:00:00.000Z");
  });
});

describe("EPC-06B Expression Registry", () => {
  it("registra operadores mínimos obrigatórios", () => {
    assert.equal(EXPRESSION_OPERATORS.length, 13);
    assert.equal(EXPRESSION_OPERATOR_CATALOG.length, 13);
    assert.equal(listExpressionOperators().length, 13);
    for (const id of [
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
      "AND",
      "OR",
      "NOT",
      "IN",
      "EXISTS",
      "REGEX",
      "ISNULL",
    ]) {
      assert.equal(isKnownExpressionOperator(id), true);
    }
    assert.equal(isKnownExpressionOperator("clinicalGlosa"), false);
    assert.equal(DEFAULT_EXPRESSION_REGISTRY.hasOperator("AND"), true);
  });

  it("registra funções nativas genéricas", () => {
    assert.equal(EXPRESSION_FUNCTIONS.length, 7);
    assert.equal(EXPRESSION_FUNCTION_CATALOG.length, 7);
    assert.equal(listExpressionFunctions().length, 7);
    for (const id of ["length", "contains", "startsWith", "endsWith", "matches", "today", "now"]) {
      assert.equal(isKnownExpressionFunction(id), true);
    }
    assert.equal(isKnownExpressionFunction("tissValidate"), false);
    assert.equal(DEFAULT_EXPRESSION_REGISTRY.hasFunction("length"), true);
  });
});

describe("EPC-06B Rule Evaluator", () => {
  it("avalia Rule + Context sem banco/API", () => {
    const rule = sampleRule();
    const pass = evaluateRule(rule, { status: "active" });
    assert.equal(pass.outcome, "pass");
    assert.equal(pass.ruleId, "rule-expr");
    assert.ok(pass.suggestedActions);

    const fail = evaluateRule(rule, { status: "inactive" });
    assert.equal(fail.outcome, "fail");
  });

  it("avalia operator expression via linguagem", () => {
    const rule = sampleRule({
      conditions: [
        {
          id: "c-expr",
          operator: "expression",
          value: 'amount >= 100 AND startsWith(code, "A")',
        },
      ],
    });
    const pass = evaluateRule(rule, { amount: 150, code: "A-1" });
    assert.equal(pass.outcome, "pass");
    const fail = evaluateRule(rule, { amount: 10, code: "A-1" });
    assert.equal(fail.outcome, "fail");
  });

  it("evaluateExpression retorna parse_error em sintaxe inválida", () => {
    const result = evaluateExpression({
      expression: "amount >=",
      context: createEvaluationContext({ amount: 1 }),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "parse_error");
  });

  it("pula rules disabled/archived", () => {
    const skipped = evaluateRule(sampleRule({ status: "disabled" }), { status: "active" });
    assert.equal(skipped.outcome, "skipped");
  });

  it("não conhece domínio clínico/contratual e RulePort permanece sem evaluate", () => {
    const source = ["clinical", "tiss", "contrato", "operadora", "glosa", "ocr"].join("|");
    const banned = new RegExp(source, "i");
    for (const op of EXPRESSION_OPERATORS) {
      assert.equal(banned.test(op), false);
    }
    for (const fn of EXPRESSION_FUNCTIONS) {
      assert.equal(banned.test(fn), false);
    }

    const port = createRulePort({ provider: "mock" }) as unknown as Record<string, unknown>;
    assert.equal(typeof port.evaluate, "undefined");
    assert.equal(typeof port.evaluateRule, "undefined");
    assert.equal(typeof port.parse, "undefined");
    assert.equal(port.capabilities && typeof port.capabilities === "function", true);
    const caps = createRulePort({ provider: "mock" }).capabilities();
    assert.equal(caps.supportsEvaluation, false);
  });
});
