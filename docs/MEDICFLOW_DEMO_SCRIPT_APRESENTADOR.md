# MedicFlow-AI — Script do Apresentador

**Documento:** texto falado durante a demonstração comercial ao vivo  
**Data:** 11/06/2026  
**Versão:** V1 Comercial  
**Ambiente demo:** `https://staging.medicflow.app.br`  
**Roteiro completo:** [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md)

---

## Como usar este documento

- Leia o texto em **itálico** como fala natural — adapte ao seu estilo, mas mantenha as mensagens-chave.
- Ações entre colchetes `[...]` são instruções de navegação, não fala.
- Marqueções **NEGRITO** indicam ênfase vocal.
- Use a versão **10 / 20 / 40 min** conforme o tempo da reunião.
- Pause após perguntas de engajamento e aguarde resposta.

---

## Abertura (todas as versões)

> Bom [dia/tarde], [nome do cliente]. Obrigado pelo tempo de vocês.
>
> Sou [seu nome], [cargo] da MedicFlow-AI. [Hoje / Nos próximos X minutos] vou mostrar como hospitais, UPAs e cooperativas médicas estão digitalizando a operação de plantões — integrando escala, faturamento TISS e fechamento financeiro em uma plataforma white-label, com central em tempo real.
>
> Antes de começar, uma pergunta rápida: **quantas planilhas diferentes vocês usam hoje para escala, confirmação de plantão e faturamento?**
>
> [Pausa — aguarde resposta]
>
> Isso é exatamente o cenário que vemos em praticamente toda instituição. Escalas no Excel, confirmações no WhatsApp, TISS em outro sistema, diretoria montando relatório manual. Quatro silos, zero integração.
>
> O MedicFlow-AI resolve isso com **uma plataforma, operação, TISS e fechamento no mesmo tenant**. Transparência importante: **não somos prontuário eletrônico** — somos a camada operacional e financeira que faltava entre planilhas e ERPs.
>
> Vamos ao sistema.

---

## Etapa 1 — Login (`/login`)

**Tempo:** 1 min | **Versões:** 10 / 20 / 40 min

> Aqui é a porta de entrada. O MedicFlow é **multi-tenant nativo** — cada hospital, clínica ou cooperativa opera em ambiente isolado, com seus próprios dados e branding.
>
> [Mostrar seletor de instituição]
>
> Vejam: o médico ou escalista seleciona a instituição, insere e-mail e senha, e entra direto no dashboard. Os dados de uma instituição **nunca se misturam** com outra — isso é garantido por Row Level Security no Postgres, não só na interface.
>
> A identidade visual do hospital aparece desde o login — logo, cores, banner. Isso aumenta adesão: o médico vê **a marca do hospital**, não um software genérico.
>
> Recuperação de senha está integrada. Provisionamento de usuários é feito pelo administrador — em V1 ainda não temos cadastro self-service, mas o go-live leva cerca de 3 dias com piloto assistido.

**Transição:**

> Entrando no sistema, a primeira coisa que todos veem é o dashboard do dia.

---

## Etapa 2 — Dashboard (`/`)

**Tempo:** 2 min | **Versões:** 10 / 20 / 40 min

> Este é o **painel operacional do dia**. Sem abrir planilha, sem grupo de WhatsApp — tudo que importa agora está aqui.
>
> [Apontar contadores]
>
> Plantões abertos — oportunidades que precisam de profissional. Confirmações pendentes — médicos que ainda não confirmaram. Swaps — trocas de turno aguardando aprovação.
>
> Cada número é clicável. O escalista clica e vai direto para a ação. O médico vê suas pendências. O administrador tem visão consolidada.
>
> Isso elimina aquela rotina de "quantos plantões faltam?" no grupo de WhatsApp às 17h de sexta-feira. **A resposta está aqui, em tempo real.**
>
> O dashboard é o ponto de partida para todos os papéis — médico, escalista, financeiro e diretoria. Cada um vê o que precisa, filtrado pelo RBAC.

**Transição (10 min):**

> Vamos ver como o médico captura um plantão — o coração da operação.

**Transição (20/40 min):**

> Agora vou mostrar o fluxo completo de captação — do plantão aberto à confirmação auditável.

---

## Etapa 3 — Captação de Plantões (`/plantoes`)

**Tempo:** 4–5 min | **Versões:** 10 / 20 / 40 min

### 3.1 Aba Abertos

> Aqui está a **captação de plantões**. Três abas principais: Abertos, Meus Plantões e Swaps.
>
> [Navegar para aba Abertos]
>
> Na aba **Abertos**, o médico vê turnos disponíveis — unidade, setor, data, horário. Tudo organizado, sem mensagem perdida no WhatsApp.
>
> [Clicar em Aceitar — se possível, alternar para perfil médico]
>
> Um clique para aceitar. O sistema registra o assignment com status pendente ou confirmado, dependendo da regra da instituição. **100% rastreável, 100% auditável.**
>
> Compare com o processo atual: 15 mensagens no WhatsApp, ligação às 22h, ninguém sabe quem confirmou. Aqui, um clique e está registrado.

### 3.2 Aba Meus Plantões (20/40 min)

> [Navegar para Meus Plantões]
>
> Plantões já atribuídos ao profissional. Se há confirmação pendente, o médico confirma aqui. Status vai para **confirmed** — e o escalista vê na central em tempo real.

### 3.3 Aba Swaps (20/40 min)

> [Navegar para Swaps]
>
> Trocas de turno **formalizadas**. Médico solicita, escalista aprova ou nega. Sem acordo informal que gera double-booking.
>
> [Mostrar swap pendente, se houver]
>
> Quando aprovado, o sistema reatribui automaticamente. Trilha de auditoria completa — quem pediu, quem aprovou, quando.

### 3.4 Regra crítica (40 min)

> Regra de negócio importante: **apenas um profissional confirmado por turno**. O sistema impede double-booking — algo que planilhas compartilhadas simplesmente não conseguem fazer.

**Cenário narrativo:**

> Imaginem: sexta-feira, 14h. Plantão de UTI para sábado ainda aberto. O médico aceita agora pelo celular. O escalista vê a confirmação na central antes das 18h. **Problema resolvido antes de virar crise.**

**Transição (10 min):**

> Com o plantão confirmado, vamos à central operacional — onde o escalista monitora tudo em tempo real.

**Transição (20/40 min):**

> Agora vou mostrar de onde vêm esses plantões — o calendário de escalas.

---

## Etapa 4 — Escalas (`/escalas`)

**Tempo:** 3 min | **Versões:** 20 / 40 min

> Este é o **calendário de escalas de 14 dias**. Substitui planilhas Excel com versões conflitantes.
>
> [Mostrar calendário]
>
> Timeline por unidade, setor e horário. Status visual: aberto, confirmado, pendente. O escalista publica turnos aqui — eles ficam visíveis instantaneamente para todos os profissionais.
>
> [Mostrar filtros operacionais]
>
> Filtros inteligentes: conflitos de horário, turnos sem confirmação, plantões abertos. O escalista não precisa vasculhar planilha — clica no filtro e age.
>
> [Opcional: `/escalas?opsFocus=sem-confirmacao`]
>
> Vejam: turnos sem confirmação destacados. A central também alerta, mas aqui o escalista tem visão detalhada para convocar profissionais.
>
> Histórico auditável — cada alteração registrada. Nada de "quem mudou a planilha?".

**Transição:**

> Com escala publicada e plantões sendo capturados, o escalista monitora tudo na central operacional.

---

## Etapa 5 — Central Operacional (`/central`)

**Tempo:** 3–4 min | **Versões:** 10 / 20 / 40 min

> Esta é a **central operacional** — o command center em tempo real.
>
> [Mostrar widgets e KPIs]
>
> Cobertura por unidade. Indicadores operacionais. Swaps pendentes. Conflitos de horário. Tudo atualizado via **Supabase Realtime** — não é dashboard estático que você atualiza com F5.
>
> [Apontar alertas]
>
> Alertas contextuais com links para ação. "Plantão de UTI sem confirmação" — clica e vai direto para o turno. "Cobertura baixa no Pronto-Socorro" — clica e vê a escala.
>
> [Mostrar timeline de eventos, se visível]
>
> Timeline de eventos operacionais — quem confirmou, quem trocou, quando. Auditoria completa para compliance.
>
> Cenário real: **sexta, 14h, central alerta plantão de UTI sem confirmação. Escalista age antes do problema.** Isso não existe com planilha e WhatsApp.

**Transição (10 min):**

> Para diretoria, consolidamos tudo no dashboard executivo.

**Transição (20 min):**

> Agora a ponte entre operação e financeiro — o módulo TISS.

**Transição (40 min):**

> Antes do financeiro, vou mostrar o hub que concentra fechamento e conciliação.

---

## Etapa 6 — Financeiro (`/financeiro`)

**Tempo:** 2–3 min | **Versões:** 40 min

> Este é o **hub financeiro operacional**. Não é ERP contábil — é a camada financeira conectada à produção real dos plantões.
>
> [Navegar pelo hub]
>
> Fechamento de competência — snapshot mensal com trava. Conciliação operacional — import CSV estruturado. Links para TISS, repasses e dashboard executivo.
>
> O diferencial: **a produção do plantão executado alimenta o financeiro**. Não é planilha paralela desconectada da operação. Mesmo tenant, mesma auditoria.
>
> Vou mostrar isso na prática no módulo TISS.

**Transição:**

> Operação alimenta faturamento — vejam como.

---

## Etapa 7 — TISS (`/tiss`)

**Tempo:** 3–5 min | **Versões:** 20 / 40 min

### 7.1 Visão geral

> O **módulo TISS** integra faturamento à operação. Ciclo completo no mesmo tenant.
>
> [Mostrar abas/navegação]

### 7.2 Convênios e guias (40 min)

> Convênios cadastrados. Catálogo TUSS. Guias e itens emitidos. Lotes agrupados com export XML.
>
> Transparência V1: export XML é MVP — funcional para ciclo interno. Envio automático a operadoras está no roadmap médio prazo.

### 7.3 Produção e Repasses

> [Navegar para Produção]
>
> **Produção médica** — plantões executados viram base de faturamento. Cada plantão confirmado e executado gera registro de produção.
>
> [Navegar para Repasses]
>
> **Repasses** calculados e vinculados à produção. O médico consulta em leitura — transparência total, menos disputas com financeiro. O hospital sabe exatamente quanto repassar, por competência, com auditoria.

### 7.4 Glosas (40 min)

> [Navegar para Glosas, se tempo permitir]
>
> Glosas registradas e rastreadas. Receita recuperável que hoje se perde por falta de controle. Em V1 o registro é manual — recurso automático com operadora no roadmap.

**Mensagem-chave:**

> O plantão que o médico confirmou na aba Plantões **alimenta a guia TISS e o repasse** — tudo no mesmo sistema. Sem exportar planilha, sem retrabalho.

**Transição (20 min):**

> Para diretoria, consolidamos operação e financeiro no dashboard executivo.

**Transição (40 min):**

> Antes do executivo, vou mostrar o fechamento de competência — o argumento de compliance.

---

## Etapa 8 — Fechamento Operacional (`/financeiro/fechamento-operacional`)

**Tempo:** 3 min | **Versões:** 40 min

> Este é o **fechamento de competência** — diferencial para diretor financeiro e compliance.
>
> [Mostrar competência aberta ou fechada]
>
> Competência mensal com **snapshot e trava**. Quando o mês é fechado, os dados são congelados — **impossível alterar retroativamente** sem reabertura auditada por administrador.
>
> [Mostrar snapshot, se disponível]
>
> Snapshot registra exatamente o estado do fechamento — produção, repasses, TISS. Base confiável para board, auditoria externa e compliance.
>
> Compare com o processo atual: fechamento por e-mail, planilha que qualquer um altera depois. Aqui, **trava com auditoria**.
>
> Reabertura só com permissão de tenant_admin — com registro de quem reabriu e por quê.

**Transição:**

> Com o mês fechado, a diretoria consulta KPIs reais.

---

## Etapa 9 — Dashboard Executivo (`/executivo` + `/dashboard-executivo`)

**Tempo:** 2–4 min | **Versões:** 10 / 20 / 40 min

### 9.1 Narrativa executiva

> [Navegar para `/executivo`]
>
> Duas camadas para diretoria. Primeira: **narrativa executiva** — walkthrough para sponsors e comitês de decisão.

### 9.2 KPIs numéricos

> [Navegar para `/financeiro/dashboard-executivo`]
>
> Segunda camada: **KPIs numéricos reais** por competência. Fechamento, TISS, cobertura operacional — consolidados.
>
> [Apontar indicadores]
>
> Pergunta para vocês: **hoje, quanto tempo leva para saber se o mês fechou no azul?** Com MedicFlow, os KPIs vêm de snapshots travados — confiáveis para decisão, não estimativas de planilha.
>
> Diferencial vs. BI genérico: **os dados nascem da operação**, não de import manual. Plantão confirmado → produção → TISS → fechamento → KPI. Cadeia rastreável.

**Transição (40 min):**

> Por fim, o diferencial de inovação — IA operacional.

---

## Etapa 10 — IA Operacional (`/central` — painel Copilot)

**Tempo:** 4 min | **Versões:** 40 min

> Este é o **Copilot operacional** — IA supervisionada, integrada à central.
>
> [Mostrar painel Copilot GPT]
>
> O copiloto interpreta o contexto operacional em tempo real: cobertura, alertas, recomendações, forecast. Você pergunta em linguagem natural.
>
> [Digitar pergunta de exemplo]
>
> Exemplo: *"Quais turnos têm risco de cobertura neste fim de semana?"*
>
> [Aguardar resposta ou mostrar resposta prévia]
>
> A IA analisa os dados reais do snapshot — scores, alertas, timeline — e responde de forma explicável. **Read-only**: não executa ações, não confirma plantões, não aprova swaps.
>
> Guardrails importantes:
> - **Não substitui o escalista** — amplifica a decisão.
> - **Não acessa dados de pacientes** — foco em operação de escalas e cobertura.
> - **Human-in-the-loop** — toda ação crítica passa por aprovação humana.
>
> [Mencionar agentes e orquestração, se visível]
>
> Agentes operacionais e orquestração multi-step complementam o copiloto — governança, coordenação, propostas de ação com aprovação.
>
> IA é **add-on opcional** — a plataforma opera plenamente sem ela. Mas para instituições que querem inovação diferenciada, é um upside real.

---

## Fechamento e CTA

### Versão 10 minutos

> Recapitulando o que vimos em 10 minutos:
>
> - **Login multi-tenant** com branding do hospital
> - **Dashboard do dia** — visibilidade imediata
> - **Captação de plantões** — confirmação em 1 clique, auditável
> - **Central operacional** — alertas em tempo real
> - **Dashboard executivo** — KPIs para diretoria
>
> Isso é a ponta do iceberg. A demo completa de 40 minutos cobre TISS, fechamento com snapshot, repasses e IA operacional.
>
> Proponho dois próximos passos:
> 1. **Demo executiva de 40 minutos** — ciclo completo da operação ao fechamento.
> 2. **Piloto institucional de 30 dias** — KPIs baseline, go-live assistido, medição de ROI real.
>
> Podemos agendar para [dia] às [hora]? Envio hoje o link do staging e o material executivo.
>
> Obrigado. Perguntas?

### Versão 20 minutos

> Recapitulando:
>
> Vimos o ciclo **operação → TISS → executivo**:
> - Captação auditável substituindo WhatsApp
> - Escalas centralizadas em 14 dias
> - Central em tempo real com alertas proativos
> - Produção alimentando repasses e TISS
> - KPIs reais para diretoria
>
> O MedicFlow-AI **não é prontuário eletrônico** — é a camada operacional e financeira entre planilhas e ERPs. Produto implementado, demo live, go-live em ~3 dias.
>
> Próximo passo: **demo completa de 40 minutos** com fechamento, IA e conciliação — ou **piloto de 30 dias** para medir ROI na instituição de vocês.
>
> Podemos agendar? Obrigado — perguntas?

### Versão 40 minutos

> Recapitulando a jornada completa:
>
> 1. **Login** — multi-tenant seguro, white-label
> 2. **Dashboard** — visão do dia
> 3. **Captação** — plantões auditáveis, swaps formalizados
> 4. **Escalas** — calendário 14 dias
> 5. **Central** — command center em tempo real
> 6. **Financeiro** — hub operacional
> 7. **TISS** — operação alimenta faturamento
> 8. **Fechamento** — snapshot com trava
> 9. **Executivo** — KPIs reais
> 10. **IA** — copiloto supervisionado
>
> **Uma plataforma. Operação, TISS e fechamento no mesmo tenant.**
>
> Três opções de próximo passo:
>
> | Opção | Para quem |
> |-------|-----------|
> | **Piloto 30 dias** | Medir ROI real com KPIs baseline |
> | **Workshop técnico 2h** | TI e compliance — arquitetura, RLS, RBAC |
> | **Proposta comercial** | Pacote Operacional, +TISS ou Enterprise |
>
> Podemos agendar o piloto para [data]? Envio hoje o material completo — staging, documentação executiva e este roteiro.
>
> Obrigado pelo tempo. Perguntas?

---

## Respostas rápidas para Q&A (fala natural)

### "É prontuário eletrônico?"

> Não. Somos plataforma operacional mais TISS MVP. Complementamos o prontuário que vocês já têm — não substituímos. Foco total em plantões, escalas, faturamento e fechamento.

### "Quanto tempo para go-live?"

> Cerca de 3 dias com piloto assistido. Dia zero: branding e parametrização. Dias um e dois: convênios TISS e usuários. Dia três: competência financeira e smoke tests. Go-live com monitoramento.

### "Envia TISS para operadoras?"

> Na V1, export XML mais registro manual de retorno. Envio automático a operadoras está no roadmap de médio prazo. O ciclo interno — guias, lotes, glosas, repasses — já funciona integrado.

### "Funciona no celular?"

> Sim. PWA responsivo — o médico acessa pelo navegador do celular, confirma plantão em um clique. Sem app store, sem instalação.

### "Quanto custa?"

> SaaS por tenant, com pacotes Operacional, mais TISS e Enterprise. Enviamos proposta após um discovery de 30 minutos para entender unidades, profissionais e módulos necessários.

### "E a LGPD?"

> RLS Postgres — isolamento por tenant. RBAC com 5 papéis e mais de 30 capabilities. Audit logs. Cada instituição vê apenas seus dados. Dados segregados desde o banco, não só na interface.

### "A IA substitui o escalista?"

> Não. A IA é copiloto read-only. Interpreta dados, destaca riscos, sugere prioridades. Quem confirma plantão, quem aprova swap, quem publica escala — sempre é humano.

### "Posso testar antes de contratar?"

> Sim. Duas opções: demo no staging a qualquer momento, ou piloto institucional de 30 dias com KPIs baseline para medir ROI real na operação de vocês.

---

## Dicas de performance para o apresentador

| Dica | Detalhe |
|------|---------|
| **Conte histórias** | Use o cenário "sexta 14h, UTI sem confirmação" — gera identificação |
| **Pause após perguntas** | "Quantas planilhas vocês usam?" — silêncio de 3 segundos |
| **Alterne perfis** | Mostrar visão médico vs. escalista gera credibilidade |
| **Transparência vende** | Mencione gaps (sem push, XML MVP) — gera confiança enterprise |
| **Não liste features** | Conecte cada tela a uma dor: WhatsApp → Plantões, planilha → Escalas |
| **Feche com data** | "Podemos agendar para terça às 10h?" — não "me avise" |
| **Tenha plano B** | Screenshots em `docs/screenshots/` se staging cair |

---

## Referências

| Documento | Uso |
|-----------|-----|
| [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md) | Roteiro completo, tempos, Q&A detalhado |
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Argumentação comercial |
| [MEDICFLOW_PITCH_15_MINUTOS.md](./MEDICFLOW_PITCH_15_MINUTOS.md) | Pitch com slides integrado |

---

*Script baseado na documentação executiva MedicFlow-AI V1. Sem alterações de código, banco ou staging.*
