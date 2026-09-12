import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";

import { AuthSync } from "@/components/auth-sync";
import { GlobalErrorBoundary } from "@/components/global-error-boundary";
import { OfflineFallback } from "@/components/offline-fallback";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { OperationalHeartbeat } from "@/components/operational-heartbeat";
import { PilotAdoptionTracker } from "@/components/pilot-launch/pilot-adoption-tracker";
import { DeploymentFallback } from "@/components/deployment-fallback";
import { ProductionWarningBanner } from "@/components/production-warning-banner";
import { TenantBrandingProvider } from "@/components/tenant-branding-provider";
import { RealtimeProvider } from "@/components/realtime-provider";
import { ToastHost } from "@/components/toast-host";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import { evaluateRouteGuard } from "@/lib/auth/route-guard";
import type { AuthContext } from "@/lib/auth/types";
import { logStartupDiagnostics } from "@/lib/env/startup-diagnostics";
import { logClient } from "@/lib/monitoring/channels/client";
import { initClientErrorMonitoring } from "@/lib/monitoring/client-bootstrap";
import { initStaleChunkRecovery } from "@/lib/monitoring/stale-chunk-recovery";
import { BRANDING, getBrandingHeadExtras } from "@/lib/assets";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  logClient("route_error_component", { err: error });
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início. Se o problema
          persistir, informe o suporte com o horário aproximado.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; auth: AuthContext }>()({
  pendingComponent: RoutePendingFallback,
  beforeLoad: async ({ location }) => {
    const auth = await getAuthContext();
    const guard = evaluateRouteGuard(location.pathname, auth);
    if (!guard.allowed) {
      throw redirect({ to: guard.redirectTo });
    }
    return { auth };
  },
  head: () => {
    const appUrl =
      typeof import.meta !== "undefined"
        ? (import.meta.env.VITE_MEDFLOW_APP_URL as string | undefined)?.trim()
        : undefined;
    const brandingHead = getBrandingHeadExtras(appUrl);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: BRANDING.manifestName },
        { name: "description", content: BRANDING.description },
        { name: "theme-color", content: BRANDING.themeColor },
        { property: "og:title", content: BRANDING.productName },
        { property: "og:description", content: BRANDING.tagline },
        { property: "og:type", content: "website" },
        ...(appUrl ? [{ property: "og:url", content: appUrl }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: BRANDING.productName },
        { name: "twitter:description", content: BRANDING.tagline },
        ...brandingHead.meta,
      ],
      links: [
        ...brandingHead.links,
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, auth } = Route.useRouteContext();

  useEffect(() => {
    initClientErrorMonitoring();
    initStaleChunkRecovery();
    if (import.meta.env.DEV) {
      logStartupDiagnostics("client");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TenantBrandingProvider auth={auth}>
        <AuthSync />
        <RealtimeProvider enabled={!!auth.user} />
        <OperationalHeartbeat enabled={!!auth.user} />
        <PilotAdoptionTracker enabled={!!auth.user} />
        <ProductionWarningBanner />
        <OfflineFallback />
        <DeploymentFallback />
        <GlobalErrorBoundary>
          <Outlet />
        </GlobalErrorBoundary>
        <ToastHost />
      </TenantBrandingProvider>
    </QueryClientProvider>
  );
}
