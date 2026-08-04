# UX-01 — Operational Flows

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04

---

## 1. Mapa mestre (estado atual)

```
PLANTÕES / ESCALAS
  Escalas <-> Plantões <-> Perfil
          <-> Central de IA (gestores)
          <-> Home (KPIs plantão)

DOCUMENTAL / CAPTURA
  Captura -> OCR/Parser/Audit/Correcao -> Revisao -> Aprovacao
       ^                                      |
       +--------- Processamento (filas) ------+
  Analytics -> Processamento

FATURAMENTO TISS
  TISS (manual): Convenios -> Guias -> Lotes -> XML -> Glosas/Repasse
  (sem handoff UI a partir da captura aprovada)

FINANCEIRO OPERACIONAL (plantoes)
  Financeiro hub -> Fechamento -> Conciliacao -> Dashboard executivo
  Executivo (atalhos comerciais)

PLATAFORMA / IMPLANTACAO
  Piloto -> Go-live -> Instituicao -> Painel ops -> Ajuda
```

**Gap estrutural:** os três eixos (Plantões · Documental · TISS) **não formam um único fluxo de ponta a ponta na UI**.

---

## 2. Fluxos completos (usáveis ponta a ponta na UI)

### 2.1 Captura → Processamento → Revisão

```
Captura (upload/câmera)
  ↓ sessão
OCR / estruturação / auditoria preventiva / correções
  ↓
/captura/revisao/$sessionId
  ↓ aprovação / reprovação
retorno → Captura ou Processamento (?queue=)
```

| Aspecto | Status |
|---------|--------|
| Filas | Completo (`ocr_pendente` … `reprovadas`) |
| Deep links | Completo |
| Canais UI | Parcial (só `file_upload` + `mobile_camera`) |
| Handoff TISS billing | **Incompleto / inexistente na UI** |

### 2.2 Plantões do dia

```
Home / Escalas → Plantões (aceitar/recusar)
              → Swaps (aprovar/negar)
              → Perfil (disponibilidade)
```

Status: **completo** para operação diária de escala.

### 2.3 Central de IA → ação clínica

```
Central → Quick Actions / opsFocus → Escalas / Plantões
Home (gestor) → card IA → Central
```

Status: **completo** no domínio plantões/IA operacional.

### 2.4 Hub financeiro → fechamento

```
/financeiro → fechamento-operacional
           → conciliacao-operacional
           → dashboard-executivo
```

Status: **completo** (conciliação menos descoberta — fora do menu).

### 2.5 TISS faturamento (manual)

```
Convênios / TUSS → Guias → Lotes → XML → Glosas / Recursos / Repasses
```

Status: **completo como MVP auditável**; independente da captura OCR.

---

## 3. Fluxos incompletos

| Fluxo desejado | O que falta na UI |
|----------------|-------------------|
| Captura aprovada → Guia TISS / Lote | Sem link/handoff após aprovação |
| Captura → Analytics | Sem atalho direto na Captura |
| Captura → Processamento | Processamento liga à Captura; inverso fraco |
| Scanner / Watch Folder → Captura | Tipos existem; UI de canal não |
| OCR Distribuído / Workers → Filas | Enterprise no backend; sem superfície de ops |
| Supervisor IA documental | Misturado em Captura/Central (Central = plantões) |
| Auditor IA como papel | Painel de auditoria preventiva existe; sem identidade de rota |
| Escalas → criar/editar escala | “Filtros” sem handler; criação não na tela |
| Home → filas documentais | Home só plantões |

---

## 4. Fluxos inexistentes (produto 24×7)

| Fluxo | Situação |
|-------|----------|
| Scanner TWAIN/WIA → ingestão | Inexistente na UI |
| Watch Folder monitorado | Inexistente na UI |
| Painel SLA operacional | Inexistente |
| Painel Produção 24×7 (além aba TISS) | Inexistente como cockpit |
| Monitoramento de workers/filas enterprise | Inexistente na UI de produto |
| Operação unificada “Captura→Auditoria→Financeiro→Fechamento” | Inexistente como jornada contínua |

---

## 5. Fluxo alvo (Centro Operacional — especificação UX-02+)

```
Captura Inteligente
        ↓
   OCR (fila)
        ↓
 Processamento / Parser
        ↓
 Auditoria Documental (+ Auditor IA)
        ↓
 Correções Inteligentes
        ↓
 Aprovação supervisionada
        ↓
 TISS / Faturamento (guias & lotes)
        ↓
 Financeiro / Fechamento
        ↓
 Monitoramento (Analytics + SLA + Produção)
```

Plantões / Pega Plantão permanecem eixo paralelo (Clínico), com ponte via Home role-aware e Central de IA.

---

## 6. Matriz de completude

| Fluxo | Completo | Incompleto | Inexistente |
|-------|:--------:|:----------:|:-----------:|
| Captura → Revisão → Aprovação | ✓ | | |
| Processamento por filas | ✓ | | |
| Analytics captura | ✓ | | |
| Captura → TISS billing | | ✓ | |
| Plantões / swaps | ✓ | | |
| Escalas gestão plena | | ✓ | |
| Central IA plantões | ✓ | | |
| Supervisor/Auditor IA documental | | ✓ | |
| Financeiro fechamento | ✓ | | |
| Scanner / TWAIN / WIA | | | ✓ |
| Watch Folder | | | ✓ |
| SLA / Produção 24×7 | | | ✓ |
| Workers / filas enterprise UI | | | ✓ |

---

## 7. Conclusão

Os blocos de **Captura Inteligente** e **Centro de Processamento** já materializam o núcleo do fluxo documental. A reorganização UX deve **conectar** esses blocos à Home, ao menu e (em sprint futura de produto) ao TISS — sem exigir mudança de Foundation nesta trilha de navegação.
