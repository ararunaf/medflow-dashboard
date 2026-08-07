/** Projeto Supabase dedicado ao ambiente staging (MedicFlow). */
export const STAGING_SUPABASE_PROJECT_REF = "utodixhxrvegzafcldpu";
export const STAGING_SUPABASE_HOST = `${STAGING_SUPABASE_PROJECT_REF}.supabase.co`;
export const STAGING_SUPABASE_URL = `https://${STAGING_SUPABASE_HOST}`;

/** Padrões que indicam build de produção ou env não preenchido — bloquear deploy staging. */
export const FORBIDDEN_STAGING_BUNDLE_PATTERNS = [
  { id: "YOUR_PRODUCTION_PROJECT_REF", pattern: /YOUR_PRODUCTION_PROJECT_REF/i },
  { id: "YOUR_PROJECT_REF", pattern: /YOUR_(?:STAGING_)?PROJECT_REF/i },
  { id: "your_production_anon_key", pattern: /your_production_anon_key/i },
  { id: "your_anon_key", pattern: /your_(?:staging_)?anon_key/i },
  { id: "placeholder.supabase", pattern: /placeholder\.supabase/i },
  { id: "app.seudominio.com.br", pattern: /app\.seudominio\.com\.br/i },
  { id: "example.com", pattern: /https?:\/\/(?:www\.)?example\.com\b/i },
];
