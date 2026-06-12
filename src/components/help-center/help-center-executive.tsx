import { Link } from "@tanstack/react-router";
import { HELP_CENTER_ASSETS } from "@/lib/assets/help-center";
import {
  ArrowRight,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileSliders,
  GitBranch,
  Presentation,
  Rocket,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { HelpSection, ImageLightbox, ImagePreviewCard } from "./image-lightbox";

const IA_FEATURES = [
  "Copilot GPT",
  "Central de IA Operacional",
  "Alertas Inteligentes",
  "Recomendações Operacionais",
  "Forecast de Risco",
  "Agentes Operacionais",
  "Narrativa Executiva",
  "Human-in-the-loop",
] as const;

const FIRST_STEPS = [
  {
    title: "Configurar Instituição",
    description: "Branding, contato e parametrização multi-tenant.",
    icon: Building2,
    to: "/instituicao" as const,
  },
  {
    title: "Criar Escalas",
    description: "Calendário de 14 dias e publicação de turnos.",
    icon: Calendar,
    to: "/escalas" as const,
  },
  {
    title: "Publicar Plantões",
    description: "Captação, confirmação e trocas de turno.",
    icon: ClipboardList,
    to: "/plantoes" as const,
  },
  {
    title: "Acompanhar Operação",
    description: "Central em tempo real, alertas e cobertura.",
    icon: GitBranch,
    to: "/central" as const,
  },
  {
    title: "Utilizar IA Operacional",
    description: "Copilot, agentes e recomendações supervisionadas.",
    icon: Brain,
    to: "/central" as const,
  },
  {
    title: "Fechar Competência Financeira",
    description: "Fechamento auditável, TISS e repasses.",
    icon: Wallet,
    to: "/financeiro/fechamento-operacional" as const,
  },
] as const;

const { workflowImage, workflowDownloadName, presentation } = HELP_CENTER_ASSETS;

export function HelpCenterExecutive() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="space-y-6 mb-10">
      <HelpSection
        id="sobre"
        icon={<Sparkles className="h-4 w-4" />}
        title="Sobre o MedicFlow-AI"
        subtitle="Visão institucional da plataforma"
      >
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            MedicFlow-AI é uma plataforma inteligente para gestão operacional de hospitais,
            cooperativas médicas e grupos de plantonistas.
          </p>
          <p>
            Ela integra operação, escalas, plantões, TISS, financeiro e inteligência operacional
            em um único ambiente.
          </p>
        </div>
      </HelpSection>

      <HelpSection
        id="workflow"
        icon={<GitBranch className="h-4 w-4" />}
        title="Como Funciona o MedicFlow-AI"
        subtitle="Workflow Operacional da Plataforma"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Da captação de plantões ao fechamento financeiro e indicadores executivos.
        </p>
        <ImagePreviewCard
          src={workflowImage}
          alt="Workflow Operacional da Plataforma MedicFlow-AI"
          downloadName={workflowDownloadName}
          onExpand={() => setLightboxOpen(true)}
        />
      </HelpSection>

      <HelpSection
        id="apresentacao"
        icon={<Presentation className="h-4 w-4" />}
        title="Apresentação Corporativa"
        subtitle="Material institucional para hospitais, cooperativas e investidores"
      >
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
              <FileSliders className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{presentation.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {presentation.slideCount} slides · PowerPoint executivo
              </p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {presentation.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href={presentation.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visualizar
                </a>
                <a
                  href={presentation.pptxPath}
                  download={`${presentation.fileName}.pptx`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Visualização em PDF no navegador. Download disponível em formato PowerPoint (.pptx).
              </p>
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection
        id="ia"
        icon={<Brain className="h-4 w-4" />}
        title="Central de IA"
        subtitle="Inteligência operacional já disponível na V1"
        accent="violet"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Recursos de IA operacional integrados à plataforma, com supervisão humana em todas as
          ações sensíveis.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 mb-5">
          {IA_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Link
          to="/central"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-600/90"
        >
          Abrir Central de IA
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </HelpSection>

      <HelpSection
        id="primeiros-passos"
        icon={<Rocket className="h-4 w-4" />}
        title="Primeiros Passos"
        subtitle="Onboarding operacional recomendado"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIRST_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.title}
                to={step.to}
                className="group rounded-xl border border-border bg-muted/10 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Passo {index + 1}
                    </div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{step.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </HelpSection>

      <ImageLightbox
        open={lightboxOpen}
        src={workflowImage}
        alt="Workflow Operacional da Plataforma MedicFlow-AI"
        downloadName={workflowDownloadName}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
