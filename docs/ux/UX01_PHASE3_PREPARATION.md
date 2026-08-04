# UX-01 — Phase 3 Preparation (UI Space)

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  

Classificação **apenas de presença na UI de produto** (não de maturidade do backend Enterprise).

Legenda:

- **EXISTENTE** — superfície utilizável hoje  
- **PLACEHOLDER NECESSÁRIO** — parcialmente presente / precisa identidade ou slot no IA  
- **NOVA ÁREA NECESSÁRIA** — sem rota/UI de produto

---

## 1. Matriz de preparação

| Funcionalidade futura | Classificação | Evidência / notas |
|-----------------------|---------------|-------------------|
| Scanner | **NOVA ÁREA NECESSÁRIA** | Sem rota/UI; ingest enterprise tem enums |
| TWAIN | **NOVA ÁREA NECESSÁRIA** | Sem UI |
| WIA | **NOVA ÁREA NECESSÁRIA** | Sem UI |
| Watch Folder | **NOVA ÁREA NECESSÁRIA** | Tipo `scanner_folder` / WATCH_FOLDER no domínio; DropZone não expõe |
| OCR | **EXISTENTE** | `/captura`, fila `ocr_pendente`, review workspace |
| OCR Distribuído | **NOVA ÁREA NECESSÁRIA** | Runtime enterprise ≠ UI de orquestração |
| Supervisor IA | **PLACEHOLDER NECESSÁRIO** | `/central` = supervisor de **plantões**; falta slot documental |
| Auditor IA | **PLACEHOLDER NECESSÁRIO** | `CaptureAuditPanel` / fila auditoria; sem rota “Auditor IA” |
| Processamento em Lote | **EXISTENTE** (parcial) | Filas em `/processamento` + lotes TISS; não unificado |
| Filas | **EXISTENTE** | Centro de Processamento |
| Workers | **NOVA ÁREA NECESSÁRIA** | Demos enterprise não ligados a rotas UI |
| Operadoras | **EXISTENTE** | TISS Convênios + coluna Operadora no processamento |
| Painel de Produção | **PLACEHOLDER NECESSÁRIO** | Aba Produção em `/tiss`; falta cockpit 24×7 |
| Painel de SLA | **NOVA ÁREA NECESSÁRIA** | Sem tela; docs piloto sem SLA formal |

---

## 2. Espaço arquitetural na navegação (congelado)

Para absorver Fase 3 **sem** redesenhar de novo:

```
OPERAÇÃO
  Home (cockpit)
  Captura              ← estende canais (scanner/watch) no futuro
  Processamento        ← filas atuais + futuros workers
  [Scanner]            ← NOVA (filho de Captura ou item próprio)
  [Watch Folder]       ← NOVA

IA
  Central de IA        ← hoje plantões; evoluir ou split
  [Supervisor IA]      ← PLACEHOLDER / split
  [Auditor IA]         ← PLACEHOLDER (deep link fila auditoria)

FATURAMENTO
  TISS
  Financeiro…

MONITORAMENTO
  Analytics            ← existente
  Painel ops           ← health plataforma
  [Produção 24×7]      ← PLACEHOLDER a partir de TISS/Analytics
  [SLA]                ← NOVA
```

---

## 3. Reuso de superfícies existentes

| Superfície atual | Pode hospedar |
|------------------|---------------|
| `/captura` | Canais Scanner / Watch Folder (tabs) |
| `/processamento` | Workers, OCR distribuído (status de fila) |
| `/central` | Supervisor (se unificar) **ou** manter clínico e criar `/ia/documental` |
| `/analytics` | SLA / throughput (extensão) |
| `/tiss` aba Produção | Painel Produção inicial |
| `/operacao` | Health de workers (cuidado: hoje é plataforma/backup) |

**Recomendação:** não sobrecarregar `/operacao` (health/backup) com produção clínica/documental — criar grupo Monitoramento.

---

## 4. Riscos se UX-02 não reservar espaço

1. Novos itens caem de novo na lista plana → regressão de descoberta  
2. Scanner vira rota órfã sem pai “Operação”  
3. Supervisor/Auditor competem com Central de plantões sem taxonomia  
4. SLA nasce em docs/comercial sem âncora de menu

---

## 5. Conclusão

Há **base suficiente** (Captura, Processamento, Analytics, TISS, Central) para a Fase 3 entrar por extensão.

Faltam **áreas novas** (Scanner/TWAIN/WIA/Watch Folder/SLA/Workers UI) e **placeholders nomeados** (Supervisor/Auditor documental, Produção 24×7).

A interface está preparada para receber a Fase 3?  
**PARCIAL** — com navegação agrupada (UX-02) sobe para preparada; sem isso permanece frágil.
