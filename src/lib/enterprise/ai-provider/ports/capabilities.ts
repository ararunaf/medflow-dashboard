/**
 * Capacidades genéricas de AI Providers — EPC-07.
 *
 * Nenhuma capacidade específica do MedicFlow, TISS, OCR clínico,
 * contratos, auditoria ou guias. Apenas primitives tecnológicas.
 */

export const AI_CAPABILITIES = [
  "text-generation",
  "structured-output",
  "vision",
  "document-analysis",
  "streaming",
  "embeddings",
  "tool-calling",
  "json-mode",
] as const;

export type AICapabilityId = (typeof AI_CAPABILITIES)[number];

export type AICapabilityDescriptor = {
  id: AICapabilityId;
  name: string;
  description: string;
};

export const AI_CAPABILITY_CATALOG: readonly AICapabilityDescriptor[] = [
  {
    id: "text-generation",
    name: "Text Generation",
    description: "Generate natural-language text from prompts or messages.",
  },
  {
    id: "structured-output",
    name: "Structured Output",
    description: "Produce structured payloads according to a generic schema hint.",
  },
  {
    id: "vision",
    name: "Vision",
    description: "Accept image inputs for generic multimodal inference.",
  },
  {
    id: "document-analysis",
    name: "Document Analysis",
    description: "Accept document-like inputs for generic analysis (not OCR product).",
  },
  {
    id: "streaming",
    name: "Streaming",
    description: "Stream partial tokens / chunks during generation.",
  },
  {
    id: "embeddings",
    name: "Embeddings",
    description: "Produce vector embeddings from text or other modalities.",
  },
  {
    id: "tool-calling",
    name: "Tool Calling",
    description: "Emit structured tool/function call intents.",
  },
  {
    id: "json-mode",
    name: "JSON Mode",
    description: "Constrain generation to JSON-compatible output.",
  },
] as const;

export function isKnownCapability(id: string): id is AICapabilityId {
  return (AI_CAPABILITIES as readonly string[]).includes(id);
}

export function getCapability(id: AICapabilityId): AICapabilityDescriptor | undefined {
  return AI_CAPABILITY_CATALOG.find((entry) => entry.id === id);
}

export function listCapabilities(): readonly AICapabilityDescriptor[] {
  return AI_CAPABILITY_CATALOG;
}
