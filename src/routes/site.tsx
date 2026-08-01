import { createFileRoute, Link } from "@tanstack/react-router";
import { getCommercialLandingContent } from "@/lib/services/commercial-landing/commercial-landing-service";
import { externalLinkProps } from "@/lib/security/safe-external-links";
import {
  BRANDING,
  PUBLIC_ASSET_PATHS,
  defaultLogoUrl as logo,
  resolvePublicAssetUrl,
} from "@/lib/assets";
import { ArrowRight, Building2, CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/site")({
  head: () => {
    const content = getCommercialLandingContent();
    const ogUrl = content.appUrl;
    const ogImage = resolvePublicAssetUrl(PUBLIC_ASSET_PATHS.ogDefault, ogUrl);
    return {
      meta: [
        { title: `${content.productName} — Plataforma operacional hospitalar` },
        { name: "description", content: content.summary },
        { property: "og:title", content: content.productName },
        { property: "og:description", content: content.tagline },
        { property: "og:type", content: "website" },
        ...(ogUrl ? [{ property: "og:url", content: ogUrl }] : []),
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
        { name: "theme-color", content: BRANDING.themeColor },
      ],
    };
  },
  component: SiteLandingPage,
});

function SiteLandingPage() {
  const content = getCommercialLandingContent();
  const demoLink = externalLinkProps(content.ctaDemoHref);
  const mailLink = externalLinkProps(`mailto:${content.contactEmail}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt={content.productName} className="h-9 w-auto" />
            <span className="font-semibold text-foreground hidden sm:inline">
              {content.productName}
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/login"
              search={{ reason: null }}
              className="text-muted-foreground hover:text-foreground"
            >
              Entrar
            </Link>
            <a
              {...demoLink}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-brand-gradient text-primary-foreground">
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
            <p className="text-sm font-medium opacity-80 mb-3">V1 · Lançamento piloto</p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl leading-tight">
              {content.tagline}
            </h1>
            <p className="mt-4 text-base md:text-lg opacity-90 max-w-xl">{content.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                {...demoLink}
                className="inline-flex items-center gap-2 rounded-lg bg-background text-foreground px-5 py-2.5 text-sm font-semibold hover:bg-background/90"
              >
                {content.ctaDemoLabel}
              </a>
              <Link
                to="/login"
                search={{ reason: null }}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-5 py-2.5 text-sm font-medium hover:bg-primary-foreground/10"
              >
                Acessar plataforma
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-xl font-semibold mb-6">Benefícios</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {content.benefits.map((b) => (
              <li
                key={b}
                className="flex gap-3 rounded-xl border border-border bg-card p-4 ring-soft"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-muted/40 border-y border-border">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="text-xl font-semibold mb-6">Módulos principais</h2>
            <MotionModules modules={content.modules} />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 text-center">
          <Building2 className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">{content.contactLabel}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Pronto para onboarding de tenants reais e implantação piloto supervisionada.
          </p>
          <a
            {...mailLink}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            {content.contactEmail}
          </a>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {content.productName} · Operação hospitalar inteligente
      </footer>
    </div>
  );
}

function MotionModules({
  modules,
}: {
  modules: ReturnType<typeof getCommercialLandingContent>["modules"];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((m) => (
        <article key={m.id} className="rounded-xl border border-border bg-card p-5 ring-soft">
          <h3 className="font-semibold text-foreground">{m.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
        </article>
      ))}
    </div>
  );
}
