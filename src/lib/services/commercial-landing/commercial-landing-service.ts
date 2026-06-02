import { BRANDING } from "@/lib/assets/branding";

import { getInstitutionalContactEmail } from "@/lib/env/startup-checks";

import { getInstitutionalDomain } from "@/lib/env/startup-checks";



export type LandingModule = {

  id: string;

  title: string;

  description: string;

};



export type CommercialLandingContent = {

  productName: string;

  tagline: string;

  summary: string;

  benefits: string[];

  modules: LandingModule[];

  ctaDemoLabel: string;

  ctaDemoHref: string;

  contactEmail: string;

  contactLabel: string;

  appUrl?: string;

};



/** Conteúdo estático leve — sem fetch pesado. */

export function getCommercialLandingContent(): CommercialLandingContent {

  const appUrl = getInstitutionalDomain();

  const loginHref = appUrl ? `${appUrl.replace(/\/$/, "")}/login` : "/login";



  return {

    productName: BRANDING.productName,

    tagline: BRANDING.tagline,

    summary:

      "Plataforma operacional hospitalar para escalas, plantões, faturamento TISS, fechamento financeiro e conciliação — com governança por tenant e readiness para implantação piloto.",

    benefits: [

      "Operação unificada: escalas, plantões e indicadores em tempo real",

      "Financeiro operacional: fechamento, repasses e conciliação supervisionada",

      "Multi-tenant com branding institucional e RBAC",

      "Observabilidade, backup exportável e checklists de go-live",

      "Onboarding assistido para primeiros clientes pagantes",

    ],

    modules: [

      {

        id: "escalas",

        title: "Escalas e plantões",

        description: "Gestão de turnos, disponibilidade e cobertura operacional.",

      },

      {

        id: "tiss",

        title: "TISS e faturamento",

        description: "Lotes, glosas e produção médica integrada à operação.",

      },

      {

        id: "financeiro",

        title: "Fechamento financeiro",

        description: "Competências, repasses e dashboard executivo.",

      },

      {

        id: "conciliacao",

        title: "Conciliação operacional",

        description: "Esperado vs recebido com trilha de auditoria.",

      },

      {

        id: "piloto",

        title: "Piloto e implantação",

        description: "Wizard, checklists e feedback para lançamento comercial.",

      },

    ],

    ctaDemoLabel: "Solicitar demonstração",

    ctaDemoHref: `mailto:${getInstitutionalContactEmail()}?subject=Demonstração%20${encodeURIComponent(BRANDING.productName)}%20V1`,

    contactEmail: getInstitutionalContactEmail(),

    contactLabel: "Contato institucional",

    appUrl,

  };

}


