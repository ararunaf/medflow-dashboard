/**
 * Extração de campos TISS a partir de linhas OCR.
 * MEDICFLOW-TISS-PARSER-01
 */
import type {
  OcrBoundingBox,
  OcrLine,
  OcrPage,
  RawOcrResult,
} from "../../ocr/types/raw-ocr-result";
import { applyNormalizer } from "../normalizers";
import type { TemplateFieldDef } from "../templates";
import type {
  StructuredField,
  StructuredFieldGroup,
  StructuredFieldPosition,
  StructuredFieldStatus,
  StructuredProcedureLine,
} from "../types/structured-guide";

export type IndexedOcrLine = {
  pageNumber: number;
  lineIndex: number;
  text: string;
  normalizedText: string;
  confidence: number;
  boundingBox: OcrBoundingBox;
  pageWidth: number;
  pageHeight: number;
  words: string[];
  line: OcrLine;
};

export function indexOcrLines(ocr: RawOcrResult): IndexedOcrLine[] {
  const result: IndexedOcrLine[] = [];
  for (const page of ocr.pages) {
    page.lines.forEach((line, lineIndex) => {
      result.push({
        pageNumber: page.pageNumber,
        lineIndex,
        text: line.text,
        normalizedText: normalizeForMatch(line.text),
        confidence: line.confidence,
        boundingBox: line.coordinates.boundingBox,
        pageWidth: page.width || 1,
        pageHeight: page.height || 1,
        words: line.words.map((w) => w.text),
        line,
      });
    });
  }
  return result;
}

function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildPosition(line: IndexedOcrLine): StructuredFieldPosition {
  const { boundingBox, pageNumber, lineIndex, pageWidth, pageHeight } = line;
  return {
    page: pageNumber,
    lineIndex,
    boundingBox,
    normalized: {
      x: boundingBox.x / pageWidth,
      y: boundingBox.y / pageHeight,
      width: boundingBox.width / pageWidth,
      height: boundingBox.height / pageHeight,
    },
  };
}

function extractValueFromLine(
  lineText: string,
  labelPattern: RegExp,
  valuePattern?: RegExp,
): string | null {
  const match = lineText.match(labelPattern);
  if (!match) return null;
  const afterLabel = lineText
    .slice(match.index! + match[0].length)
    .replace(/^[\s:.\-–—]+/, "")
    .trim();
  if (afterLabel.length > 0) {
    if (valuePattern) {
      const valMatch = afterLabel.match(valuePattern);
      if (valMatch) return valMatch[0]!.trim();
    }
    if (afterLabel.length >= 2) return afterLabel;
  }
  return null;
}

function findValueOnNextLine(
  lines: IndexedOcrLine[],
  startIdx: number,
  valuePattern?: RegExp,
): {
  rawValue: string;
  line: IndexedOcrLine;
  confidence: number;
} | null {
  const next = lines[startIdx + 1];
  if (!next) return null;
  const text = next.text.trim();
  if (text.length < 1) return null;
  if (valuePattern) {
    const match = text.match(valuePattern);
    if (match) return { rawValue: match[0]!, line: next, confidence: next.confidence };
    return null;
  }
  if (/^[\dA-Za-z]/.test(text) && !looksLikeLabel(text)) {
    return { rawValue: text, line: next, confidence: next.confidence * 0.9 };
  }
  return null;
}

function looksLikeLabel(text: string): boolean {
  return (
    /[:]$/.test(text.trim()) || /^(nome|data|cpf|cnpj|crm|cid|tuss|cns|senha|guia)/i.test(text)
  );
}

function determineStatus(
  rawValue: string | null,
  confidence: number,
  isDuplicate: boolean,
  isOutOfPosition: boolean,
): StructuredFieldStatus {
  if (!rawValue) return "missing";
  if (isDuplicate) return "duplicate";
  if (isOutOfPosition) return "out_of_position";
  if (confidence < 0.5 || rawValue.length < 2) return "partial";
  return "found";
}

function isOutOfExpectedRegion(
  position: StructuredFieldPosition | null,
  expectedRegion?: { yMin: number; yMax: number },
): boolean {
  if (!position || !expectedRegion) return false;
  const y = position.normalized.y + position.normalized.height / 2;
  return y < expectedRegion.yMin || y > expectedRegion.yMax;
}

export function extractFields(
  ocr: RawOcrResult,
  fieldDefs: TemplateFieldDef[],
): { fields: Record<string, StructuredField>; procedures: StructuredProcedureLine[] } {
  const lines = indexOcrLines(ocr);
  const fields: Record<string, StructuredField> = {};
  const matchedLineIndices = new Map<string, number[]>();

  for (const def of fieldDefs) {
    const candidates: Array<{
      rawValue: string;
      line: IndexedOcrLine;
      confidence: number;
      labelPattern: RegExp;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const pattern of def.labelPatterns) {
        if (pattern.test(line.normalizedText) || pattern.test(line.text)) {
          let rawValue = extractValueFromLine(line.text, pattern, def.valuePattern);
          let matchLine = line;
          let conf = line.confidence;

          if (!rawValue) {
            const nextVal = findValueOnNextLine(lines, i, def.valuePattern);
            if (nextVal) {
              rawValue = nextVal.rawValue;
              matchLine = nextVal.line;
              conf = nextVal.confidence;
            }
          }

          if (rawValue) {
            candidates.push({ rawValue, line: matchLine, confidence: conf, labelPattern: pattern });
          } else if (def.valuePattern) {
            for (let j = i; j < Math.min(i + 3, lines.length); j++) {
              const scanLine = lines[j]!;
              const match = scanLine.text.match(def.valuePattern);
              if (match) {
                candidates.push({
                  rawValue: match[0]!,
                  line: scanLine,
                  confidence: scanLine.confidence * 0.85,
                  labelPattern: pattern,
                });
                break;
              }
            }
          }
        }
      }
    }

    const prevMatches = matchedLineIndices.get(def.code) ?? [];

    const uniqueCandidates = dedupeCandidatesByLine(candidates);
    const distinctLineCandidates = uniqueCandidates.filter(
      (c, idx, arr) =>
        arr.findIndex((x) => x.line.lineIndex === c.line.lineIndex && x.rawValue === c.rawValue) ===
        idx,
    );
    const isDuplicate =
      distinctLineCandidates.length > 1 &&
      new Set(distinctLineCandidates.map((c) => c.line.lineIndex)).size > 1;
    const best = distinctLineCandidates.sort((a, b) => b.confidence - a.confidence)[0];

    const rawValue: string | null = best?.rawValue ?? null;
    const confidence = best?.confidence ?? 0;
    const position: StructuredFieldPosition | null = best ? buildPosition(best.line) : null;
    const ocrOrigin = best
      ? {
          provider: ocr.provider,
          lineConfidence: best.line.confidence,
        }
      : null;

    const outOfPosition = isOutOfExpectedRegion(position, def.expectedRegion);
    let status = determineStatus(rawValue, confidence, isDuplicate, outOfPosition);

    let normalizedValue: string | null = null;
    let normalized = false;
    if (rawValue) {
      const norm = applyNormalizer(def.normalizer, rawValue);
      normalizedValue = norm.value ?? rawValue;
      normalized = norm.normalized;
      if (norm.value === null && status === "found") status = "partial";
    }

    if (best) {
      prevMatches.push(best.line.lineIndex);
      matchedLineIndices.set(def.code, prevMatches);
    }

    fields[def.code] = {
      code: def.code,
      label: def.label,
      group: def.group,
      value: normalizedValue,
      rawValue,
      confidence,
      position,
      ocrOrigin,
      status,
      normalized,
    };
  }

  const procedures = extractProcedureLines(ocr, lines, fields);
  return { fields, procedures };
}

function dedupeCandidatesByLine(
  candidates: Array<{
    rawValue: string;
    line: IndexedOcrLine;
    confidence: number;
    labelPattern: RegExp;
  }>,
) {
  const byLine = new Map<number, (typeof candidates)[0]>();
  for (const c of candidates) {
    const existing = byLine.get(c.line.lineIndex);
    if (!existing || c.confidence > existing.confidence) {
      byLine.set(c.line.lineIndex, c);
    }
  }
  return [...byLine.values()];
}

function extractProcedureLines(
  ocr: RawOcrResult,
  lines: IndexedOcrLine[],
  existingFields: Record<string, StructuredField>,
): StructuredProcedureLine[] {
  const procedureLines: StructuredProcedureLine[] = [];
  const tussPattern = /\b(\d{8})\b/;
  const tussPatternShort = /\b(\d{6,7})\b/;
  const datePattern = /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/;
  const valuePattern = /R?\$?\s*([\d.,]+)/;
  const skipPattern = /^(registro\s*ans|cnpj|crm|cpf|cns|guia|senha|nome|operadora|data\s)/i;

  let lineNum = 0;
  for (const line of lines) {
    if (skipPattern.test(line.normalizedText)) continue;

    let tussMatch = line.text.match(tussPattern);
    if (!tussMatch) {
      if (!/tuss|procedimento|c[oó]digo/i.test(line.text)) continue;
      tussMatch = line.text.match(tussPatternShort);
    }
    if (!tussMatch) continue;
    const tussCode = tussMatch[1]!;

    const normTuss = applyNormalizer("tuss", tussCode);
    const dateMatch = line.text.match(datePattern);
    const valueMatch = line.text.match(valuePattern);

    const procFields: Record<string, StructuredField> = {
      procedure_code: {
        code: "procedure_code",
        label: "Código TUSS",
        group: "procedimentos",
        value: normTuss.value,
        rawValue: tussCode,
        confidence: line.confidence,
        position: buildPosition(line),
        ocrOrigin: {
          provider: ocr.provider,
          lineConfidence: line.confidence,
        },
        status: normTuss.value ? "found" : "partial",
        normalized: normTuss.normalized,
      },
    };

    if (dateMatch) {
      const normDate = applyNormalizer("date", dateMatch[0]!);
      procFields.execution_date = {
        code: "execution_date",
        label: "Data Execução",
        group: "procedimentos",
        value: normDate.value,
        rawValue: dateMatch[0]!,
        confidence: line.confidence * 0.9,
        position: buildPosition(line),
        ocrOrigin: {
          provider: ocr.provider,
          lineConfidence: line.confidence,
        },
        status: normDate.value ? "found" : "partial",
        normalized: normDate.normalized,
      };
    }

    if (valueMatch) {
      const normVal = applyNormalizer("currency", valueMatch[0]!);
      procFields.total_value = {
        code: "total_value",
        label: "Valor",
        group: "procedimentos",
        value: normVal.value,
        rawValue: valueMatch[0]!,
        confidence: line.confidence * 0.85,
        position: buildPosition(line),
        ocrOrigin: {
          provider: ocr.provider,
          lineConfidence: line.confidence,
        },
        status: normVal.value ? "found" : "partial",
        normalized: normVal.normalized,
      };
    }

    lineNum++;
    const avgConf =
      Object.values(procFields).reduce((s, f) => s + f.confidence, 0) /
      Object.values(procFields).length;

    procedureLines.push({ lineNumber: lineNum, fields: procFields, confidence: avgConf });
  }

  if (procedureLines.length === 0 && existingFields.procedure_code?.status === "found") {
    procedureLines.push({
      lineNumber: 1,
      fields: { procedure_code: existingFields.procedure_code },
      confidence: existingFields.procedure_code.confidence,
    });
  }

  return procedureLines;
}

export function groupFields(
  fields: Record<string, StructuredField>,
): Record<StructuredFieldGroup, StructuredField[]> {
  const groups: Record<StructuredFieldGroup, StructuredField[]> = {
    paciente: [],
    operadora: [],
    prestador: [],
    solicitante: [],
    executante: [],
    procedimentos: [],
    diagnostico: [],
    autorizacoes: [],
    datas: [],
    assinaturas: [],
    observacoes: [],
  };

  for (const field of Object.values(fields)) {
    groups[field.group].push(field);
  }

  for (const key of Object.keys(groups) as StructuredFieldGroup[]) {
    groups[key].sort((a, b) => a.label.localeCompare(b.label));
  }

  return groups;
}

export function computeOverallConfidence(fields: Record<string, StructuredField>): number {
  const values = Object.values(fields);
  if (values.length === 0) return 0;
  const found = values.filter((f) => f.status === "found" || f.status === "out_of_position");
  if (found.length === 0) return 0;
  return found.reduce((s, f) => s + f.confidence, 0) / found.length;
}

export function countFieldsByStatus(fields: Record<string, StructuredField>): {
  found: number;
  missing: number;
  partial: number;
  duplicate: number;
  outOfPosition: number;
} {
  const counts = { found: 0, missing: 0, partial: 0, duplicate: 0, outOfPosition: 0 };
  for (const f of Object.values(fields)) {
    switch (f.status) {
      case "found":
        counts.found++;
        break;
      case "missing":
        counts.missing++;
        break;
      case "partial":
        counts.partial++;
        break;
      case "duplicate":
        counts.duplicate++;
        break;
      case "out_of_position":
        counts.outOfPosition++;
        break;
    }
  }
  return counts;
}
