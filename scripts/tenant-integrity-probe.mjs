#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const { data: tenants, error: tenantErr } = await supabase
  .from("tenants")
  .select("id,name,slug,created_at")
  .order("slug");

const { count: settingsCount, error: settingsErr } = await supabase
  .from("tenant_settings")
  .select("*", { head: true, count: "exact" });

console.log(
  JSON.stringify(
    {
      tenant_count: tenants?.length ?? 0,
      tenant_error: tenantErr?.message ?? null,
      settings_count_visible: settingsCount ?? 0,
      settings_error: settingsErr?.message ?? null,
      tenants: tenants?.map((t) => ({ slug: t.slug, name: t.name })),
    },
    null,
    2,
  ),
);
