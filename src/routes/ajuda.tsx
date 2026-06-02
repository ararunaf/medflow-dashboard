import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { HelpArticleDrawer } from "@/components/pilot-launch/help-article-drawer";
import { PageHeader } from "@/components/ui-kit";
import {
  allHelpContent,
  getArticleById,
  help_center_articles,
  help_quick_links,
  onboarding_guides,
  operational_doc_sections,
  operational_faq,
  searchHelpContent,
  type HelpCenterArticle,
  type HelpArticleCategory,
} from "@/lib/services/help-center/help-center-service";
import { BookMarked, BookOpen, FileQuestion, Layers, Newspaper, Search } from "lucide-react";
import { useMemo, useState } from "react";

type AjudaSearch = { tab?: HelpArticleCategory | "all"; article?: string };

export const Route = createFileRoute("/ajuda")({
  validateSearch: (search: Record<string, unknown>): AjudaSearch => ({
    tab:
      search.tab === "article" ||
      search.tab === "guide" ||
      search.tab === "faq" ||
      search.tab === "doc" ||
      search.tab === "all"
        ? search.tab
        : "all",
    article: typeof search.article === "string" ? search.article : undefined,
  }),
  head: () => ({
    meta: [
      { title: brandPageTitle("Central de ajuda") },
      { name: "description", content: "FAQ operacional, guias rápidos e documentação inicial." },
    ],
  }),
  component: AjudaPage,
});

const tabs: { id: AjudaSearch["tab"]; label: string; icon: typeof Newspaper }[] = [
  { id: "all", label: "Tudo", icon: Layers },
  { id: "guide", label: "Guias", icon: BookMarked },
  { id: "article", label: "Artigos", icon: Newspaper },
  { id: "faq", label: "FAQ", icon: FileQuestion },
  { id: "doc", label: "Docs", icon: BookOpen },
];

function AjudaPage() {
  const { tab, article: articleId } = Route.useSearch();
  const navigate = useNavigate({ from: "/ajuda" });
  const [drawerArticle, setDrawerArticle] = useState<HelpCenterArticle | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const base = query.trim() ? searchHelpContent(query) : allHelpContent();
    if (!tab || tab === "all") return base;
    return base.filter((a) => a.category === tab);
  }, [tab, query]);

  const fromUrl = articleId ? getArticleById(articleId) : undefined;
  const showInitial = fromUrl && !drawerArticle;

  return (
    <AppShell>
      <PageHeader
        title="Central de ajuda"
        subtitle="FAQ operacional, guias rápidos, passos iniciais e documentação para piloto V1."
        actions={
          <Link to="/piloto" className="text-xs font-medium text-primary hover:underline">
            Implantação piloto →
          </Link>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar artigos, guias e FAQ…"
          className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {help_quick_links.map((link) => (
          <button
            key={link.articleId}
            type="button"
            onClick={() => {
              const article = getArticleById(link.articleId);
              if (article) {
                setDrawerArticle(article);
                void navigate({ search: { tab: article.category, article: article.id } });
              }
            }}
            className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        {tabs.map((t) => {
          const active = (tab ?? "all") === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => void navigate({ search: { tab: t.id, article: undefined } })}
              className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {showInitial ? (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <span className="font-medium text-foreground">Artigo sugerido pela URL</span>
          <p className="text-xs text-muted-foreground mt-1">{fromUrl.summary}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-primary hover:underline"
            onClick={() => setDrawerArticle(fromUrl)}
          >
            Abrir leitura
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              setDrawerArticle(a);
              void navigate({ search: { tab: tab ?? "all", article: a.id } });
            }}
            className="text-left rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors ring-soft"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {a.category}
            </div>
            <div className="text-sm font-semibold text-foreground mt-1">{a.title}</div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>
          </button>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-dashed border-border p-5 text-xs text-muted-foreground space-y-2">
        <div className="font-semibold text-foreground text-sm">Coleções</div>
        <p>
          Artigos: {help_center_articles.length} · Guias de onboarding: {onboarding_guides.length} ·
          FAQ: {operational_faq.length} · Documentação operacional:{" "}
          {operational_doc_sections.length}
        </p>
      </section>

      <HelpArticleDrawer
        open={!!drawerArticle}
        article={drawerArticle}
        onClose={() => {
          setDrawerArticle(null);
          void navigate({ search: { tab: tab ?? "all", article: undefined } });
        }}
      />
    </AppShell>
  );
}
