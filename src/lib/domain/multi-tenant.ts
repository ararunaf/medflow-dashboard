/**
 * Convenção MedFlow: dados de negócio usam a coluna `tenant_id` alinhada ao
 * `profiles.tenant_id` do usuário. O Postgres RLS já isola por tenant; em
 * código com service role, sempre filtre explicitamente por `tenant_id`.
 */
export const TENANT_ID_COLUMN = "tenant_id" as const;
