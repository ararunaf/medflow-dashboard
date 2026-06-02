function stripControlChars(value: string, allowNewlines: boolean): string {
  let out = "";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (allowNewlines && (code === 0x0a || code === 0x0d)) {
      out += ch;
      continue;
    }
    if (code >= 0x20 && code !== 0x7f) {
      out += ch;
    }
  }
  return out;
}

/** Remove caracteres de controle e espaços nas bordas. */
export function sanitizeString(
  value: string,
  opts: { maxLength?: number; allowNewlines?: boolean } = {},
): string {
  let out = stripControlChars(value, opts.allowNewlines === true);
  out = out.trim();
  if (opts.maxLength != null && out.length > opts.maxLength) {
    out = out.slice(0, opts.maxLength);
  }
  return out;
}

/** Normaliza e-mail para comparação e rate limit (minúsculas, trim). */
export function sanitizeEmail(value: string): string {
  return sanitizeString(value, { maxLength: 254 }).toLowerCase();
}

/** Valida formato básico de e-mail após sanitização. */
export function isValidEmailFormat(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Sanitiza campos string de um objeto plano (shallow). */
export function sanitizeStringFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  opts?: { maxLength?: number },
): T {
  const next = { ...obj };
  for (const field of fields) {
    const v = next[field];
    if (typeof v === "string") {
      (next as Record<string, unknown>)[field as string] = sanitizeString(v, opts);
    }
  }
  return next;
}
