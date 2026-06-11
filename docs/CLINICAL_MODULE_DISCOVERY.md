# Descoberta Forense de Módulos Clínicos — MedicFlow-AI

**Data:** 08/06/2026  
**Escopo:** busca em **todas as branches** de **ambos** os repositórios Git no workspace  
**Repositórios auditados:**

- `https://github.com/ararunaf/medflow-dashboard.git` (código da aplicação)
- `https://github.com/ararunaf/medicflow-enterprise.git` (wrapper)

**Branches disponíveis:** apenas `main` em ambos (após `git fetch --all`)

**Diretórios pesquisados:**

- `src/` (inclui `routes/`, `components/`, `lib/`)
- `supabase/` (inclui `migrations/`)
- `app/`, `pages/`, `database/` — **EVIDÊNCIA NÃO ENCONTRADA** (diretórios inexistentes no projeto)

---

## Metodologia

1. `git fetch --all` em ambos os repositórios
2. Busca textual em `src/` e `supabase/` com termos clínicos
3. `git grep` em todo o histórico de commits (`git rev-list --all`)
4. Verificação de rotas, componentes e tabelas por padrão de nomenclatura
5. Evidências brutas salvas em `docs/evidence/clinical-term-search.txt`

---

## Resultado por termo de busca

| Termo | Ocorrências | Contexto | Módulo clínico? |
|-------|-------------|----------|-----------------|
| Pacientes | 2 | `operational-gpt-prompt.ts` — instrução para IA evitar diagnósticos clínicos | **NÃO** — guardrail de copiloto |
| Paciente | 4 | `tiss.tsx` (placeholder/coluna UI), `operational-gpt-prompt.ts` | **NÃO** — contexto TISS |
| Patient | 22 | `guide-service.ts`, `tiss.tsx`, `database.types.ts`, migration `tiss_guides.patient_name` | **NÃO** — campo de guia TISS |
| Patients | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Prontuario | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Prontuário | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| MedicalRecord | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| MedicalRecords | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| ClinicalRecord | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Appointment | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Appointments | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Consulta | 21 | Painéis operacionais, copiloto GPT, TISS (`guide_type` consulta) | **NÃO** — consulta operacional/TISS, não agenda clínica |
| Consultas | 4 | Copiloto, timeline, migration TISS | **NÃO** |
| AgendaClinica | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Agenda | 3 | `dashboard.ts`, `dry-run-simulators.ts`, `mitigation-helpers.ts` — contexto de escalas | **NÃO** — agenda de profissionais |
| Atendimento | 1 | `production-service.ts` — data de atendimento em produção médica (repasse) | **NÃO** — financeiro |
| Encounter | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| EncounterRecord | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Anamnese | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| SOAP | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| CID | 302 | Falso positivo: substring em imports `lucide-react`, variáveis `_cid` em tabelas | **NÃO** — não é CID-10 clínico |
| Procedimento | 6 | `tiss.tsx` — procedimentos TUSS | **NÃO** — catálogo TISS |
| Prescription | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Receita | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Exame | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |
| Laudo | 0 | — | **EVIDÊNCIA NÃO ENCONTRADA** |

---

## Busca em histórico Git completo

```
git grep -i -l "pacientes|/paciente|prontuario|medical_record|clinical_record|appointments|encounters" $(git rev-list --all)
```

**Resultado:** nenhuma correspondência em todo o histórico de 22 commits.

**Conclusão:** EVIDÊNCIA NÃO ENCONTRADA de que módulos clínicos tenham existido e sido removidos.

---

## Rotas clínicas esperadas

| Rota | Encontrada em `src/` | Evidência |
|------|----------------------|-----------|
| `/pacientes` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `/paciente` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `/prontuario` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `/prontuarios` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `/consultas` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `/agenda` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA (existe `/escalas` para profissionais) |
| `/atendimento` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |

---

## Componentes por padrão de nomenclatura

| Padrão | Arquivos encontrados | Classificação |
|--------|---------------------|---------------|
| `Patient*` | 0 | EVIDÊNCIA NÃO ENCONTRADA |
| `Medical*` | `medical-payout-panels.tsx`, `use-medical-payout-foundation.ts`, `medical-payout-server.ts` | **Financeiro** (repasses médicos) |
| `Clinical*` | 0 | EVIDÊNCIA NÃO ENCONTRADA |
| `Appointment*` | 0 | EVIDÊNCIA NÃO ENCONTRADA |
| `Encounter*` | 0 | EVIDÊNCIA NÃO ENCONTRADA |
| `Record*` | 0 | EVIDÊNCIA NÃO ENCONTRADA |

---

## Tabelas por padrão de nomenclatura (migrations)

| Tabela | Encontrada | Classificação |
|--------|------------|---------------|
| `patients` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `patient` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `medical_records` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `clinical_records` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `appointments` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| `encounters` | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |

**Tabelas `medical_*` existentes (não clínicas):**

- `medical_production` — produção médica para repasse
- `medical_payouts` — repasses financeiros
- `medical_payout_items` — itens de repasse
- `medical_payout_audit` — auditoria de repasse

---

## ETAPA 4 — Matriz de comparação entre branches

| Branch | Pacientes | Prontuário | Agenda Clínica | Atendimento |
|--------|-----------|------------|----------------|-------------|
| `main` (medflow-dashboard) | **NÃO** | **NÃO** | **NÃO** | **NÃO** |
| `main` (medicflow-enterprise) | **NÃO** | **NÃO** | **NÃO** | **NÃO** |

**Nota:** Única branch em ambos os repositórios. Não há branches adicionais para comparar.

---

## Referências cruzadas encontradas (não clínicas)

### Campo `patient_name` em TISS

```sql
-- supabase/migrations/20250513201000_tiss_operational_foundation.sql:246
patient_name text NOT NULL,
```

Contexto: tabela `tiss_guides` — identificação textual do beneficiário na guia de faturamento, não cadastro de paciente.

### UI TISS

- `src/routes/tiss.tsx:518` — `placeholder="Paciente"`
- `src/routes/tiss.tsx:588` — coluna `<th>Paciente</th>`

Contexto: formulário de guia TISS, não módulo de prontuário.

---

## Conclusão da descoberta

**EVIDÊNCIA NÃO ENCONTRADA** de módulos clínicos (Pacientes, Prontuário, Agenda Clínica de pacientes, Atendimento/EHR) em:

- Qualquer branch (apenas `main` existe)
- Qualquer commit do histórico (22 commits verificados)
- Qualquer diretório de código (`src/`, `supabase/`)
- Qualquer migration SQL (29 arquivos)

As únicas referências a "paciente/patient" são **campos de faturamento TISS** e **instruções de guardrail do copiloto operacional**.

---

*Evidência bruta: `docs/evidence/clinical-term-search.txt`*
