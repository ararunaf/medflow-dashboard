export type HelpArticleCategory = "article" | "guide" | "faq" | "doc";

export type HelpCenterArticle = {
  id: string;
  category: HelpArticleCategory;
  title: string;
  summary: string;
  body: string[];
  tags: string[];
  relatedRoute?: string;
};

/** Artigos e guias estáticos — leves, sem fetch remoto. */
export const help_center_articles: HelpCenterArticle[] = [
  {
    id: "ops-first-steps",
    category: "guide",
    title: "Primeiros passos após o login",
    summary: "Navegação essencial para equipe clínica e financeira.",
    body: [
      "Use a Home para ver a escala do dia e contadores em tempo real.",
      "Coordenadores acessam Escalas e Plantões para publicar e confirmar turnos.",
      "O módulo Financeiro concentra dashboard, conciliação e fechamento operacional.",
    ],
    tags: ["onboarding", "navegação"],
    relatedRoute: "/",
  },
  {
    id: "deploy-assisted",
    category: "article",
    title: "Implantação assistida (piloto)",
    summary: "Sequência recomendada com o time MedicFlow.",
    body: [
      "Dia 0: branding, contato institucional e seed de convênios de demonstração (se aplicável).",
      "Dia 1–2: cadastro de convênios reais, unidades e profissionais; revisão de papéis (RBAC).",
      "Dia 3: abertura de competência financeira e smoke tests na conciliação.",
      "Go-live controlado: monitore o Painel operacional e exporte diagnóstico em caso de incidente.",
    ],
    tags: ["implantação", "piloto"],
    relatedRoute: "/piloto",
  },
  {
    id: "pilot-launch-checklist",
    category: "article",
    title: "Checklist final de lançamento piloto",
    summary: "Itens mínimos antes de convidar usuários reais.",
    body: [
      "Branding e contato institucional configurados.",
      "Ao menos dois perfis ativos e papéis RBAC revisados com o sponsor.",
      "Convênios cadastrados ou catálogo demo apenas em ambiente controlado.",
      "Health operacional verde e export de diagnóstico arquivado pelo time MedicFlow.",
      "Demonstração guiada ensaiada com roteiro executivo de 15–20 minutos.",
    ],
    tags: ["piloto", "go-live"],
    relatedRoute: "/piloto",
  },
  {
    id: "permissions-overview",
    category: "doc",
    title: "Permissões (RBAC) na V1",
    summary: "Papéis fixos e capacidades principais.",
    body: [
      "Administrador do tenant: parametrização, branding, seed demo e reabertura de competência.",
      "Coordenador: escala completa, TISS com escrita e fechamento financeiro.",
      "Financeiro: leitura/escrita em repasses e fechamento sem gestão de escala global.",
      "Profissional: confirmação de próprios plantões, trocas e disponibilidade.",
      "Alterações sensíveis exigem papel adequado — não há elevação automática de privilégio.",
    ],
    tags: ["segurança", "RBAC"],
    relatedRoute: "/ajuda",
  },
];

export const onboarding_guides: HelpCenterArticle[] = [
  {
    id: "guide-branding",
    category: "guide",
    title: "Configurar branding multi-tenant",
    summary: "Logo, cores e banner para demo comercial.",
    body: [
      "Acesse Instituição e envie logo/banner dentro do limite de tamanho exibido na tela.",
      "Ajuste cores primárias e secundárias para alinhar ao manual da marca do cliente.",
      "Valide no mobile: o menu inferior reflete o branding carregado.",
    ],
    tags: ["branding", "instituição"],
    relatedRoute: "/instituicao",
  },
  {
    id: "guide-convenios",
    category: "guide",
    title: "Cadastro de convênios (base)",
    summary: "Antes de lotes TISS e faturamento operacional.",
    body: [
      "Cadastre operadoras e contratos ativos por tenant.",
      "Para piloto comercial, use o catálogo demo apenas em ambiente de demonstração.",
      "Valide ANS e vigência com o time de contratos do hospital.",
    ],
    tags: ["convênios", "TISS"],
    relatedRoute: "/tiss",
  },
  {
    id: "guide-wizard",
    category: "guide",
    title: "Quick setup wizard (6 passos)",
    summary: "Assistente guiado na tela Piloto.",
    body: [
      "Siga boas-vindas → branding → health → convênios → smoke financeiro → demo.",
      "O progresso é salvo por browser — cada administrador pode retomar de onde parou.",
      "Use junto ao checklist de implantação para validar go-live.",
    ],
    tags: ["wizard", "onboarding"],
    relatedRoute: "/piloto",
  },
  {
    id: "guide-health-check",
    category: "guide",
    title: "Validar saúde operacional",
    summary: "Antes de abrir acesso a usuários-chave.",
    body: [
      "Abra Painel operacional e confirme checks de banco e latência.",
      "Leia avisos de ambiente (variáveis VITE_) junto ao time de infraestrutura.",
      "Em incidentes, exporte backup operacional (JSON) com permissão de escrita institucional.",
    ],
    tags: ["ops", "monitoramento"],
    relatedRoute: "/operacao",
  },
];

export const operational_faq: HelpCenterArticle[] = [
  {
    id: "faq-login-tenant",
    category: "faq",
    title: "Não vejo dados após o login",
    summary: "Isolamento por tenant e sessão.",
    body: [
      "Confirme que o convite/usuário pertence ao tenant correto.",
      "Limpe cache do browser ou aba anônima para descartar sessão antiga.",
      "Se persistir, gere export de diagnóstico piloto e envie ao suporte.",
    ],
    tags: ["acesso", "sessão"],
  },
  {
    id: "faq-realtime",
    category: "faq",
    title: "Contadores não atualizam",
    summary: "Realtime e rede corporativa.",
    body: [
      "Redes com proxy agressivo podem bloquear WebSocket — teste em 4G ou VPN alternativa.",
      "Use o botão Atualizar nas telas com polling manual.",
      "Verifique health de latência no Painel operacional.",
    ],
    tags: ["rede", "realtime"],
    relatedRoute: "/operacao",
  },
  {
    id: "faq-branding",
    category: "faq",
    title: "Logo não aparece no menu",
    summary: "Upload e cache de branding.",
    body: [
      "Confirme upload concluído em Instituição e URL pública válida.",
      "Force refresh (Ctrl+F5) — favicon e logo usam cache do browser.",
      "Verifique bucket tenant-branding e políticas de storage no Supabase.",
    ],
    tags: ["branding"],
    relatedRoute: "/instituicao",
  },
  {
    id: "faq-demo-mode",
    category: "faq",
    title: "Como usar a demonstração guiada?",
    summary: "Modo comercial por sessão.",
    body: [
      "Ative em Piloto e implantação — válido apenas na aba atual do browser.",
      "A faixa inferior guia cada passo; use Próximo após narrar a tela.",
      "Encerre ao final para não confundir usuários em operação real.",
    ],
    tags: ["demo", "comercial"],
    relatedRoute: "/piloto",
  },
  {
    id: "faq-closing-block",
    category: "faq",
    title: "Não consigo alterar competência fechada",
    summary: "Travas de fechamento operacional.",
    body: [
      "Competências locked/finalized exigem papel com permissão de reabertura.",
      "Fluxo correto: revisão financeira → validação → lock após auditoria.",
      "Em piloto, evite finalizar competência de teste até concluir os smoke tests.",
    ],
    tags: ["fechamento", "competência"],
    relatedRoute: "/financeiro/fechamento-operacional",
  },
];

/** Documentação operacional textual (TISS, financeiro, conciliação). */
export const operational_doc_sections: HelpCenterArticle[] = [
  {
    id: "doc-tiss-intro",
    category: "doc",
    title: "Guia TISS (visão V1)",
    summary: "Escopo do módulo e boas práticas de piloto.",
    body: [
      "A V1 cobre fluxo operacional de lotes e acompanhamento — sem motor fiscal completo.",
      "Mantenha competência coerente com o fechamento financeiro do mesmo mês.",
      "Documente exceções de glosa manualmente durante o piloto.",
    ],
    tags: ["TISS"],
    relatedRoute: "/tiss",
  },
  {
    id: "doc-reconciliation",
    category: "doc",
    title: "Conciliação operacional",
    summary: "Alinhamento produção vs. faturamento.",
    body: [
      "Importe ou sincronize bases conforme playbook acordado no piloto.",
      "Priorize divergências por valor e por convênio para reduzir ruído.",
      "Registre comentários de auditoria para rastreabilidade entre equipes.",
    ],
    tags: ["conciliação"],
    relatedRoute: "/financeiro/conciliacao-operacional",
  },
  {
    id: "doc-financial-close",
    category: "doc",
    title: "Fechamento operacional",
    summary: "Estados e responsabilidades.",
    body: [
      "Fluxo sugerido: rascunho → revisão → validação → lock.",
      "Reabertura é exceção: exige papel administrativo e justificativa.",
      "Após lock, sincronismos sensíveis de repasse ficam bloqueados por política.",
    ],
    tags: ["fechamento"],
    relatedRoute: "/financeiro/fechamento-operacional",
  },
  {
    id: "doc-finance-hub",
    category: "doc",
    title: "Hub financeiro (visão V1)",
    summary: "Navegação entre módulos financeiros no piloto.",
    body: [
      "O hub concentra links para dashboard executivo, fechamento e conciliação.",
      "Valores estáticos na landing são ilustrativos — KPIs reais estão no dashboard.",
      "Siga o smoke test do wizard antes de apresentar números a stakeholders.",
    ],
    tags: ["financeiro"],
    relatedRoute: "/financeiro",
  },
  {
    id: "doc-permissions-matrix",
    category: "doc",
    title: "Matriz de permissões por papel",
    summary: "Referência rápida para implantação.",
    body: [
      "tenant_admin: instituição, piloto, painel ops, seed demo.",
      "coordinator: escala completa, TISS escrita, fechamento.",
      "financial: repasses e fechamento sem gestão global de escala.",
      "professional: plantões próprios, trocas, disponibilidade.",
    ],
    tags: ["RBAC", "permissões"],
    relatedRoute: "/ajuda",
  },
  {
    id: "doc-executive-dashboard",
    category: "doc",
    title: "Guias financeiros — dashboard executivo",
    summary: "Leitura para diretoria no piloto.",
    body: [
      "Use competência explícita ao comparar períodos.",
      "KPIs refletem dados consolidados do tenant — não há consolidação multi-tenant.",
      "Combine com exportações e relatórios externos até a maturidade de BI desejada.",
    ],
    tags: ["financeiro", "KPI"],
    relatedRoute: "/financeiro/dashboard-executivo",
  },
];

export function allHelpContent(): HelpCenterArticle[] {
  return [
    ...help_center_articles,
    ...onboarding_guides,
    ...operational_faq,
    ...operational_doc_sections,
  ];
}

export function getArticleById(id: string): HelpCenterArticle | undefined {
  return allHelpContent().find((a) => a.id === id);
}

export function searchHelpContent(query: string): HelpCenterArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return allHelpContent();
  return allHelpContent().filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.body.some((p) => p.toLowerCase().includes(q)),
  );
}

/** Atalhos para cards na central de ajuda. */
export const help_quick_links = [
  { label: "Implantação piloto", route: "/piloto", articleId: "deploy-assisted" },
  { label: "Primeiros passos", route: "/", articleId: "ops-first-steps" },
  { label: "TISS", route: "/tiss", articleId: "doc-tiss-intro" },
  { label: "Permissões", route: "/ajuda", articleId: "permissions-overview" },
] as const;
