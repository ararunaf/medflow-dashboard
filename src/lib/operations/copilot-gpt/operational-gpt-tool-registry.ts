/**
 * Registro canônico de tools read-only expostas ao modelo (OpenAI function calling).
 * Nomes estáveis para telemetria e futura orquestração.
 */
export type OpenAiToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export const OPERATIONAL_GPT_READ_ONLY_TOOL_NAMES = [
  "get_operational_timeline",
  "get_shift_details",
  "get_swap_details",
  "get_operational_kpis",
  "get_forecast_snapshot",
  "get_recommendation_details",
  "get_recent_alerts",
  "get_operational_events",
] as const;

export type OperationalGptReadOnlyToolName = (typeof OPERATIONAL_GPT_READ_ONLY_TOOL_NAMES)[number];

export const OPERATIONAL_GPT_SUPERVISED_PROPOSAL_TOOL_NAMES = [
  "submit_operational_action_proposal",
] as const;

export type OperationalGptSupervisedProposalToolName =
  (typeof OPERATIONAL_GPT_SUPERVISED_PROPOSAL_TOOL_NAMES)[number];

export const OPERATIONAL_GPT_TOOL_NAMES = [
  ...OPERATIONAL_GPT_READ_ONLY_TOOL_NAMES,
  ...OPERATIONAL_GPT_SUPERVISED_PROPOSAL_TOOL_NAMES,
] as const;

export type OperationalGptToolName = (typeof OPERATIONAL_GPT_TOOL_NAMES)[number];

export function isOperationalGptReadOnlyToolName(
  name: string,
): name is OperationalGptReadOnlyToolName {
  return (OPERATIONAL_GPT_READ_ONLY_TOOL_NAMES as readonly string[]).includes(name);
}

export function isOperationalGptToolName(name: string): name is OperationalGptToolName {
  return (OPERATIONAL_GPT_TOOL_NAMES as readonly string[]).includes(name);
}

const scopeFields = {
  scopeKind: {
    type: "string",
    enum: ["global", "shift", "professional", "swap"],
    description: "Escopo da timeline: tenant inteiro, plantão, profissional ou swap.",
  },
  shiftId: { type: "string", description: "UUID do plantão (obrigatório se scopeKind=shift)." },
  professionalId: {
    type: "string",
    description: "UUID do profissional (obrigatório se scopeKind=professional).",
  },
  swapId: { type: "string", description: "UUID da troca (obrigatório se scopeKind=swap)." },
} as const;

export const OPERATIONAL_GPT_TOOL_DEFINITIONS: OpenAiToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_operational_timeline",
      description:
        "Lista paginada de eventos operacionais (timeline auditável) para drill-down. Somente leitura; respeita tenant e RBAC. Retorna IDs de eventos para proveniência (timeline_event:id).",
      parameters: {
        type: "object",
        properties: {
          ...scopeFields,
          limit: { type: "integer", description: "1–40 (default 20)." },
          cursorCreatedAt: {
            type: "string",
            description: "Keyset: created_at do último item da página anterior.",
          },
          cursorId: {
            type: "string",
            description: "Keyset: id do último item da página anterior.",
          },
          severity: {
            type: "string",
            enum: ["info", "warning", "critical"],
            description: "Filtro opcional por severidade.",
          },
          entityType: {
            type: "string",
            description:
              "Filtro opcional por tipo de entidade (ex.: shift, swap, assignment) quando aplicável ao catálogo do tenant.",
          },
        },
        required: ["scopeKind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_operational_events",
      description:
        "Primeira página de eventos globais do tenant (feed operacional recente), com filtros opcionais. Equivalente leve a timeline global sem escopo específico.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", description: "1–40 (default 25)." },
          severity: { type: "string", enum: ["info", "warning", "critical"] },
          entityType: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shift_details",
      description:
        "Detalhes read-only de um plantão (escala, setor, status, atribuições pendentes/confirmadas). Use shiftId UUID.",
      parameters: {
        type: "object",
        properties: {
          shiftId: { type: "string", description: "UUID do plantão." },
        },
        required: ["shiftId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_swap_details",
      description:
        "Detalhes read-only de uma solicitação de troca (status, solicitante, alvo, janela do plantão). Use swapId UUID.",
      parameters: {
        type: "object",
        properties: {
          swapId: { type: "string", description: "UUID da troca." },
        },
        required: ["swapId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_operational_kpis",
      description:
        "KPIs e deltas do período analítico (28d vs 28d anterior), tendências resumidas e scoring de referência. Usa cache de serviço existente.",
      parameters: {
        type: "object",
        properties: {
          includeTrendSamples: {
            type: "boolean",
            description: "Se true, inclui amostra curta de tendências diárias (cobertura/pressão).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_forecast_snapshot",
      description:
        "Baseline de forecast operacional (projeção estável/deterioração/crítica) com rationale auditável e referências às recomendações do snapshot vivo.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recommendation_details",
      description:
        "Detalha uma recomendação operacional por ID estável (recommendation:id), incluindo because[], scores e alertas vinculados quando houver.",
      parameters: {
        type: "object",
        properties: {
          recommendationId: {
            type: "string",
            description: "ID da recomendação (ex.: mitigation_...).",
          },
        },
        required: ["recommendationId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_alerts",
      description:
        "Alertas operacionais determinísticos atuais (regras engine) com IDs de regra (alert:id) e severidade.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", description: "Máximo de alertas (default 16, máx 24)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_operational_action_proposal",
      description:
        "Registra uma PROPOSTA operacional supervisionada (não executa nada). Use quando houver plano claro, com rationale e referências a scores/forecast/alertas/timeline/recomendações obtidos via outras tools. A proposta fica em fila humana (governança). Máx. 1–2 chamadas por pergunta; não use em loop. Campos devem ser curtos.",
      parameters: {
        type: "object",
        properties: {
          actionKind: {
            type: "string",
            enum: [
              "staffing_adjustment",
              "escalation",
              "mitigation",
              "coordination",
              "operational_review",
              "assignment_suggestion",
            ],
            description: "Categoria da ação sugerida (sem execução automática).",
          },
          title: {
            type: "string",
            description: "Título curto e operacional (≤120 caracteres recomendado).",
          },
          summary: {
            type: "string",
            description: "Resumo executivo em 1–3 frases para cartão na UI.",
          },
          operationalRationale: {
            type: "string",
            description:
              "Justificativa operacional explícita, ligando contexto a risco/cobertura/coordenação.",
          },
          references: {
            type: "array",
            description:
              "Proveniência mínima (ex.: score:coverage_risk_score, forecast:baseline, alert:id, timeline_event:uuid, recommendation:id).",
            items: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  enum: ["score", "forecast", "alert", "timeline_event", "recommendation"],
                },
                ref: { type: "string" },
                note: { type: "string" },
              },
              required: ["kind", "ref"],
            },
          },
          payload: {
            type: "object",
            description:
              "Metadados opcionais pequenos (ex.: shiftIds sugeridos) — NÃO executa mutações; apenas contexto futuro.",
            additionalProperties: true,
          },
          requestImmediateConfirmation: {
            type: "boolean",
            description:
              "Se true, a proposta entra direto em awaiting_confirmation (fila de aprovação). Se false/omitido, fica suggested.",
          },
        },
        required: ["actionKind", "title", "summary", "operationalRationale", "references"],
      },
    },
  },
];
