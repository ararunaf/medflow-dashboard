/**
 * Chunking de contrato — F2-S1 (Ingestão de contrato e pipeline RAG).
 *
 * DoD da sprint: "contrato real de operadora indexado e pesquisável por
 * cláusula". Por isso o chunker tenta primeiro dividir pelo próprio limite
 * de cláusula do contrato (padrões comuns de contrato brasileiro: CLÁUSULA,
 * CAPÍTULO, PARÁGRAFO, Art./Artigo, seção numerada "3.1 TÍTULO EM CAIXA
 * ALTA"). Só cai para chunking por parágrafo de tamanho fixo quando o texto
 * não expõe nenhum desses marcadores (ex.: contrato mal digitalizado/OCR sem
 * estrutura reconhecível) — nesse caso não há cláusula para citar mesmo.
 */

export type ContractChunk = {
  index: number;
  /** Texto do cabeçalho de cláusula que originou o chunk; null no fallback por parágrafo. */
  heading: string | null;
  content: string;
};

const CLAUSE_HEADING_RE =
  /^\s*(cl[áa]usula\s+[a-zà-ú0-9ªº°]+|cap[íi]tulo\s+[a-zà-ú0-9ªº°]+|par[áa]grafo\s+(?:[úu]nico|[a-zà-ú0-9ªº°]+)|art(?:\.|igo)\s*\d+[ºo°]?|\d+(?:\.\d+)*\s+[a-zà-ú][a-zà-ú\s]{3,})/i;

const MAX_CHUNK_CHARS = 1800;
const OVERLAP_CHARS = 200;

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

function splitWithOverlap(text: string, maxChars: number, overlap: number): string[] {
  if (text.length <= maxChars) return [text];
  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    pieces.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return pieces;
}

function packParagraphs(paragraphs: readonly string[], maxChars: number): string[] {
  const out: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    const candidate = buf ? `${buf}\n\n${p}` : p;
    if (candidate.length <= maxChars) {
      buf = candidate;
      continue;
    }
    if (buf) out.push(buf);
    if (p.length > maxChars) {
      out.push(...splitWithOverlap(p, maxChars, OVERLAP_CHARS));
      buf = "";
    } else {
      buf = p;
    }
  }
  if (buf) out.push(buf);
  return out;
}

type Segment = { heading: string | null; lines: string[] };

function splitByClauseHeading(text: string): Segment[] {
  const segments: Segment[] = [];
  let current: Segment = { heading: null, lines: [] };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && CLAUSE_HEADING_RE.test(trimmed)) {
      if (current.heading !== null || current.lines.some((l) => l.trim().length > 0)) {
        segments.push(current);
      }
      current = { heading: trimmed, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.heading !== null || current.lines.some((l) => l.trim().length > 0)) {
    segments.push(current);
  }
  return segments;
}

export function chunkContractText(rawText: string): ContractChunk[] {
  const text = normalize(rawText).trim();
  if (text.length === 0) return [];

  const segments = splitByClauseHeading(text);
  const clauseCount = segments.filter((s) => s.heading !== null).length;

  const chunks: ContractChunk[] = [];
  let index = 0;

  if (clauseCount >= 2) {
    for (const seg of segments) {
      const body = seg.lines.join("\n").trim();
      const full = seg.heading ? `${seg.heading}\n${body}`.trim() : body;
      if (full.length === 0) continue;
      for (const piece of splitWithOverlap(full, MAX_CHUNK_CHARS, OVERLAP_CHARS)) {
        chunks.push({ index: index++, heading: seg.heading, content: piece });
      }
    }
    return chunks;
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  for (const piece of packParagraphs(paragraphs, MAX_CHUNK_CHARS)) {
    chunks.push({ index: index++, heading: null, content: piece });
  }
  return chunks;
}
