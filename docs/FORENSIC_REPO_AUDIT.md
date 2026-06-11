# Auditoria Forense de Repositório — MedicFlow-AI

**Data da auditoria forense:** 08/06/2026  
**Executor:** auditoria automatizada com evidências verificáveis  
**Workspace local:** `C:\Users\USER\OneDrive\Documentos\MedFlow-IA`

---

## Alerta crítico: dois repositórios Git no mesmo workspace

A inspeção forense identificou **dois repositórios Git independentes** no mesmo diretório de trabalho. Isso é evidência verificável e impacta a interpretação de “repositório correto”.

| Nível | Caminho Git root | Remote URL | Commit HEAD | Último commit |
|-------|------------------|------------|-------------|---------------|
| **Pai (wrapper)** | `MedFlow-IA/` | `https://github.com/ararunaf/medicflow-enterprise.git` | `f29e4ea8f83d617f356613ddd8c37aa7d634ed84` | 2026-05-26 22:16:12 -0300 |
| **Aplicação (código)** | `MedFlow-IA/MedFlow-IA/` | `https://github.com/ararunaf/medflow-dashboard.git` | `e7db7916ab0a4c9d6a0e49e2f0bc5e81a6b43392` | 2026-06-01 22:18:15 -0300 |

**Evidência adicional:**

- O repositório pai contém apenas **1 commit** (`Initial enterprise migration`) e rastreia somente `MedFlow-IA/` + `package-lock.json` via `git ls-tree -r HEAD`.
- `git submodule status` no pai retorna: `fatal: no submodule mapping found in .gitmodules for path 'MedFlow-IA'` — o diretório aninhado **não está configurado como submodule**.
- O código-fonte executável (rotas, componentes, migrations) reside em `MedFlow-IA/MedFlow-IA/`.
- A auditoria anterior (`docs/AUDITORIA_FUNCIONAL_MEDICFLOW.md`) referencia código em `MedFlow-IA/` com TanStack React Start + Supabase — isso corresponde ao repositório **medflow-dashboard**, não ao wrapper **medicflow-enterprise**.

---

## ETAPA 1 — Identificação do repositório

### Repositório da aplicação (onde o código vive)

| Item | Valor |
|------|-------|
| Repositório | `https://github.com/ararunaf/medflow-dashboard.git` |
| Branch | `main` |
| Commit SHA | `e7db7916ab0a4c9d6a0e49e2f0bc5e81a6b43392` |
| Último commit | `MedicFlow staging operational with password recovery` |
| Data | 2026-06-01 22:18:15 -0300 |
| Autor | Araruna \<ararunaf@gmail.com\> |

### Repositório pai (wrapper enterprise)

| Item | Valor |
|------|-------|
| Repositório | `https://github.com/ararunaf/medicflow-enterprise.git` |
| Branch | `main` |
| Commit SHA | `f29e4ea8f83d617f356613ddd8c37aa7d634ed84` |
| Último commit | `Initial enterprise migration` |
| Data | 2026-05-26 22:16:12 -0300 |
| Autor | Araruna \<ararunaf@gmail.com\> |

### Histórico dos últimos 50 commits — repositório da aplicação (`medflow-dashboard`)

| SHA | Data | Autor | Mensagem |
|-----|------|-------|----------|
| e7db791 | 2026-06-01 22:18:15 -0300 | Araruna | MedicFlow staging operational with password recovery |
| 8da6076 | 2026-05-08 21:23:43 +0000 | gpt-engineer-app[bot] | Substituiu a logomarca |
| 03c070c | 2026-05-08 21:23:41 +0000 | gpt-engineer-app[bot] | Changes |
| 26d1021 | 2026-05-08 21:12:50 +0000 | gpt-engineer-app[bot] | Work in progress |
| 82c3397 | 2026-05-08 16:48:28 +0000 | gpt-engineer-app[bot] | Reverted to commit 54ef8d7 |
| b50004a | 2026-05-08 16:48:09 +0000 | gpt-engineer-app[bot] | Centralizou logo transparente |
| c69947d | 2026-05-08 16:48:02 +0000 | gpt-engineer-app[bot] | Changes |
| 5d0fb85 | 2026-05-08 16:47:45 +0000 | gpt-engineer-app[bot] | Changes |
| 647820a | 2026-05-08 16:44:30 +0000 | gpt-engineer-app[bot] | Reverted to commit 54ef8d7 |
| d169a8d | 2026-05-08 16:44:00 +0000 | gpt-engineer-app[bot] | Adicionou logo com h-40 na tela |
| d6ea8f0 | 2026-05-08 16:43:52 +0000 | gpt-engineer-app[bot] | Changes |
| c137098 | 2026-05-08 16:43:39 +0000 | gpt-engineer-app[bot] | Changes |
| 54ef8d7 | 2026-05-08 15:42:36 +0000 | gpt-engineer-app[bot] | Criou todas as páginas e login |
| a9abf3e | 2026-05-08 15:42:24 +0000 | gpt-engineer-app[bot] | Changes |
| eafbaf2 | 2026-05-08 15:42:13 +0000 | gpt-engineer-app[bot] | Changes |
| fca7abe | 2026-05-08 15:42:06 +0000 | gpt-engineer-app[bot] | Changes |
| a114828 | 2026-05-08 15:40:40 +0000 | gpt-engineer-app[bot] | Changes |
| dd56a0d | 2026-05-08 15:40:30 +0000 | gpt-engineer-app[bot] | Changes |
| 893dd20 | 2026-05-08 15:39:56 +0000 | gpt-engineer-app[bot] | Changes |
| fe7389f | 2026-05-08 15:39:26 +0000 | gpt-engineer-app[bot] | Changes |
| 7e57939 | 2026-05-08 15:39:19 +0000 | gpt-engineer-app[bot] | Changes |
| ba20ba6 | 2025-01-01 00:00:00 +0000 | Lovable | template: tanstack_start_ts_2026-05-06 |

**Nota:** O repositório `medflow-dashboard` possui **22 commits** no total — menos de 50. Todos os commits estão listados acima.

### Histórico dos últimos 50 commits — repositório pai (`medicflow-enterprise`)

| SHA | Data | Autor | Mensagem |
|-----|------|-------|----------|
| f29e4ea | 2026-05-26 22:16:12 -0300 | Araruna | Initial enterprise migration |

**Nota:** O repositório pai possui **apenas 1 commit**.

---

## ETAPA 2 — Inventário completo de branches

### Branches locais — aplicação (`medflow-dashboard`)

```
* main
```

### Branches remotas — aplicação

```
remotes/origin/HEAD -> origin/main
remotes/origin/main
```

### Branches locais — pai (`medicflow-enterprise`)

```
* main
```

### Branches remotas — pai

```
remotes/origin/HEAD -> origin/main
remotes/origin/main
```

**Evidência:** `git fetch --all` executado em 08/06/2026 — resultado: `Nothing new to pack.` Nenhuma branch adicional encontrada em nenhum dos dois repositórios.

### Tabela de branches

| Branch | Repositório | Último Commit | Data | Divergência |
|--------|-------------|---------------|------|-------------|
| `main` | medflow-dashboard | e7db791 | 2026-06-01 22:18:15 -0300 | 0 ahead / 0 behind vs `origin/main` |
| `main` | medicflow-enterprise | f29e4ea | 2026-05-26 22:16:12 -0300 | 0 ahead / 0 behind vs `origin/main` |

**EVIDÊNCIA NÃO ENCONTRADA** para branches adicionais (develop, staging, feature/*, clinical/*, etc.) em qualquer repositório remoto ou local após `git fetch --all`.

---

## ETAPA 8 — Conclusão

### 1. A auditoria anterior foi executada no repositório correto?

**Resposta parcial — com ressalva estrutural.**

| Critério | Veredito | Evidência |
|----------|----------|-----------|
| Código auditado corresponde à aplicação MedicFlow | **SIM** | A auditoria anterior (`AUDITORIA_FUNCIONAL_MEDICFLOW.md`) inspeciona rotas em `src/routes/`, migrations em `supabase/migrations/` e ambiente `staging.medicflow.app.br` — todos existem em `MedFlow-IA/MedFlow-IA/` (remote: `medflow-dashboard.git`). |
| Repositório Git raiz do workspace | **NÃO corresponde ao código auditado** | O `git remote` na raiz do workspace aponta para `medicflow-enterprise.git` (1 commit), enquanto o código auditado está em repositório aninhado `medflow-dashboard.git`. |
| Ambiente de validação visual | **SIM** | `.env.staging` confirma `VITE_MEDFLOW_APP_URL=https://staging.medicflow.app.br` e projeto Supabase `utodixhxrvegzafcldpu`. |

### 2. A auditoria anterior foi executada na branch correta?

**SIM — com ressalva de escopo.**

- Única branch existente em ambos os repositórios: `main`.
- Não há evidência de branch alternativa contendo módulos clínicos.
- A auditoria anterior não declara branch explicitamente, mas o código inspecionado corresponde ao HEAD de `main` do `medflow-dashboard`.

### 3. Existe alguma branch contendo módulos clínicos?

**EVIDÊNCIA NÃO ENCONTRADA.**

- Apenas `main` existe (local e remoto) em ambos os repositórios.
- `git grep` em todo o histórico (`git rev-list --all`) não encontrou rotas `/pacientes`, `/prontuario`, `medical_records`, `appointments` ou `encounters`.

### 4. Existe alguma migration contendo módulos clínicos?

**EVIDÊNCIA NÃO ENCONTRADA** para módulos clínicos (pacientes, prontuário, agenda clínica, atendimento).

- 29 migrations em `supabase/migrations/` — todas com prefixo `operational_*`, `tiss_*`, `medical_payout*`, `financial_*`, `pilot_*`.
- Única referência a paciente: campo `patient_name text NOT NULL` em `tiss_guides` (contexto TISS/faturamento, não EHR).
- Evidência: `20250513201000_tiss_operational_foundation.sql` linha 246.

### 5. Existe alguma tabela clínica no banco?

**EVIDÊNCIA NÃO ENCONTRADA** para tabelas clínicas dedicadas.

| Tabela | Supabase REST (staging) | Evidência |
|--------|-------------------------|-----------|
| `patients` | HTTP 404 | Probe em 08/06/2026 |
| `patient` | HTTP 404 | Probe em 08/06/2026 |
| `medical_records` | HTTP 404 | Probe em 08/06/2026 |
| `clinical_records` | HTTP 404 | Probe em 08/06/2026 |
| `appointments` | HTTP 404 | Probe em 08/06/2026 |
| `encounters` | HTTP 404 | Probe em 08/06/2026 |
| `consultas` | HTTP 404 | Probe em 08/06/2026 |
| `prontuarios` | HTTP 404 | Probe em 08/06/2026 |
| `tiss_guides` (operacional) | HTTP 200 | Probe em 08/06/2026 |
| `shifts` (operacional) | HTTP 200 | Probe em 08/06/2026 |

### 6. O MedicFlow-AI atualmente é:

**(A) Plataforma de plantões e TISS** — com módulos financeiros operacionais adjuntos.

**Justificativa com evidências:**

- Rotas implementadas: `/escalas`, `/plantoes`, `/central`, `/tiss`, `/financeiro/*` — ver `docs/ROUTES_FORENSIC_AUDIT.md`.
- Menu sidebar (`src/components/app-shell.tsx`): Home, Escalas, Plantões, TISS, Financeiro — sem Pacientes ou Prontuário.
- Tabelas: `shifts`, `shift_assignments`, `tiss_guides`, `medical_payouts` — sem `patients` ou `medical_records`.
- Screenshots capturados: escalas, plantões, TISS, financeiro — sem telas de pacientes/prontuário.

**Não é (B) Sistema clínico completo** — EVIDÊNCIA NÃO ENCONTRADA para módulos EHR.  
**Não é (C) Plataforma híbrida com EHR** — referências a "paciente" limitam-se a `patient_name` em guias TISS.

---

## STATUS FINAL

### **GO** — para validação das conclusões da auditoria funcional anterior

A auditoria anterior (`AUDITORIA_FUNCIONAL_MEDICFLOW.md`, 08/06/2026) **está correta quanto ao escopo funcional auditado**: o MedicFlow-AI é uma plataforma operacional (plantões, escalas, TISS, financeiro) **sem módulos clínicos de pacientes/prontuário**.

### Ressalvas técnicas (NO-GO parcial em governança de repositório)

| Ressalva | Impacto |
|----------|---------|
| Dois repositórios Git no mesmo workspace sem submodule configurado | Risco de auditoria no repositório errado (`medicflow-enterprise` vs `medflow-dashboard`) |
| Repositório pai com 1 commit não representa o código da aplicação | Qualquer auditoria baseada apenas no `git log` da raiz é incompleta |
| Apenas branch `main` existe | Impossível validar branches alternativas — mas também impossível que módulos clínicos existam em branch não publicada localmente |

### Recomendação forense

Para futuras auditorias, declarar explicitamente:

1. Remote: `https://github.com/ararunaf/medflow-dashboard.git`
2. Path: `MedFlow-IA/MedFlow-IA/`
3. Branch: `main`
4. Commit: SHA do HEAD no momento da auditoria

---

*Relatórios complementares: `CLINICAL_MODULE_DISCOVERY.md`, `DATABASE_FORENSIC_AUDIT.md`, `ROUTES_FORENSIC_AUDIT.md`, evidências em `docs/evidence/`.*
