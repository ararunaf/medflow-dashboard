/**
 * Normalizadores de campos TISS — MEDICFLOW-TISS-PARSER-01
 * Remove caracteres inválidos e padroniza formatos.
 */

export function stripInvalidChars(value: string): string {
  // Intentional: strip ASCII control characters from OCR/parser input.
  // eslint-disable-next-line no-control-regex -- control-char scrubbing is the purpose of this helper
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export function normalizeCpf(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return null;
  return digits;
}

export function normalizeCns(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 15) return null;
  return digits;
}

export function normalizeCrm(value: string): string | null {
  const cleaned = stripInvalidChars(value).toUpperCase();
  const slashMatch = cleaned.match(/^(\d{1,6})\s*[/\\-]\s*([A-Z]{2})$/);
  if (slashMatch) {
    const num = slashMatch[1]!.padStart(6, "0");
    return `${slashMatch[2]}-${num}`;
  }
  const dashMatch = cleaned.match(/^([A-Z]{2})\s*[-]?\s*(\d{1,6})$/);
  if (dashMatch) {
    const num = dashMatch[2]!.padStart(6, "0");
    return `${dashMatch[1]}-${num}`;
  }
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length >= 4 && digitsOnly.length <= 6) {
    return digitsOnly.padStart(6, "0");
  }
  return null;
}

export function normalizeCro(value: string): string | null {
  const cleaned = stripInvalidChars(value).toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})\s*[-]?\s*(\d{1,6})$/);
  if (match) {
    return `${match[1]}-${match[2]!.padStart(6, "0")}`;
  }
  const slashMatch = cleaned.match(/^(\d{1,6})\s*[/\\-]\s*([A-Z]{2})$/);
  if (slashMatch) {
    return `${slashMatch[2]}-${slashMatch[1]!.padStart(6, "0")}`;
  }
  return null;
}

export function normalizeDate(value: string): string | null {
  const cleaned = stripInvalidChars(value);
  const brMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (brMatch) {
    const day = brMatch[1]!.padStart(2, "0");
    const month = brMatch[2]!.padStart(2, "0");
    let year = brMatch[3]!;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return cleaned;
  return null;
}

export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

export function normalizeCid(value: string): string | null {
  const cleaned = stripInvalidChars(value).toUpperCase().replace(/\s/g, "");
  const match = cleaned.match(/^([A-Z]\d{2})(\d)?$/);
  if (!match) {
    const dotted = cleaned.match(/^([A-Z]\d{2})\.(\d)$/);
    if (dotted) return `${dotted[1]}.${dotted[2]}`;
    return null;
  }
  if (match[2]) return `${match[1]}.${match[2]}`;
  return match[1] ?? null;
}

export function normalizeTuss(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 8) return null;
  return digits.padStart(8, "0");
}

export function normalizeGuideNumber(value: string): string | null {
  const cleaned = stripInvalidChars(value);
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 1) return digits;
  const alnum = cleaned.replace(/[^\dA-Za-z-]/g, "").toUpperCase();
  if (alnum.length < 1) return null;
  return alnum;
}

export function normalizeCnpj(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return null;
  return digits;
}

export function normalizeAnsCode(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 6) return null;
  return digits;
}

export function normalizeCardNumber(value: string): string | null {
  const cleaned = stripInvalidChars(value).toUpperCase().replace(/\s+/g, "");
  if (cleaned.length < 4) return null;
  return cleaned;
}

export function normalizeName(value: string): string | null {
  const cleaned = stripInvalidChars(value).replace(/\s+/g, " ");
  if (cleaned.length < 3) return null;
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeCurrency(value: string): string | null {
  const cleaned = stripInvalidChars(value)
    .replace(/R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}

export type NormalizerType =
  | "cpf"
  | "cns"
  | "crm"
  | "cro"
  | "date"
  | "phone"
  | "cid"
  | "tuss"
  | "guide_number"
  | "cnpj"
  | "ans_code"
  | "card_number"
  | "name"
  | "currency"
  | "text";

const NORMALIZERS: Record<NormalizerType, (value: string) => string | null> = {
  cpf: normalizeCpf,
  cns: normalizeCns,
  crm: normalizeCrm,
  cro: normalizeCro,
  date: normalizeDate,
  phone: normalizePhone,
  cid: normalizeCid,
  tuss: normalizeTuss,
  guide_number: normalizeGuideNumber,
  cnpj: normalizeCnpj,
  ans_code: normalizeAnsCode,
  card_number: normalizeCardNumber,
  name: normalizeName,
  currency: normalizeCurrency,
  text: (v) => stripInvalidChars(v) || null,
};

export function applyNormalizer(
  type: NormalizerType,
  rawValue: string,
): {
  value: string | null;
  normalized: boolean;
} {
  const normalizer = NORMALIZERS[type];
  const value = normalizer(rawValue);
  return { value, normalized: value !== null && value !== rawValue.trim() };
}
