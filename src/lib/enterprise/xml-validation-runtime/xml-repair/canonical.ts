/**
 * Contratos canônicos do XML Repair funcional — D-08 / BLOCO D.
 *
 * Reparos genéricos sobre CanonicalXMLDocument (D-01).
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem correções específicas de negócio.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";

/** Regra genérica de reparo XML. */
export type XMLRepairRule =
  | {
      kind: "add-missing-attribute";
      /** Elemento alvo: "root" para raiz. */
      target: "root";
      attribute: string;
      value: string;
    }
  | {
      kind: "add-missing-child";
      /** Elemento alvo: "root" para raiz. */
      target: "root";
      child: string;
      value: string;
    }
  | {
      kind: "remove-attribute";
      /** Elemento alvo: "root" para raiz. */
      target: "root";
      attribute: string;
    };

/** Ação executada durante o reparo. */
export type XMLRepairAction = {
  kind: "xml-repair-action";
  rule: XMLRepairRule;
  applied: boolean;
  message?: string;
};

/**
 * Resultado canônico do XML Repair (D-08).
 */
export type CanonicalXMLRepairResult = {
  kind: "canonical-xml-repair-result";
  ok: boolean;
  /** Documento reparado (cópia). */
  document: CanonicalXMLDocument;
  /** Regras requisitadas. */
  rules: readonly XMLRepairRule[];
  /** Ações efetivamente executadas. */
  actions: readonly XMLRepairAction[];
  /** true quando pelo menos uma regra foi aplicada. */
  repaired: boolean;
  context?: CanonicalXMLRepairContext | null;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do XML Repair (D-08).
 */
export type CanonicalXMLRepairContext = {
  kind: "canonical-xml-repair-context";
  document: CanonicalXMLDocument;
  rules: readonly XMLRepairRule[];
  actions: readonly XMLRepairAction[];
  validationWarnings: readonly string[];
  /** D-08 — única capability funcional habilitada neste contexto. */
  xmlRepairImplemented: true;
};

/** Helper — contexto vazio pós-reparo. */
export function createEmptyXMLRepairContext(
  overrides: Partial<CanonicalXMLRepairContext> = {},
): CanonicalXMLRepairContext {
  return {
    kind: "canonical-xml-repair-context",
    document: overrides.document ?? ({} as CanonicalXMLDocument),
    rules: overrides.rules ?? [],
    actions: overrides.actions ?? [],
    validationWarnings: overrides.validationWarnings ?? [],
    xmlRepairImplemented: true,
  };
}
