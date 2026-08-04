import { createFileRoute, notFound } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { PHASE3_PLACEHOLDERS } from "@/lib/navigation";
import { Phase3PlaceholderPage } from "@/components/navigation/phase3-placeholder";

export const Route = createFileRoute("/fase3/$slug")({
  beforeLoad: ({ params }) => {
    if (!(params.slug in PHASE3_PLACEHOLDERS)) {
      throw notFound();
    }
  },
  head: ({ params }) => {
    const meta = PHASE3_PLACEHOLDERS[params.slug];
    return {
      meta: [
        { title: brandPageTitle(meta?.title ?? "Fase 3") },
        {
          name: "description",
          content: meta?.description ?? "Disponível na Fase 3",
        },
      ],
    };
  },
  component: Fase3PlaceholderRoute,
});

function Fase3PlaceholderRoute() {
  const { slug } = Route.useParams();
  const meta = PHASE3_PLACEHOLDERS[slug];
  if (!meta) return null;
  return (
    <Phase3PlaceholderPage
      title={meta.title}
      groupLabel={meta.groupLabel}
      description={meta.description}
    />
  );
}
