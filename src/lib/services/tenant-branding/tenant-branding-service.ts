import { BRANDING } from "@/lib/assets/branding";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";

const BRAND_PRIMARY = "--primary";
const BRAND_SECONDARY = "--secondary";
const BRAND_ACCENT = "--accent";
const BRAND_SIDEBAR_PRIMARY = "--sidebar-primary";

export type TenantBrandingSnapshot = Pick<
  TenantSettingsRow,
  | "institution_name"
  | "primary_color"
  | "secondary_color"
  | "logo_url"
  | "favicon_url"
  | "banner_url"
>;

export function toBrandingSnapshot(row: TenantSettingsRow | null): TenantBrandingSnapshot | null {
  if (!row) return null;
  return {
    institution_name: row.institution_name,
    primary_color: row.primary_color,
    secondary_color: row.secondary_color,
    logo_url: row.logo_url,
    favicon_url: row.favicon_url,
    banner_url: row.banner_url,
  };
}

/**
 * Aplica paleta institucional leve (CSS variables) + favicon opcional.
 * Evita animações pesadas; não altera layout base.
 */
export function applyTenantBrandingToDocument(
  root: HTMLElement,
  row: TenantBrandingSnapshot | null,
  opts: { defaultTitle?: string } = {},
): void {
  const defaultTitle = opts.defaultTitle ?? BRANDING.productName;
  if (!row) {
    root.style.removeProperty(BRAND_PRIMARY);
    root.style.removeProperty(BRAND_SECONDARY);
    root.style.removeProperty(BRAND_ACCENT);
    root.style.removeProperty(BRAND_SIDEBAR_PRIMARY);
    document.title = defaultTitle;
    return;
  }

  root.style.setProperty(BRAND_PRIMARY, row.primary_color);
  root.style.setProperty(BRAND_SECONDARY, row.secondary_color);
  root.style.setProperty(BRAND_ACCENT, row.secondary_color);
  root.style.setProperty(BRAND_SIDEBAR_PRIMARY, row.primary_color);

  const inst = row.institution_name?.trim();
  document.title = inst ? `${inst} · ${BRANDING.shortName}` : defaultTitle;

  const href = row.favicon_url?.trim() || row.logo_url?.trim();
  if (!href) return;

  let link = document.querySelector<HTMLLinkElement>("link[data-tenant-favicon]");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-tenant-favicon", "1");
    document.head.appendChild(link);
  }
  link.href = href;
}

export function revokeTenantBrandingFromDocument(root: HTMLElement): void {
  root.style.removeProperty(BRAND_PRIMARY);
  root.style.removeProperty(BRAND_SECONDARY);
  root.style.removeProperty(BRAND_ACCENT);
  root.style.removeProperty(BRAND_SIDEBAR_PRIMARY);
  document.querySelector("link[data-tenant-favicon]")?.remove();
}
