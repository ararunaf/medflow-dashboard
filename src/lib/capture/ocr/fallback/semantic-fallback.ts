/**
 * OCR Semantic Fallback — F2-S5.
 *
 * Quando um campo estruturado sai do parser com confiança < 0.70, recorta
 * a região exata do campo na imagem original (StructuredField.position,
 * já calculada pelo parser) e pergunta ao GPT-4o Vision o valor daquele
 * campo — via AIProviderPort (ARCH-02, capability "vision"), nunca chamada
 * direta ao vendor. O valor só é aplicado quando a confiança do fallback
 * supera a original; toda tentativa (aplicada ou não) fica registrada em
 * SemanticFallbackDecision — nada acontece silenciosamente.
 *
 * Escopo desta sprint: recorte real só para os mimes de imagem já
 * suportados pela captura (jpeg/png/webp/tiff, sempre 1 página). PDF é
 * pulado com motivo explícito no log — cropping de PDF com libvips não é
 * portátil o suficiente para prometer aqui.
 */
import sharp from "sharp";
import type { AIProviderPort } from "../../../enterprise/ai-provider/ports/ai-provider-port";
import type { StructuredField, StructuredFieldPosition, StructuredGuide } from "../../parser/types/structured-guide";
import { evaluateExternalAiPiiGate } from "./pii-external-ai-gate";

export const SEMANTIC_FALLBACK_CONFIDENCE_THRESHOLD = 0.7;

const CROPPABLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/tiff"]);

export type SemanticFallbackDecision = {
  fieldCode: string;
  fieldLabel: string;
  originalConfidence: number;
  /** true = o fallback foi de fato acionado (recorte + chamada ao modelo); false = pulado antes disso. */
  triggered: boolean;
  skippedReason: string | null;
  newValue: string | null;
  newConfidence: number | null;
  applied: boolean;
  at: string;
};

/** Campos abaixo do limiar e com posição conhecida — sem posição não há o que recortar. */
export function selectLowConfidenceFields(guide: StructuredGuide): StructuredField[] {
  return Object.values(guide.fields).filter(
    (f) => f.confidence < SEMANTIC_FALLBACK_CONFIDENCE_THRESHOLD && f.position !== null,
  );
}

export async function cropFieldRegion(
  imageBytes: Uint8Array,
  position: StructuredFieldPosition,
  paddingRatio = 0.03,
): Promise<Uint8Array> {
  const image = sharp(Buffer.from(imageBytes));
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error("Não foi possível ler as dimensões da imagem para recorte.");
  }

  const { x, y, width: w, height: h } = position.normalized;
  const padX = w * paddingRatio;
  const padY = h * paddingRatio;

  const left = Math.max(0, Math.round((x - padX) * width));
  const top = Math.max(0, Math.round((y - padY) * height));
  const right = Math.min(width, Math.round((x + w + padX) * width));
  const bottom = Math.min(height, Math.round((y + h + padY) * height));

  const cropWidth = Math.max(1, right - left);
  const cropHeight = Math.max(1, bottom - top);

  return image.extract({ left, top, width: cropWidth, height: cropHeight }).png().toBuffer();
}

type VisionExtractResult = { value: string | null; confidence: number };

export function parseVisionExtractResponse(raw: string): VisionExtractResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.value !== "string" && obj.value !== null) return null;
  if (typeof obj.confidence !== "number" || Number.isNaN(obj.confidence)) return null;
  if (obj.confidence < 0 || obj.confidence > 1) return null;
  return { value: obj.value, confidence: obj.confidence };
}

export async function extractFieldViaVision(
  port: AIProviderPort,
  cropPng: Uint8Array,
  field: Pick<StructuredField, "code" | "label">,
): Promise<VisionExtractResult | null> {
  const base64 = Buffer.from(cropPng).toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const response = await port.invoke({
    capability: "vision",
    input: {
      messages: [
        {
          role: "system",
          content:
            'Você lê um recorte de imagem de UM campo de guia TISS (papel/formulário de saúde brasileiro). ' +
            'Responda APENAS com JSON { "value": string|null, "confidence": number }. confidence é 0 a 1 — ' +
            "sua confiança real na leitura. Se não conseguir ler o valor com segurança, value deve ser null " +
            "e confidence deve refletir isso (baixa). Nunca invente um valor plausível — leia exatamente o que está na imagem.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Campo: "${field.label}" (código ${field.code}). Qual o valor deste campo?` },
            { type: "image_url", image_url: { url: dataUri } },
          ],
        },
      ],
    },
  });

  if (!response.ok || !response.content) return null;
  return parseVisionExtractResponse(response.content);
}

export type ApplySemanticFallbackResult = {
  guide: StructuredGuide;
  decisions: SemanticFallbackDecision[];
};

/**
 * Roda o fallback para todos os campos elegíveis e devolve o StructuredGuide
 * atualizado (só os campos que realmente melhoraram) + o log completo de
 * decisões (inclusive as que não aplicaram nada) — DoD F2-S5.
 */
export async function applySemanticFallback(
  port: AIProviderPort,
  guide: StructuredGuide,
  imageBytes: Uint8Array,
  mimeType: string,
): Promise<ApplySemanticFallbackResult> {
  const candidates = selectLowConfidenceFields(guide);
  const decisions: SemanticFallbackDecision[] = [];
  const updatedFields = { ...guide.fields };

  for (const field of candidates) {
    const at = new Date().toISOString();
    const base = {
      fieldCode: field.code,
      fieldLabel: field.label,
      originalConfidence: field.confidence,
      at,
    };

    if (!CROPPABLE_MIME_TYPES.has(mimeType)) {
      decisions.push({
        ...base,
        triggered: false,
        skippedReason: `Recorte não suportado para ${mimeType} nesta sprint (só imagem: jpeg/png/webp/tiff).`,
        newValue: null,
        newConfidence: null,
        applied: false,
      });
      continue;
    }

    const gate = evaluateExternalAiPiiGate(field);
    if (!gate.allowed) {
      decisions.push({
        ...base,
        triggered: false,
        skippedReason: gate.reason,
        newValue: null,
        newConfidence: null,
        applied: false,
      });
      continue;
    }

    try {
      const crop = await cropFieldRegion(imageBytes, field.position!);
      const extracted = await extractFieldViaVision(port, crop, field);

      if (!extracted || extracted.value === null) {
        decisions.push({
          ...base,
          triggered: true,
          skippedReason: null,
          newValue: null,
          newConfidence: extracted?.confidence ?? null,
          applied: false,
        });
        continue;
      }

      const applied = extracted.confidence > field.confidence;
      if (applied) {
        updatedFields[field.code] = {
          ...field,
          value: extracted.value,
          confidence: extracted.confidence,
          status: "found",
        };
      }

      decisions.push({
        ...base,
        triggered: true,
        skippedReason: null,
        newValue: extracted.value,
        newConfidence: extracted.confidence,
        applied,
      });
    } catch (err) {
      decisions.push({
        ...base,
        triggered: true,
        skippedReason: err instanceof Error ? err.message : String(err),
        newValue: null,
        newConfidence: null,
        applied: false,
      });
    }
  }

  return { guide: { ...guide, fields: updatedFields }, decisions };
}
