/**
 * Regras default configuráveis — CLASS-01 (rule-based, sem IA).
 */
import type { DocumentClassificationRule } from "./types";

/** Catálogo default de regras documentais (configurável via input.rules). */
export const DEFAULT_DOCUMENT_CLASSIFICATION_RULES: readonly DocumentClassificationRule[] = [
  {
    id: "rule-guia-tiss",
    documentType: "guia-tiss",
    weight: 100,
    keywords: [
      "guia tiss",
      "tiss",
      "guia de consulta",
      "guia de sp/sadt",
      "guia de internacao",
      "ans",
      "numero da guia",
    ],
    description: "Guia TISS / ANS",
  },
  {
    id: "rule-solicitacao",
    documentType: "solicitacao",
    weight: 90,
    keywords: [
      "solicitacao",
      "solicitação",
      "pedido de exame",
      "requisicao",
      "requisição",
      "autorizacao previa",
      "autorização prévia",
    ],
    description: "Solicitação / pedido",
  },
  {
    id: "rule-prontuario",
    documentType: "prontuario",
    weight: 90,
    keywords: [
      "prontuario",
      "prontuário",
      "evolucao clinica",
      "evolução clínica",
      "historia clinica",
      "história clínica",
      "anamnese",
    ],
    description: "Prontuário clínico",
  },
  {
    id: "rule-laudo",
    documentType: "laudo",
    weight: 90,
    keywords: [
      "laudo",
      "laudo medico",
      "laudo médico",
      "resultado do exame",
      "conclusao diagnostica",
      "conclusão diagnóstica",
      "impressao diagnostica",
    ],
    description: "Laudo médico / diagnóstico",
  },
  {
    id: "rule-administrativo",
    documentType: "documento-administrativo",
    weight: 70,
    keywords: [
      "documento administrativo",
      "oficio",
      "ofício",
      "declaracao",
      "declaração",
      "ata de reuniao",
      "protocolo administrativo",
    ],
    description: "Documento administrativo",
  },
  {
    id: "rule-financeiro",
    documentType: "documento-financeiro",
    weight: 80,
    keywords: [
      "nota fiscal",
      "fatura",
      "recibo",
      "boleto",
      "pagamento",
      "cobranca",
      "cobrança",
      "demonstrativo financeiro",
      "valor total",
    ],
    description: "Documento financeiro",
  },
] as const;
