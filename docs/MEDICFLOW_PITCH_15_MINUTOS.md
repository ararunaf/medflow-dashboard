# MedicFlow-AI — Pitch 15 Minutos

**Documento:** roteiro comercial médio para reuniões com diretoria, sponsors e comitês de decisão  
**Data:** 11/06/2026  
**Duração alvo:** 15 minutos (+ 5 min Q&A)  
**Demo:** `https://staging.medicflow.app.br`  
**Deck completo:** [MEDICFLOW_PRESENTACAO_COMERCIAL_V1.md](./MEDICFLOW_PRESENTACAO_COMERCIAL_V1.md)

---

## Visão geral

| Bloco | Tempo | Slides |
|-------|-------|--------|
| Abertura + Problema | 3:00 | 1–3 |
| Solução + Workflows | 5:00 | 4–6 |
| Jornadas + Financeiro | 4:00 | 7–9 |
| Diferenciais + ROI + CTA | 3:00 | 10–12, 15 |
| **Total** | **15:00** | — |

> Slides 13 (Roadmap) e 14 (Modelo Comercial) ficam como **backup** para Q&A ou reunião de follow-up.

---

## Roteiro minuto a minuto

### 0:00–0:45 — Abertura (Slide 1: Capa)

**Fala sugerida:**

> "Bom dia a todos. Obrigado pelo tempo. Sou [nome], [cargo] da MedicFlow-AI.
>
> Nos próximos 15 minutos vou apresentar como hospitais, UPAs e cooperativas médicas estão digitalizando a operação de plantões — integrando escala, faturamento TISS e fechamento financeiro em uma plataforma white-label, com central em tempo real e implantação assistida.
>
> Ao final, proponho uma demo guiada ao vivo ou um piloto institucional de 30 dias. Fiquem à vontade para perguntas — reservei 5 minutos no final."

**Pontos-chave:**
- Apresentação pessoal + agenda clara
- Posicionamento: operacional + TISS, não EHR
- Q&A anunciado — reduz interrupções

**Mídia:** Slide capa + `screenshots/02-dashboard.png` em composição.

---

### 0:45–3:00 — Problema do mercado (Slides 2–3)

**Fala sugerida:**

> "**O mercado opera plantões no escuro — e paga caro por isso.**
>
> Vou descrever o cenário que vemos em praticamente toda instituição que visitamos:
>
> **Na operação:** escalas vivem em planilhas Excel com versões conflitantes. Confirmações vão por WhatsApp e ligação — sem registro, sem auditoria. Plantões descobertos em cima da hora. Trocas informais geram double-booking.
>
> **No financeiro:** guias TISS ficam em sistemas separados da operação. Lotes manuais, export ad hoc. Glosas sem rastreio — receita recuperável perdida. Fechamento mensal por e-mail, sem snapshot — qualquer um altera retroativamente.
>
> **Na implantação:** demos desorganizadas, go-live sem validação, branding genérico que médicos não adotam.
>
> O resultado? Quatro silos desconectados — escalista na planilha, médico no WhatsApp, financeiro no TISS isolado, diretoria no relatório manual. Zero integração, zero tempo real, zero auditoria.
>
> Isso não é culpa das equipes. É falta de plataforma. E o custo é operacional — cobertura — e financeiro — glosas, repasses disputados, KPIs não confiáveis."

**Pergunta de engajamento:**
> "Quanto disso reflete a realidade de vocês? Onde dói mais — operação ou financeiro?"

**Pontos-chave:**
- Validar dor antes de vender solução
- Mencionar custo oculto (não só inconveniência)
- Adaptar ênfase conforme perfil da audiência

**Mídia:** Diagrama Antes x Depois (MEDICFLOW_SLIDES_COMERCIAIS §1).

---

### 3:00–5:30 — Solução (Slide 4: Como resolve)

**Fala sugerida:**

> "**MedicFlow-AI: uma plataforma, operação, TISS e fechamento no mesmo tenant.**
>
> Substituímos planilhas, WhatsApp e sistemas fragmentados por plataforma multi-tenant white-label com três pilares:
>
> **Operação** — escalas de 14 dias, plantões com confirmação auditável, central operacional em tempo real com Supabase Realtime, swaps formalizados, IA operacional opcional.
>
> **Financeiro** — ciclo TISS MVP integrado: convênios, guias, lotes, glosas, repasses médicos vinculados à produção. Fechamento de competência com snapshot e trava. Conciliação estruturada.
>
> **Implantação** — branding white-label em dias, piloto assistido, demo guiada de 7 passos, go-live com smoke tests em cerca de 3 dias.
>
> Isso é produto implementado — não roadmap. V1 operacional com 20 rotas, 173 server functions, 63 tabelas Postgres com RLS, 5 papéis RBAC, demo live em staging.medicflow.app.br.
>
> Transparência: não somos prontuário eletrônico, não somos ERP completo, e V1 não envia TISS automaticamente a operadoras. Somos a camada operacional e financeira entre planilhas e ERPs."

**Demo ao vivo (1 min):**
1. `/login` — multi-tenant
2. `/` — dashboard do dia com contadores
3. `/central` — alertas em tempo real

**Pontos-chave:**
- 3 pilares + números de prova
- Demo ao vivo gera credibilidade
- Transparência sobre escopo

---

### 5:30–8:00 — Workflow Captação (Slide 5)

**Fala sugerida:**

> "**Do plantão aberto ao repasse: 10 etapas rastreáveis.**
>
> O coração do MedicFlow é o workflow de captação de plantões — conecta hospital, escalista, médico e financeiro:
>
> ① Hospital define demanda → ② Escalista publica turnos no calendário de 14 dias → ③ Sistema notifica via dashboard e central RT → ④ Médico manifesta interesse em plantões abertos → ⑤ Seleção — self-service ou escalista → ⑥ Confirmação auditável — um confirmado por turno, anti double-booking → ⑦ Execução monitorada pela central → ⑧ Validação — produção registrada → ⑨ Fechamento — snapshot e trava → ⑩ Pagamento — repasses calculados.
>
> Regras críticas: swaps exigem aprovação formalizada. Disponibilidade do médico alimenta alertas de cobertura. Tudo isolado por tenant com RLS.
>
> Cenário real: sexta-feira, 14h — central alerta plantão de UTI sem confirmação. Escalista age antes do problema. Isso não existe com planilha e WhatsApp."

**Demo ao vivo (1 min):**
1. `/escalas` — calendário 14 dias
2. `/plantoes` — aba Abertos → Aceitar
3. `/plantoes?tab=swaps` — trocas formalizadas

**Pontos-chave:**
- Contar história, não listar features
- Regra 1 confirmed/shift = anti double-booking
- Gap honesto: push/e-mail não implementados

---

### 8:00–9:30 — Workflow Administrativo (Slide 6)

**Fala sugerida:**

> "**Hub Administrativo: 10 módulos para gestão institucional completa.**
>
> Para administradores e equipe financeira, o hub concentra: instituição e branding, profissionais com RBAC, escalas, financeiro, TISS, conciliação, fechamento, dashboard executivo, indicadores e auditoria.
>
> Implantação assistida: dia 0 branding e parametrização, dias 1–2 convênios TISS e usuários, dia 3 competência financeira e smoke tests, go-live com monitoramento em `/operacao`.
>
> Cada papel vê só o que precisa — tenant_admin configura, coordinator opera escalas, financial fecha TISS, professional confirma plantões."

**Demo flash (30s):**
- `/instituicao` — branding white-label
- `/piloto` — demo guiada 7 passos

---

### 9:30–11:00 — Jornadas (Slides 7–8)

**Fala sugerida:**

> "**Duas jornadas, uma plataforma.**
>
> **Jornada do Médico** — 5 passos: Entrada → Captação → Escala → Plantão → Pagamento. Login multi-tenant, vê plantões abertos no dashboard, confirma em 1 clique, consulta produção e repasses em TISS. PWA responsivo — funciona no celular.
>
> Médicos são gatekeepers de adoção. Se for simples para eles, o hospital adota.
>
> **Jornada do Hospital** — 5 passos: Entrada com piloto → Instituição com branding → Profissionais com RBAC → Financeiro com TISS e fechamento → Indicadores no dashboard executivo.
>
> White-label aumenta adesão — o médico vê a marca do hospital, não software genérico. Diretoria acessa KPIs reais por competência — operação e financeiro consolidados."

**Demo flash (30s):**
- `/plantoes` — confirmação médico
- `/executivo` — narrativa diretoria

**Pontos-chave:**
- Humanizar — médico e admin são personas distintas
- Conectar jornadas: admin configura → médico opera → financeiro fecha

---

### 11:00–12:30 — Financeiro + TISS (Slide 9)

**Fala sugerida:**

> "**Operação alimenta faturamento — no mesmo tenant.**
>
> O diferencial financeiro do MedicFlow: a produção do plantão executado vira base para guias TISS, repasses e fechamento — tudo auditável.
>
> Ciclo TISS MVP: convênios, catálogo TUSS, guias e itens, lotes com export XML, glosas com registro manual, produção e repasses vinculados.
>
> Fechamento: competência mensal com snapshot e trava — impede alteração retroativa. Reabertura só com permissão de admin. Conciliação via import CSV.
>
> Para diretor financeiro: fechamento com snapshot é argumento de compliance. Repasses vinculados à produção eliminam disputas com médicos.
>
> Transparência V1: export XML é MVP, envio automático a operadoras está no roadmap médio prazo."

**Demo ao vivo (1 min):**
1. `/tiss` — Produção → Repasses
2. `/financeiro/fechamento-operacional` — snapshot

---

### 12:30–13:30 — Dashboard + Diferenciais (Slides 10–11)

**Fala sugerida:**

> "**Dashboard Executivo: KPIs reais, não planilhas.**
>
> Duas camadas: `/executivo` para narrativa com sponsors, `/dashboard-executivo` para KPIs numéricos por competência. Alertas de cobertura e financeiro consolidados.
>
> **Por que MedicFlow vs. alternativas?**
>
> Planilhas não integram TISS. TISS isolado não opera plantões. ERP genérico não é tempo real para escala.
>
> Nossos diferenciais com evidência: multi-tenant nativo com RLS, operação + TISS integrados, central RT, RBAC granular com 30+ capabilities, implantação assistida com demo 7 passos, fechamento auditável, white-label rápido, e transparência total sobre gaps — documentamos o que está pronto e o que evolui."

**Mídia:** Quadrante competitivo + screenshot dashboard executivo.

---

### 13:30–14:30 — ROI (Slide 12)

**Fala sugerida:**

> "**Retorno mensurável — com honestidade.**
>
> Operacionalmente: eliminação de planilhas paralelas, 100% confirmações registradas, detecção proativa de gaps, swaps formalizados, auditoria completa.
>
> Financeiramente: ciclo TISS documentado no tenant, fechamento sem alteração retroativa, repasses vinculados à produção, glosas rastreadas para recuperação de receita, KPIs consolidados para diretoria.
>
> Implantação: go-live em ~3 dias, demo comercial pronta, white-label sem rebuild.
>
> Não prometo percentuais não auditados. Proponho piloto de 30 dias com KPIs baseline para medir ROI real na instituição de vocês — cobertura, confirmações, tempo de fechamento, glosas rastreadas."

**Pontos-chave:**
- ROI qualitativo + proposta de piloto mensurável
- Não inventar "-70% tempo" sem baseline

---

### 14:30–15:00 — CTA (Slide 15)

**Fala sugerida:**

> "**Próximo passo: vejam operando ao vivo.**
>
> Temos staging live, demo guiada de 7 passos, 12 screenshots validados, documentação executiva completa.
>
> Proponho duas opções:
> 1. **Demo executiva de 45 minutos** — roteiro completo da operação ao fechamento.
> 2. **Piloto institucional de 30 dias** — KPIs baseline, go-live assistido, medição de ROI.
>
> Podemos agendar a demo para [dia] às [hora]? Envio hoje o link do staging e o material executivo.
>
> Obrigado. Perguntas?"

**Pontos-chave:**
- CTA com data concreta
- Duas opções (demo ou piloto)
- Transição para Q&A

---

## Mapa de demos ao vivo (integrado ao pitch)

| Momento | Rota | Duração | Objetivo |
|---------|------|---------|----------|
| 3:00–4:00 | `/` → `/central` | 1 min | Operação RT |
| 5:30–6:30 | `/escalas` → `/plantoes` | 1 min | Captação |
| 8:00–8:30 | `/instituicao` → `/piloto` | 30s | White-label |
| 9:30–10:00 | `/plantoes` → `/executivo` | 30s | Jornadas |
| 11:00–12:00 | `/tiss` → `/fechamento-operacional` | 1 min | Financeiro |

**Tempo total demo:** ~4 minutos (dentro dos 15)

---

## Slides recomendados (12 slides ativos + 3 backup)

| # | Slide | No pitch 15min |
|---|-------|:--------------:|
| 1 | Capa | ✅ |
| 2 | Problema do mercado | ✅ |
| 3 | Como hospitais operam hoje | ✅ |
| 4 | Como o MedicFlow resolve | ✅ |
| 5 | Workflow Captação | ✅ |
| 6 | Workflow Administrativo | ✅ |
| 7 | Jornada do Médico | ✅ |
| 8 | Jornada do Hospital | ✅ |
| 9 | Financeiro + TISS | ✅ |
| 10 | Dashboard Executivo | ✅ |
| 11 | Diferenciais Competitivos | ✅ |
| 12 | ROI | ✅ |
| 13 | Roadmap | Backup Q&A |
| 14 | Modelo Comercial | Backup Q&A |
| 15 | CTA | ✅ |

---

## Q&A preparado (5 minutos)

| Pergunta provável | Resposta |
|-------------------|----------|
| É prontuário eletrônico? | Não. Plataforma operacional + TISS MVP. Complementa EHR existente. |
| Quanto tempo para go-live? | ~3 dias com piloto assistido, smoke tests e branding. |
| Envia TISS para operadoras? | V1: export XML + registro manual. Roadmap médio prazo. |
| Quantos usuários suporta? | Multi-tenant cloud-native (Cloudflare Workers + Supabase). Escala horizontal. |
| LGPD e segurança? | RLS Postgres, RBAC 5 papéis, 30+ capabilities, audit logs, isolamento por tenant. |
| E notificações push/e-mail? | V1: in-app + Realtime. Push/e-mail no roadmap médio prazo. |
| Quanto custa? | SaaS por tenant — pacotes Operacional, +TISS, Enterprise. Proposta após discovery. |
| Cadastro de médicos? | V1: provisionamento via Auth. UI de cadastro no roadmap curto prazo. |
| Integra com ERP? | V1: conciliação CSV. Integração ERP/DRE no roadmap longo prazo. |
| Posso testar antes? | Sim — demo staging ou piloto 30 dias com KPIs baseline. |

---

## Adaptação por audiência

| Audiência | Ênfase | Reduzir |
|-----------|--------|---------|
| **Diretoria / CFO** | Slides 9, 10, 12 — financeiro, KPIs, ROI | Detalhe técnico de workflows |
| **Operação / Escalista** | Slides 5, 7 — captação, jornada médico | Modelo comercial |
| **TI / Compliance** | Slides 6, 11 — hub admin, RBAC, RLS | ROI qualitativo |
| **Cooperativa** | Slides 5, 8, 9 — pool, repasses, multi-unidade | — |
| **Investidor** | Slides 4, 11, 12, 13 — solução, diferenciais, ROI, roadmap | Demo operacional detalhada |

---

## Elevator pitch (30 segundos)

> MedicFlow-AI substitui planilhas e WhatsApp na gestão de plantões hospitalares, integrando operação, TISS e fechamento financeiro em plataforma segura, white-label e pronta para demo comercial. Não é prontuário eletrônico — é a camada operacional e financeira que faltava entre planilhas e ERPs.

---

## Follow-up pós-reunião (template)

**Assunto:** MedicFlow-AI — material executivo + próximos passos

> Olá [nome],
>
> Obrigado pela reunião de hoje. Conforme apresentado:
>
> **Demo live:** https://staging.medicflow.app.br  
> **Demo guiada:** `/piloto` (7 passos)
>
> **Material anexo:**
> - Apresentação comercial V1 (15 slides)
> - Proposta de valor executiva
> - Workflows operacionais
>
> **Próximo passo sugerido:** [Demo 45 min em DATA / Piloto 30 dias]
>
> Fico à disposição para dúvidas.
>
> Abraço,  
> [nome] — [contato]

---

## Checklist pré-reunião

- [ ] Deck exportado (12 slides ativos)
- [ ] Staging testado — credenciais demo
- [ ] Roteiro demo ensaiado (4 min de demos)
- [ ] Q&A sheet impresso ou em segunda tela
- [ ] Proposta comercial / pacotes preparados (backup slide 14)
- [ ] Calendly ou agenda aberta para agendar follow-up
- [ ] Material PDF para enviar pós-reunião

---

*Roteiro baseado na documentação executiva MedicFlow-AI V1. Ver [MEDICFLOW_PITCH_5_MINUTOS.md](./MEDICFLOW_PITCH_5_MINUTOS.md) para versão curta e [MEDICFLOW_PRESENTACAO_COMERCIAL_V1.md](./MEDICFLOW_PRESENTACAO_COMERCIAL_V1.md) para deck completo.*
