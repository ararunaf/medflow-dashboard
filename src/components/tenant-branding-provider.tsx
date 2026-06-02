import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuthContext } from "@/lib/auth/types";
import { opsKeys } from "@/lib/queries/keys";
import {
  applyTenantBrandingToDocument,
  revokeTenantBrandingFromDocument,
  toBrandingSnapshot,
} from "@/lib/services/tenant-branding";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings";
import { getBrowserSupabase } from "@/lib/supabase/browser";

type BrandingCtx = {
  settings: TenantSettingsRow | null;
  isLoading: boolean;
};

const BrandingContext = createContext<BrandingCtx | null>(null);

export function useTenantBranding(): BrandingCtx {
  return useContext(BrandingContext) ?? { settings: null, isLoading: false };
}

export function TenantBrandingProvider({
  auth,
  children,
}: {
  auth: AuthContext;
  children: ReactNode;
}) {
  const q = useQuery({
    queryKey: opsKeys.tenantSettings(),
    queryFn: async () => {
      const sb = getBrowserSupabase();
      const { data, error } = await sb.from("tenant_settings").select("*").maybeSingle();
      if (error) throw error;
      return data as TenantSettingsRow | null;
    },
    enabled: !!auth.user,
    staleTime: 60_000,
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!auth.user) {
      revokeTenantBrandingFromDocument(root);
      return;
    }
    applyTenantBrandingToDocument(root, toBrandingSnapshot(q.data ?? null));
  }, [auth.user, q.data]);

  const value = useMemo(
    () => ({ settings: q.data ?? null, isLoading: q.isLoading }),
    [q.data, q.isLoading],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
