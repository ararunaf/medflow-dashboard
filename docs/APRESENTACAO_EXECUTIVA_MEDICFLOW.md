# Apresentação Executiva — MedicFlow-AI

**Documento:** visão de produto para diretoria, investidores e sponsors de implantação  
**Data:** 08/06/2026  
**Base:** auditoria funcional exclusivamente sobre recursos implementados

---

## 1. Descrição do produto

O **MedicFlow-AI** é uma plataforma operacional hospitalar multi-tenant que unifica:

- **Gestão de escalas e plantões** de profissionais de saúde
- **Central operacional** com indicadores em tempo real e alertas
- **Faturamento TISS** (MVP) com ciclo completo de guias, lotes e glosas
- **Fechamento financeiro** e conciliação operacional
- **Implantação assistida** com piloto, demo guiada e go-live controlado

**Stack tecnológica:** React 19 + TanStack Start (SSR) + Supabase (Auth, Postgres, Realtime, Storage) + deploy Cloudflare Workers.

![Dashboard operacional](screenshots/02-dashboard.png)

---

## 2. Público-alvo

| Segmento | Perfil no sistema | Necessidade atendida |
|----------|-------------------|---------------------|
| **Hospitais e clínicas** | `tenant_admin` | Branding, parametrização, go-live |
| **Coordenadores de escala** | `coordinator` | Publicar turnos, resolver conflitos, swaps |
| **Profissionais de plantão** | `professional` | Confirmar plantões, disponibilidade, trocas |
| **Equipe financeira** | `financial` | TISS, repasses, fechamento, conciliação |
| **Diretoria** | `tenant_admin` + dashboard executivo | KPIs financeiros e operacionais |

### Público NÃO atendido na V1

- Atendimento ambulatorial com prontuário eletrônico
- Gestão de pacientes e agenda de consultas
- Faturamento com envio automático a operadoras

---

## 3. Diferenciais

| Diferencial | Evidência no produto |
|-------------|---------------------|
| **Multi-tenant nativo** | RLS Postgres, branding por instituição (`/instituicao`) |
| **Operação em tempo real** | Supabase Realtime + Central Operacional (`/central`) |
| **RBAC granular** | 5 papéis, 30+ capabilities, enforcement em rota + serviço + RLS |
| **Ciclo TISS integrado à operação** | Guias → Lotes → Glosas → Repasses no mesmo tenant |
| **Implantação assistida** | Piloto, demo guiada 7 passos, smoke tests, checklist go-live |
| **IA operacional (opcional)** | Copilot GPT, agentes, orquestração supervisionada |
| **Observabilidade** | Health checks, export de diagnóstico, timeline de eventos |
| **Deploy flexível** | Cloudflare Workers (primário) ou Vercel |

---

## 4. Recursos disponíveis (implementados)

### 4.1 Operação

| Recurso | Status |
|---------|--------|
| Dashboard do dia | ✅ Implementado |
| Escalas (14 dias) | ✅ Implementado |
| Plantões (aceitar/recusar/swap) | ✅ Implementado |
| Disponibilidade do profissional | ✅ Implementado |
| Central operacional com alertas | ✅ Implementado |
| Realtime | ✅ Implementado |

### 4.2 Financeiro

| Recurso | Status |
|---------|--------|
| Dashboard executivo (KPIs reais) | ✅ Implementado |
| Fechamento de competência | ✅ Implementado |
| Conciliação (CSV) | ⚠️ Parcial |
| Repasses médicos | ✅ Implementado |
| Hub financeiro (landing) | ⚠️ Parcial (KPIs ilustrativos) |

### 4.3 TISS

| Recurso | Status |
|---------|--------|
| Convênios e contratos | ✅ Implementado |
| Catálogo TUSS | ✅ Implementado |
| Guias e lotes | ✅ Implementado |
| Export XML | ⚠️ Parcial (MVP) |
| Glosas e recursos | ⚠️ Parcial (sem operadora) |
| Envio a operadoras | ❌ Não implementado |

### 4.4 Instituição

| Recurso | Status |
|---------|--------|
| Branding white-label | ✅ Implementado |
| Piloto e onboarding | ✅ Implementado |
| Go-live e smoke tests | ✅ Implementado |
| Painel operacional | ✅ Implementado |
| Central de ajuda | ✅ Implementado |

### 4.5 Segurança

| Recurso | Status |
|---------|--------|
| Login multi-tenant | ✅ Implementado |
| RBAC + RLS | ✅ Implementado |
| Anti brute-force | ✅ Implementado |
| Auditoria de login | ✅ Implementado |
| Error tracking externo | ❌ Não implementado (stub) |

---

## 5. Casos de uso

### 5.1 Hospital com plantões 24h

**Problema:** escalas em planilhas, confirmações por WhatsApp, sem visibilidade de cobertura.

**Solução MedicFlow-AI:**
- Coordenador publica turnos em **Escalas**
- Profissionais confirmam em **Plantões**
- Gestão monitora cobertura na **Central Operacional**
- Alertas direcionam para ações (swaps, conflitos)

![Plantões](screenshots/04-plantoes.png)

### 5.2 Clínica com faturamento TISS

**Problema:** guias dispersas, lotes manuais, glosas sem rastreio.

**Solução MedicFlow-AI:**
- Cadastro de convênios em **TISS**
- Ciclo guia → lote → export XML
- Registro de glosas e recursos
- Repasses vinculados à produção

![TISS](screenshots/09-tiss.png)

### 5.3 Diretoria financeira

**Problema:** fechamento mensal sem visão consolidada.

**Solução MedicFlow-AI:**
- Fechamento de competência com snapshot e trava
- Conciliação de recebíveis (CSV)
- Dashboard executivo com KPIs

![Dashboard Executivo](screenshots/06-relatorios-dashboard-executivo.png)

### 5.4 Implantação comercial (piloto)

**Problema:** demo desorganizada, sem roteiro, sem validação técnica.

**Solução MedicFlow-AI:**
- Demo guiada de 7 passos
- Branding personalizado por tenant
- Smoke tests automatizados no go-live
- Export de diagnóstico para suporte

![Piloto](screenshots/08-administracao-piloto.png)

---

## 6. Benefícios mensuráveis

| Benefício | Como o produto entrega |
|-----------|------------------------|
| **Redução de planilhas paralelas** | Escalas e plantões centralizados |
| **Visibilidade de cobertura** | Central com alertas em tempo real |
| **Rastreabilidade financeira** | Fechamento com snapshot e auditoria |
| **Ciclo TISS documentado** | Guias, lotes, glosas no mesmo sistema |
| **Implantação previsível** | Checklist, smoke tests, demo guiada |
| **White-label rápido** | Branding sem rebuild |
| **Segurança multi-tenant** | RLS + RBAC em todas as camadas |

---

## 7. Roadmap

> Itens marcados como **não implementados** ou **parciais** na auditoria. Este roadmap reflete GAPs identificados — **não são promessas de entrega**.

### Curto prazo (completar V1)

| Item | Status atual | Prioridade |
|------|-------------|------------|
| XML TISS conforme ANS | Parcial | Alta |
| Hub financeiro com KPIs reais | Parcial | Média |
| Error tracking (Sentry/Datadog) | Não implementado | Média |
| Cadastro UI de profissionais | Não implementado | Alta |

### Médio prazo

| Item | Status atual |
|------|-------------|
| Envio TISS para operadoras | Não implementado |
| Conciliação bancária (OFX/CNAB) | Não implementado |
| Webhooks de retorno de operadoras | Não implementado |
| Auto-cadastro / convite de usuários | Não implementado |

### Longo prazo

| Item | Status atual |
|------|-------------|
| Módulo de Pacientes | Não implementado |
| Prontuário eletrônico | Não implementado |
| Agenda de consultas ambulatoriais | Não implementado |
| Integração ERP/DRE | Não implementado |

---

## 8. Métricas da auditoria

| Métrica | Valor |
|---------|-------|
| Rotas implementadas | 20 |
| Perfis RBAC | 5 |
| Server Functions | ~100+ |
| Edge Functions Supabase | 0 |
| Screenshots capturados | 12 |
| Fluxos documentados | 12 |
| GAPs críticos | 9 |

---

## 9. Posicionamento competitivo

O MedicFlow-AI na V1 se posiciona como **plataforma operacional + faturamento TISS MVP**, **não** como prontuário eletrônico ou ERP hospitalar completo.

**Pontos fortes para demo comercial:**
- Central operacional em tempo real
- Demo guiada de 7 passos
- Branding white-label
- Ciclo TISS auditável (guias → lotes → glosas)

**Limitações para comunicar com transparência:**
- Sem prontuário ou pacientes
- TISS sem envio automático a operadoras
- Provisionamento manual de usuários

---

## 10. Conclusão executiva

O MedicFlow-AI entrega valor imediato para **gestão de plantões**, **visibilidade operacional** e **faturamento TISS básico** em ambiente multi-tenant. A implantação assistida (piloto, demo, go-live) é um diferencial comercial sólido.

Para uso em produção clínica completa (prontuário, pacientes) ou faturamento regulatório pleno (ANS, operadoras), a V1 atual **requer complementação** conforme roadmap.

---

*Documento gerado com base na auditoria funcional de 08/06/2026.*
