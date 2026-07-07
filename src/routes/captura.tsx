import { createFileRoute } from "@tanstack/react-router";
import { CapturaPage } from "@/modules/capture/pages/CapturaPage";
import { brandPageTitle } from "@/lib/assets";

export const Route = createFileRoute("/captura")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Captura Inteligente") },
      {
        name: "description",
        content: "Capture guias TISS por câmera ou upload — pipeline supervisionado.",
      },
    ],
  }),
  component: CapturaPage,
});
