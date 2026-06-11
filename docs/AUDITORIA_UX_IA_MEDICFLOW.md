# Auditoria UX da IA — MedicFlow-AI

**Data:** 11 de junho de 2026  
**Escopo:** Experiência do usuário e percepção de valor da camada de IA  
**Método:** Evidência em telas, rotas, menus, rótulos, demos e documentação comercial — sem alteração de código  
**Base técnica:** [AUDITORIA_IA_MEDICFLOW_COMPLETA.md](./AUDITORIA_IA_MEDICFLOW_COMPLETA.md) (18 módulos mapeados)

---

## Respostas executivas

| Pergunta | Resposta |
|----------|----------|
| **O cliente percebe que existe IA no sistema?** | **Parcialmente.** Managers que chegam a `/central` veem rótulos explícitos (“Copiloto operacional (IA)”, “Sugerida (IA)”, “Agentes operacionais”). Usuários que ficam em Home, Plantões ou Escalas **não percebem IA**. O nome do produto é “MedicFlow-AI”, mas a navegação principal não comunica inteligência artificial. |
| **O cliente entende o valor da IA em 10 minutos?** | **Não, no roteiro comercial atual.** O demo de 10 minutos documentado **corta explicitamente a IA operacional** e mostra `/central` apenas como “alertas proativos”, sem Copilot, agentes ou scoring. |
| **A IA está visível, compreensível e vendável?** | **Visível para quem sabe onde procurar; pouco compreensível para leigos; vendável apenas em demo de 40 min com perfil coordinator e chave OpenAI.** |

### Notas gerais

| Dimensão | Nota (0–10) | Justificativa |
|----------|:-----------:|---------------|
| **UX da IA** | **4,8** | Stack rica concentrada em uma rota oculta do menu; nomenclatura mista (técnica + clara); RBAC esconde 60% dos painéis de médicos; demo padrão omite IA. |
| **Potencial comercial da IA** | **7,2** | Diferenciais reais (Copilot GPT, scoring, agentes supervisionados, human-in-the-loop) são fortes quando demonstrados; gap é descoberta e narrativa, não capacidade. |

### Os 5 maiores problemas atuais

1. **`/central` ausente do menu lateral** — `navForRole()` em `app-shell.tsx` lista 13 itens; nenhum aponta para `/central`. Descoberta depende de link discreto na Home ou Executivo.
2. **Marca “IA” não traduzida em navegação** — Título da página: “Central operacional”, não “Central de IA”. Links: “Central operacional →”. Cliente associa a dashboard operacional, não a inteligência artificial.
3. **Demo comercial padrão (10 e 20 min) exclui IA** — `MEDICFLOW_DEMO_COMERCIAL.md` lista IA em “O que cortar”. Cliente típico nunca vê Copilot nem agentes.
4. **IA invisível nas rotas de maior uso** — `/plantoes`, `/escalas`, `/` não exibem sinais, scores ou sugestões de IA. 80% do tempo do usuário médico é sem percepção de IA.
5. **Página única com scroll longo e jargão** — Copilot GPT fica após ~8 painéis; termos como “Scoring operacional”, “Bundle determinístico”, “Fingerprint”, “Priorização adaptativa” exigem tradução oral do vendedor.

### Os 10 maiores diferenciais atuais

1. **Copiloto GPT em português** — Chat + narrativa executiva com guardrails read-only (`operational-copilot-gpt-panel.tsx`).
2. **Scoring de saúde operacional em tempo real** — Quatro dimensões (cobertura, coordenação, força de trabalho, saúde geral) com badges Saudável/Atenção/Alerta/Crítico.
3. **Recomendações acionáveis com feedback humano** — Mitigação, staffing, escalação; estados Sugerido/Recomendado/Urgente.
4. **Alertas proativos com Realtime** — Feed contextual com severidade e ações diretas para Plantões/Escalas.
5. **Quatro agentes especializados supervisionados** — Cobertura, Coordenação, Risco, Recomendações; política `no_autonomous_execution`.
6. **Human-in-the-loop auditável** — Propostas → sandbox → execução → rollback; estado “Sugerida (IA)” explícito.
7. **Forecast de deterioração** — Badge “Baseline estável / deterioração / projeção crítica” nas recomendações.
8. **Explicabilidade** — Fingerprints, tool trace no Copilot, referências a scores nas explicações dos agentes.
9. **Narrativa executiva sob demanda** — Botão “Narrativa executiva” gera resumo para diretoria em linguagem natural.
10. **Marca e posicionamento** — Produto “MedicFlow-AI”, tagline “Inteligência que conecta. Operação que transforma.”

### As 10 melhorias de maior impacto comercial

| # | Melhoria | Impacto | Esforço |
|---|----------|---------|---------|
| 1 | Adicionar “Central de IA” ou “Central operacional (IA)” no menu lateral | Descoberta imediata | Quick win |
| 2 | Renomear subtítulo da `/central` para mencionar IA | Clareza na primeira impressão | Quick win |
| 3 | Card na Home: “IA detectou X riscos de cobertura” com link | Ponte entre operação e IA | Quick win |
| 4 | Etapa dedicada de IA no demo guiado `/piloto` | Onboarding comercial | Curto prazo |
| 5 | Badge “IA” no quick action do Executivo | Reforço para diretoria | Quick win |
| 6 | Roteiro comercial de 10 min **com** IA (substituir corte atual) | Valor percebido em primeira reunião | Curto prazo |
| 7 | Renomear “Scoring operacional” → “Índice de risco da operação (IA)” | Clareza para não técnicos | Quick win |
| 8 | Ancorar Copilot no topo da página (ou aba “Copiloto”) | Wow factor sem scroll | Curto prazo |
| 9 | Artigos na Central de Ajuda sobre Copilot e agentes | Autodescoberta pós-venda | Curto prazo |
| 10 | Incluir módulo IA na landing `/site` | Expectativa alinhada pré-demo | Médio prazo |

---

## Fase 1 — Inventário de visibilidade

**Superfície única de UX:** rota `/central` → `CommandCenterView`  
**Evidência:** `src/routes/central.tsx`, `src/components/operational/command-center-view.tsx`

| Recurso | Tela | Visível ao usuário? | Nível de visibilidade |
|---------|------|:-------------------:|----------------------|
| 1. Copilot GPT (OpenAI) | `/central` — painel “Copiloto operacional (IA)” | Managers apenas (`coordinator`, `tenant_admin`, `super_admin`) | **Alta** (dentro da central) / **Baixa** (global — fora do menu) |
| 2. Contexto do copiloto | `/central` — “Contexto operacional (copiloto)” | Managers apenas | **Média** |
| 3. Scoring operacional | `/central` — topo da página | Todos autenticados que abrem `/central` | **Alta** (na central) / **Baixa** (global) |
| 4. Recomendações operacionais | `/central` | Todos na central; feedback só managers | **Alta** (na central) / **Baixa** (global) |
| 5. Forecast baseline | `/central` — dentro de recomendações | Todos na central | **Média** |
| 6. Alertas operacionais | `/central` — feed + badges no header | Todos na central | **Alta** (na central) / **Média** (global — parecem “alertas”, não “IA”) |
| 7. Analytics operacional | `/central` — painel inferior | Managers apenas | **Média** |
| 8. Priorização adaptativa | `/central` | Todos veem; governança managers | **Baixa** — rótulo técnico |
| 9. Memória operacional | `/central` | Todos veem; governança managers | **Baixa** |
| 10. Policy intelligence | `/central` — “Inteligência operacional de políticas” | Todos veem; governança managers | **Baixa** |
| 11. Planejamento estratégico | `/central` | Managers (dados gated no loader) | **Baixa** |
| 12. Agentes operacionais (4 tipos) | `/central` — “Agentes operacionais ativos” | Managers apenas | **Média** (na central) / **Invisível** (global) |
| 13. Coordenação multi-agente | `/central` — “Coordenação colaborativa” | Managers apenas | **Baixa** |
| 14. Orquestração supervisionada | `/central` — “Orquestração operacional” | Managers apenas | **Baixa** |
| 15. Propostas de ação (IA → humano) | `/central` — “Propostas operacionais (IA supervisionada)” | Managers apenas | **Média** |
| 16. Sandbox de simulação | `/central` — embutido em propostas | Managers apenas | **Baixa** |
| 17. Execução supervisionada + rollback | `/central` — embutido em propostas aprovadas | Managers apenas | **Baixa** |
| 18. Tools GPT (9 funções server-side) | `/central` — trace na resposta do Copilot | Managers com chave OpenAI | **Média** (após interação) |
| 19. Discoverability da central (gap UX) | — | Não é recurso funcional, mas impacta todos os módulos | **Invisível** no menu |

**Legenda de visibilidade global:** considera menu, Home, rotas de uso diário e demo padrão — não apenas existência dentro de `/central`.

---

## Fase 2 — Auditoria de descoberta

### Um usuário novo consegue descobrir sozinho?

| Recurso | Descoberta autônoma | Evidência |
|---------|:-------------------:|-----------|
| Copilot GPT | **Não** | Painel oculto para não-managers; rota `/central` fora do menu; sem item “IA” ou “Copiloto” |
| Contexto copiloto | **Não** | Mesmas barreiras + rótulo “copiloto” sem destaque na navegação |
| Scoring operacional | **Parcialmente** | Visível em `/central`, mas central só descoberta via link na Home ou URL direta |
| Recomendações | **Parcialmente** | Idem scoring |
| Forecast baseline | **Não** | Embutido em recomendações; badge técnico (“projeção crítica”) |
| Alertas operacionais | **Parcialmente** | Demo de 10 min mostra `/central` como alertas; usuário pode associar a “monitoramento”, não IA |
| Analytics operacional | **Não** | Managers + scroll profundo na página |
| Priorização adaptativa | **Não** | Nomenclatura técnica, sem entrada no menu |
| Memória operacional | **Não** | Idem |
| Policy intelligence | **Não** | Idem |
| Planejamento estratégico | **Não** | Idem |
| Agentes (4 tipos) | **Não** | Managers + final da página + ausência no menu |
| Coordenação multi-agente | **Não** | Idem |
| Orquestração | **Não** | Idem |
| Propostas supervisionadas | **Não** | Descoberta via Copilot ou scroll; empty state referencia tool técnica |
| Sandbox / Execução | **Não** | Fluxo longo dentro de propostas |
| Tools GPT | **Não** | Só após pergunta ao Copilot |
| Central operacional (hub) | **Parcialmente** | Link “Central operacional →” na Home (`index.tsx` L134–138); quick action no Executivo com ícone Sparkles; **ausente** no menu lateral e mobile |

### A IA aparece no menu?

| Canal de navegação | IA presente? | O que aparece | O que está oculto |
|--------------------|:------------:|---------------|-------------------|
| **Menu lateral** (`app-shell.tsx`) | **Não** | Home, Piloto, Executivo, Escalas, Plantões, Financeiro, TISS, etc. | `/central` inteira; nenhum item “IA”, “Copiloto”, “Agentes” |
| **Menu mobile (bottom nav)** | **Não** | Mesmos itens filtrados por role | Idem |
| **Dashboard Home (`/`)** | **Indireto** | Link texto “Central operacional →”; métricas operacionais sem menção IA | Copilot, agentes, scoring como “IA” |
| **Executivo (`/executivo`)** | **Indireto** | Quick action “Central operacional” com ícone Sparkles | Sem rótulo “IA”; sem painéis de IA na própria tela |
| **Piloto / demo guiada** | **Indireto** | Passo 3 → `/central` com highlight “Indicadores e foco de pressão assistencial” — **sem menção a IA, Copilot ou agentes** | Etapa IA explícita ausente |
| **Plantões / Escalas** | **Não** | CRUD manual | Toda camada de IA |
| **Financeiro / TISS** | **Não** | KPIs rule-based | IA financeira inexistente |
| **Ajuda (`/ajuda`)** | **Não** | Sem artigos sobre central, copilot ou scoring | Autodescoberta pós-venda |
| **Landing `/site`** | **Branding apenas** | Nome “MedicFlow-AI”, tagline com “Inteligência” | Módulos de IA não listados |
| **URL direta** | **Sim** | `/central` funcional para qualquer autenticado | Depende de conhecimento prévio |

---

## Fase 3 — Auditoria de valor percebido

| Recurso | Rótulo atual (evidência) | Benefício em linguagem de cliente | Clareza |
|---------|--------------------------|-----------------------------------|---------|
| Copilot GPT | “Copiloto operacional (IA)” | “Pergunte em português qual o maior risco de cobertura agora” | **Muito Claro** |
| Contexto copiloto | “Contexto operacional (copiloto)” + “Bundle determinístico” | “Resumo inteligente da operação para o escalista” | **Pouco Claro** |
| Scoring | “Scoring operacional” + “Risco sintético” | “A IA mede se a operação está saudável ou em risco de falta de médicos” | **Pouco Claro** |
| Recomendações | “Recomendações operacionais” | “A IA sugere o que fazer agora: convocar, remanejar, escalar” | **Claro** |
| Forecast | “Baseline estável / deterioração / projeção crítica” | “A IA antecipa se a situação vai piorar no fim de semana” | **Claro** |
| Alertas | “Alertas operacionais” + footer “Regras explícitas” | “Alertas automáticos antes do plantão ficar descoberto” | **Claro** (mas não comunica “IA”) |
| Analytics | “Analytics operacional” | “Histórico e tendências para decisão de gestão” | **Pouco Claro** |
| Priorização adaptativa | “Priorização adaptativa” | “A IA reordena o que é mais urgente com base no que funcionou antes” | **Confuso** |
| Memória operacional | “Memória operacional” | “A IA lembra quais ações deram resultado” | **Pouco Claro** |
| Policy intelligence | “Inteligência operacional de políticas” | “A IA sugere ajustes nas regras de governança” | **Confuso** |
| Planejamento estratégico | “Planejamento estratégico supervisionado” | “Roadmap operacional assistido para os próximos ciclos” | **Pouco Claro** |
| Agentes | “Agentes operacionais ativos” + domínios legíveis | “Especialistas virtuais analisam cobertura, risco e coordenação — sem agir sozinhos” | **Claro** (com explicação oral) |
| Coordenação multi-agente | “Coordenação colaborativa” | “Vários especialistas virtuais trabalham juntos sob supervisão” | **Pouco Claro** |
| Orquestração | “Orquestração operacional” | “Fluxos de resposta coordenados com aprovação humana” | **Confuso** |
| Propostas | “Propostas operacionais (IA supervisionada)” + “Sugerida (IA)” | “A IA propõe ações; o humano aprova antes de executar” | **Muito Claro** |
| Sandbox | Embutido — “Simulação” | “Teste o impacto antes de aplicar na operação” | **Claro** (se demonstrado) |
| Execução supervisionada | Embutido em propostas | “Mudanças aplicadas com trilha e possibilidade de reversão” | **Claro** (se demonstrado) |
| Tools GPT | “Contexto expandido (tools…)” | “O copiloto consulta dados reais do hospital para responder” | **Confuso** |

---

## Fase 4 — Auditoria de demonstração comercial

### Simulação: 5 minutos

| O que aparece | Cliente percebe IA? | Impacto |
|---------------|:-------------------:|---------|
| Login + Home (métricas do dia) | **Não** | Percepção de “sistema de plantões organizado” |
| Link “Central operacional” (se clicado) | **Parcialmente** | Vê alertas e talvez scoring — associa a “painel de monitoramento”, não necessariamente IA |
| Plantões (captação) | **Não** | Fluxo manual forte; IA ausente |
| Marca “MedicFlow-AI” no título do browser | **Fraco** | Nome sugere IA; interface não confirma |

**Impacto comercial em 5 min:** interesse em operação digital; **diferencial de IA não percebido**.

### Simulação: 10 minutos (roteiro documentado atual)

**Recursos que aparecem:** Dashboard, Plantões, Central (alertas RT), Executivo — **IA operacional explicitamente cortada** (`MEDICFLOW_DEMO_COMERCIAL.md` §8.2).

| Etapa | IA visível? |
|-------|:-----------:|
| `/central` (2 min) | Alertas + KPIs; scoring e recomendações se apresentador rolar; **Copilot e agentes improváveis** |
| Restante | Zero IA |

**O que deveria ser demonstrado (recomendação desta auditoria):** ver `DEMO_IA_10_MINUTOS.md`.

### Simulação: 20 minutos (roteiro documentado atual)

- Central 3 min — alertas; IA mencionada como “add-on”, não demonstrada.
- **Copilot, agentes, propostas:** ausentes.

### Simulação: 40 minutos (roteiro documentado atual)

| Etapa | Recursos IA | Sequência ideal |
|-------|-------------|-----------------|
| 5 — `/central` (4 min) | Alertas, scoring, recomendações, timeline | Base operacional |
| 10 — `/central` IA (4 min) | Copilot GPT, agentes, orquestração (overview) | **Diferencial** — requer `coordinator` + OpenAI key |

**Recursos adicionais de valor em 20+ min (além do roteiro 40 min):**

- Narrativa executiva (wow para diretoria)
- Agente de cobertura com ciclo de raciocínio
- Proposta supervisionada (sem executar em prod)
- Forecast “projeção crítica”
- Feedback em recomendações (loop de aprendizado)
- Policy intelligence (para administradores)

---

## Fase 5 — Pontuação de maturidade UX

Escala 0–10 por critério. Média por módulo = média dos 5 critérios.

| Módulo | Descoberta | Visibilidade | Clareza | Valor percebido | Potencial comercial | **Média** |
|--------|:----------:|:------------:|:-------:|:---------------:|:-------------------:|:---------:|
| Copilot GPT | 2 | 6 | 9 | 9 | 10 | **7,2** |
| Alertas operacionais | 5 | 7 | 7 | 8 | 8 | **7,0** |
| Scoring operacional | 4 | 7 | 5 | 8 | 8 | **6,4** |
| Recomendações | 4 | 7 | 8 | 9 | 9 | **7,4** |
| Agentes (4 tipos) | 2 | 5 | 7 | 8 | 9 | **6,2** |
| Propostas supervisionadas | 2 | 5 | 9 | 8 | 8 | **6,4** |
| Forecast baseline | 3 | 5 | 7 | 7 | 7 | **5,8** |
| Narrativa executiva | 2 | 5 | 8 | 9 | 9 | **6,6** |
| Contexto copiloto | 2 | 4 | 4 | 6 | 5 | **4,2** |
| Analytics operacional | 2 | 4 | 5 | 6 | 6 | **4,6** |
| Priorização adaptativa | 2 | 3 | 3 | 5 | 5 | **3,6** |
| Memória operacional | 2 | 3 | 4 | 5 | 5 | **3,8** |
| Policy intelligence | 2 | 3 | 3 | 5 | 6 | **3,8** |
| Planejamento estratégico | 2 | 3 | 4 | 5 | 5 | **3,8** |
| Coordenação multi-agente | 2 | 3 | 4 | 6 | 7 | **4,4** |
| Orquestração | 2 | 3 | 3 | 5 | 6 | **3,8** |
| Sandbox + execução | 1 | 3 | 6 | 7 | 7 | **4,8** |
| Tools GPT | 1 | 4 | 3 | 6 | 6 | **4,0** |
| Discoverability `/central` | 3 | 2 | 4 | 5 | 8 | **4,4** |

### TOP 10 — Ranking por potencial comercial percebido

| Rank | Funcionalidade | Nota comercial | Por quê |
|:----:|----------------|:--------------:|---------|
| 1 | Copilot GPT | 10 | Único LLM real; pergunta em linguagem natural; demo memorável |
| 2 | Recomendações operacionais | 9 | Ação concreta; estados de urgência; feedback humano |
| 3 | Agentes operacionais | 9 | Narrativa “equipe virtual especializada”; diferencial B2B |
| 4 | Narrativa executiva | 9 | Traduz operação para diretoria em 1 clique |
| 5 | Scoring + alertas (combo) | 8 | Risco visível em segundos; não depende de OpenAI |
| 6 | Propostas supervisionadas | 8 | Governança e compliance — human-in-the-loop vendável |
| 7 | Forecast de deterioração | 7 | Antecipação — linguagem preditiva sem prometer ML |
| 8 | Coordenação multi-agente | 7 | “Plataforma de IA” vs. “feature isolada” |
| 9 | Sandbox de simulação | 7 | Reduz medo de automação; demonstra maturidade |
| 10 | Analytics operacional | 6 | KPIs históricos — complementa narrativa executiva |

---

## Fase 6 — Oportunidades de melhoria

### Quick Wins (até 1 dia)

| # | Ação | Módulos impactados | Evidência do gap |
|---|------|-------------------|------------------|
| 1 | Incluir item `{ to: "/central", label: "Central de IA", icon: Sparkles }` em `navForRole()` | Todos (discoverability) | `app-shell.tsx` L37–63 — `/central` ausente |
| 2 | Alterar link na Home de “Central operacional →” para “Central de IA →” ou “Inteligência operacional →” | Discoverability | `index.tsx` L134–138 |
| 3 | Alterar subtítulo da `/central` para incluir “inteligência artificial supervisionada” | Clareza | `central.tsx` / `command-center-view.tsx` L160–161 |
| 4 | Renomear painel “Scoring operacional” → “Índice de risco (IA)” na UI | Scoring | `operational-scoring-panel.tsx` L117 |
| 5 | Badge “IA” no quick action do Executivo ao lado de “Central operacional” | Executivo → central | `executivo.tsx` L155–166 |
| 6 | Atualizar passo 3 do demo guiado: highlight “Copiloto, scoring e agentes supervisionados” | Piloto | `guided-demo-service.ts` L39–44 |
| 7 | Toast e empty states: preferir “Inteligência operacional” em vez de só “Copiloto” | Copilot | `operational-copilot-gpt-panel.tsx` |
| 8 | Footer do feed de alertas: trocar “Regras explícitas” por “Alertas inteligentes · regras auditáveis” | Alertas | `operational-alert-feed.tsx` |

### Curto prazo (até 1 semana)

| # | Ação | Impacto |
|---|------|---------|
| 1 | Card na Home com resumo do scoring (ex.: “Saúde operacional: Atenção — 2 riscos de cobertura”) | Ponte Home → IA |
| 2 | Reordenar `/central`: Copilot + scoring + recomendações no topo; governança avançada abaixo | Reduz scroll para wow factor |
| 3 | Abas na central: “Visão geral” \| “Copiloto” \| “Agentes” \| “Governança” | Descoberta por persona |
| 4 | 3 artigos na Ajuda: “O que é a Central de IA”, “Como usar o Copiloto”, “Agentes supervisionados” | Pós-venda |
| 5 | Novo roteiro comercial 10 min com IA (substituir corte em `MEDICFLOW_DEMO_COMERCIAL.md`) | Primeira reunião |
| 6 | Checklist pré-demo IA no `/piloto` (chave OpenAI + perfil coordinator) | Reduz falha em demo |
| 7 | Tooltip “?” nos painéis com jargão (scoring, priorização, policy) | Clareza in-context |

### Médio prazo

| # | Ação | Impacto comercial |
|---|------|-------------------|
| 1 | Módulo “Inteligência operacional” na landing `/site` com screenshot do Copilot | Expectativa pré-venda |
| 2 | Sinais de IA em `/plantoes`: badge “Risco de cobertura” linkando à central | IA no fluxo diário do médico |
| 3 | Notificação in-app: “IA identificou risco em UTI — ver central” | Proatividade percebida |
| 4 | Dashboard executivo com bloco “Resumo IA” (narrativa cacheada) | Diretoria sem abrir central |
| 5 | Pacote comercial “MedicFlow-AI Enterprise” com IA explícita no menu e SLA de Copilot | Monetização |
| 6 | Onboarding interativo primeira visita: tour 60s da Central de IA | Ativação pós-piloto |

---

## Fase 7 — Plano de demonstração ideal (resumo)

Roteiro completo em [DEMO_IA_10_MINUTOS.md](./DEMO_IA_10_MINUTOS.md).

**Pré-requisitos:** login `coordinator`; `MEDFLOW_OPENAI_API_KEY` configurada; tenant com alertas/scoring ativos.

**Sequência (10 min):**

1. Home — posicionar MedicFlow-AI (1 min)
2. `/central` — scoring + alerta crítico (2 min)
3. `/central` — recomendação urgente + forecast (2 min)
4. `/central` — Copilot: pergunta sobre cobertura (3 min)
5. `/central` — agente de cobertura + human-in-the-loop (2 min)

---

## Fase 8 — Plano de evolução comercial (resumo)

Detalhamento em [PLANO_COMERCIAL_IA_MEDICFLOW.md](./PLANO_COMERCIAL_IA_MEDICFLOW.md).

### O que falta para a IA parecer mais inteligente?

- **Presença proativa** fora de `/central` (push, badges em Plantões/Escalas)
- **Respostas mais visuais** (gráficos inline no Copilot, não só texto)
- **Antecipação narrada** (“Em 48h, cobertura de UTI pode cair para X%”)
- **Personalização por persona** (médico vê risco; escalista vê ação; diretor vê narrativa)

### O que falta para o cliente enxergar valor imediatamente?

- **IA no menu** e no primeiro login
- **Demo de 10 min que inclui Copilot**, não apenas alertas
- **Tradução de jargão** (scoring → risco de falta de médicos)
- **Dado vivo na demo** (alerta crítico real, não tela vazia)

### O que faria parecer plataforma de IA de nova geração?

- Hub de IA dedicado com identidade visual distinta (não só scroll em “Central operacional”)
- Copilot omnipresente (floating assistant em Plantões/Escalas)
- Agentes com avatar e status em tempo real no header
- Marketplace de “skills” operacionais por tenant
- Métricas de valor da IA expostas (“12 riscos evitados este mês”)

---

## Evidências principais (referência)

| Artefato | Caminho |
|----------|---------|
| Menu sem `/central` | `src/components/app-shell.tsx` |
| Hub de todos os painéis IA | `src/components/operational/command-center-view.tsx` |
| Copilot GPT UI | `src/components/operational/operational-copilot-gpt-panel.tsx` |
| RBAC managers | `src/hooks/use-operational-copilot-derived.ts` |
| Link Home → central | `src/routes/index.tsx` |
| Demo guiada sem IA explícita | `src/lib/services/guided-demo/guided-demo-service.ts` |
| Demo 10 min corta IA | `docs/MEDICFLOW_DEMO_COMERCIAL.md` §8.2 |
| Matriz comercial | `docs/MATRIZ_IA_COMERCIAL.md` |
| Auditoria técnica | `docs/AUDITORIA_IA_MEDICFLOW_COMPLETA.md` |

---

*Documento gerado por auditoria UX/comercial — sem alteração de código, commits ou deploy.*
