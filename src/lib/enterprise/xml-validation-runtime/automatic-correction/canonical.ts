/**
 * Contratos canônicos da Automatic Correction funcional — D-09 / BLOCO D.
 *
 * Correções automáticas genéricas sobre CanonicalXMLDocument (D-01).
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem correções específicas de negócio.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";

/** Regra genérica de correção automática. */
export type XMLAutomaticCorrectionRule =
  | {
      kind: "set-attribute";
      /** Elemento alvo: "root" para raiz. */
      target: "root";
      attribute: string;
      value: string;
    }
  | {
      kind: "set-child";
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

/** Ação executada durante a correção. */
export type XMLAutomaticCorrectionAction = {
  kind: "xml-automatic-correction-action";
  rule: XMLAutomaticCorrectionRule;
  applied: boolean;
  message?: string;
};

/**
 * Resultado canônico da Automatic Correction (D-09).
 */
export type CanonicalXMLAutomaticCorrectionResult = {
  kind: "canonical-xml-automatic-correction-result";
  ok: boolean;
  /** Documento corrigido (cópia). */
  document: CanonicalXMLDocument;
  /** Regras requisitadas. */
  rules: readonly XMLAutomaticCorrectionRule[];
  /** Ações efetivamente executadas. */
  actions: readonly XMLAutomaticCorrectionAction[];
  /** true quando pelo menos uma regra foi aplicada. */
  corrected: boolean;
  context?: CanonicalXMLAutomaticCorrectionContext | null;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido da Automatic Correction (D-09).
 */
export type CanonicalXMLAutomaticCorrectionContext = {
  kind: "canonical-xml-automatic-correction-context";
  document: CanonicalXMLDocument;
  rules: readonly XMLAutomaticCorrectionRule[];
  actions: readonly XMLAutomaticCorrectionAction[];
  validationWarnings: readonly string[];
  /** D-09 — única capability funcional habilitada neste contexto. */
  automaticCorrectionImplemented: true;
};

/** Helper — contexto vazio pós-correção. */
export function createEmptyXMLAutomaticCorrectionContext(
  overrides: Partial<CanonicalXMLAutomaticCorrectionContext> = {},
): CanonicalXMLAutomaticCorrectionContext {
  return {
    kind: "canonical-xml-automatic-correction-context",
    document: overrides.document ?? ({} as CanonicalXMLDocument),
    rules: overrides.rules ?? [],
    actions: overrides.actions ?? [],
    validationWarnings: overrides.validationWarnings ?? [],
    automaticCorrectionImplemented: true,
  };
}
