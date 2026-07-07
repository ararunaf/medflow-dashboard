/**
 * Detecção automática do tipo de guia TISS a partir do OCR.
 * MEDICFLOW-TISS-PARSER-01
 */
import type { RawOcrResult } from "../../ocr/types/raw-ocr-result";
import { ALL_TEMPLATES } from "../templates";
import type { GuideTypeDetection, TissGuideType } from "../types/tiss-guide-type";

type ScoreEntry = { type: TissGuideType; score: number; matches: number };

export function detectGuideType(ocr: RawOcrResult): GuideTypeDetection {
  const headerText = extractHeaderText(ocr);
  const fullText = ocr.fullText;

  const scores: ScoreEntry[] = ALL_TEMPLATES.map((template) => {
    let score = 0;
    let matches = 0;
    for (const pattern of template.headerPatterns) {
      if (pattern.test(headerText)) {
        score += 0.45;
        matches++;
      }
      if (pattern.test(fullText)) {
        score += 0.15;
        matches++;
      }
    }
    return { type: template.guideType, score: Math.min(score, 1), matches };
  });

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const second = scores[1];

  if (!best || best.score < 0.3) {
    return {
      guideType: "unknown",
      confidence: best?.score ?? 0,
      method: "unknown",
      alternativeTypes: scores
        .filter((s) => s.type !== "unknown")
        .slice(0, 3)
        .map((s) => ({ type: s.type, confidence: s.score })),
    };
  }

  const confidence =
    second && second.score > 0
      ? Math.min(best.score, best.score - second.score * 0.3 + 0.1)
      : best.score;

  return {
    guideType: best.type,
    confidence: Math.min(Math.max(confidence, 0.3), 1),
    method: best.matches > 0 ? "header_regex" : "layout_heuristic",
    alternativeTypes: scores
      .filter((s) => s.type !== best.type)
      .slice(0, 3)
      .map((s) => ({ type: s.type, confidence: s.score })),
  };
}

function extractHeaderText(ocr: RawOcrResult): string {
  const lines: string[] = [];
  for (const page of ocr.pages) {
    const headerLines = page.lines.filter((line) => {
      const y = line.coordinates.boundingBox.y;
      const pageHeight = page.height || 1;
      return y / pageHeight < 0.25;
    });
    lines.push(...headerLines.map((l) => l.text));
  }
  return lines.join("\n");
}
