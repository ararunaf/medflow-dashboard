/**
 * Expression Registry — EPC-06B FASE 6.
 *
 * Registra operadores e funções suportadas.
 * Ainda sem regras clínicas / TISS / contratos.
 */

import {
  EXPRESSION_FUNCTION_CATALOG,
  getExpressionFunction,
  isKnownExpressionFunction,
  listExpressionFunctions,
  type ExpressionFunctionDescriptor,
  type ExpressionFunctionId,
} from "./functions";
import {
  EXPRESSION_OPERATOR_CATALOG,
  getExpressionOperator,
  isKnownExpressionOperator,
  listExpressionOperators,
  type ExpressionOperatorDescriptor,
  type ExpressionOperatorId,
} from "./operators";

export type ExpressionRegistry = {
  readonly operators: readonly ExpressionOperatorDescriptor[];
  readonly functions: readonly ExpressionFunctionDescriptor[];
  hasOperator(id: string): boolean;
  hasFunction(id: string): boolean;
  getOperator(id: ExpressionOperatorId): ExpressionOperatorDescriptor | undefined;
  getFunction(id: ExpressionFunctionId | string): ExpressionFunctionDescriptor | undefined;
};

/** Registry padrão imutável com operadores e funções mínimos. */
export function createExpressionRegistry(options?: {
  operators?: readonly ExpressionOperatorDescriptor[];
  functions?: readonly ExpressionFunctionDescriptor[];
}): ExpressionRegistry {
  const operators = options?.operators ?? EXPRESSION_OPERATOR_CATALOG;
  const functions = options?.functions ?? EXPRESSION_FUNCTION_CATALOG;

  return {
    operators,
    functions,
    hasOperator(id) {
      return operators.some((op) => op.id === id) || isKnownExpressionOperator(id);
    },
    hasFunction(id) {
      return (
        functions.some((fn) => fn.id === id || fn.name === id) || isKnownExpressionFunction(id)
      );
    },
    getOperator(id) {
      return operators.find((op) => op.id === id) ?? getExpressionOperator(id);
    },
    getFunction(id) {
      return functions.find((fn) => fn.id === id || fn.name === id) ?? getExpressionFunction(id);
    },
  };
}

/** Singleton do registry padrão (infraestrutura). */
export const DEFAULT_EXPRESSION_REGISTRY: ExpressionRegistry = createExpressionRegistry();

export function listRegisteredOperators(): readonly ExpressionOperatorDescriptor[] {
  return listExpressionOperators();
}

export function listRegisteredFunctions(): readonly ExpressionFunctionDescriptor[] {
  return listExpressionFunctions();
}
