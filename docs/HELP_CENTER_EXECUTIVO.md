# HELP-CENTER-01 — Relatório Executivo

**Tarefa:** Inserir materiais institucionais na página Ajuda  
**Data:** 12/06/2026  
**Escopo:** UX, conteúdo institucional e disponibilização de arquivos (sem alteração de RBAC, banco ou Supabase)

---

## 1. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/routes/ajuda.tsx` | Integração das seções executivas + divisor "Biblioteca operacional" |
| `src/components/help-center/help-center-executive.tsx` | **Novo** — 5 seções institucionais |
| `src/components/help-center/image-lightbox.tsx` | **Novo** — preview, lightbox fullscreen e download |
| `src/lib/assets/help-center.ts` | **Novo** — constantes de assets públicos |
| `public/help/workflow-operacional-executivo.png` | **Novo** — imagem institucional do workflow (2560×1440) |
| `public/help/medicflow-ai-corporativo-premium.pptx` | **Novo** — apresentação corporativa (20 slides) |
| `public/help/medicflow-ai-corporativo-premium.pdf` | **Novo** — PDF para visualização no navegador |
| `scripts/generate-workflow-executive-image.py` | **Novo** — gerador da imagem de workflow |
| `scripts/capture-help-center-screenshots.mjs` | **Novo** — captura de evidências visuais |
| `scripts/fixtures/help-center-preview.html` | **Novo** — fixture para screenshots offline |

---

## 2. Imagem do workflow executivo

**Disponibilização:**

- Arquivo gerado por `scripts/generate-workflow-executive-image.py` com base na documentação institucional (`MEDICFLOW_WORKFLOW_OPERACIONAL.md`, `MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md`).
- Publicado em `public/help/workflow-operacional-executivo.png` (servido em `/help/workflow-operacional-executivo.png`).
- Resolução: **2560×1440 px** (alta definição preservada no download).

**Conteúdo visual:**

- Captação de Plantões (10 etapas)
- Hub Administrativo Médico e módulos da plataforma
- Fluxo operacional completo e valor gerado
- Stack e posicionamento V1

**UX na página:**

- Preview responsivo na seção "Como Funciona o MedicFlow-AI"
- Clique na imagem → modal **fullscreen** com fundo escuro
- Botões **Ampliar** e **Download**
- Tecla `Escape` fecha o modal

---

## 3. Apresentação corporativa PowerPoint

**Origem:** `docs/MEDICFLOW_PRESENTACAO_CORPORATIVA.pptx` (equivalente institucional ao arquivo solicitado `MedicFlow_AI_Corporativo_Premium(1).pptx`, que não estava no repositório).

**Disponibilização:**

| Formato | Caminho público | Uso |
|---------|-----------------|-----|
| PowerPoint | `/help/medicflow-ai-corporativo-premium.pptx` | Download direto |
| PDF | `/help/medicflow-ai-corporativo-premium.pdf` | Visualização em nova aba |

**Card na página:**

- Nome: **MedicFlow-AI Corporativo Premium**
- Slides: **20**
- Descrição executiva conforme especificação
- Botão **Visualizar** → abre PDF em nova aba
- Botão **Download** → baixa `.pptx`

---

## 4. Screenshots capturados

Pasta: `docs/screenshots/help-center/`

| Arquivo | Conteúdo |
|---------|----------|
| `01-ajuda-overview.png` | Visão geral da página com todas as seções |
| `02-ajuda-workflow.png` | Seção workflow com imagem institucional |
| `03-ajuda-ppt-card.png` | Card da apresentação corporativa |
| `04-ajuda-ia.png` | Seção Central de IA |

Captura via `node scripts/capture-help-center-screenshots.mjs` (preview estático com CSS de produção).

---

## 5. Resultado do build

### `npm run build`

**Status:** ✅ Sucesso

- Client bundle gerado (~25s)
- SSR bundle gerado (~21s)
- Chunk `ajuda-*.js` incluído no bundle

### `npm run build:staging`

**Status:** ✅ Sucesso

- Build staging concluído
- Marker escrito em `dist/.staging-build-marker.json`

---

## 6. Nova estrutura da página `/ajuda`

1. **Sobre o MedicFlow-AI** — texto institucional
2. **Como Funciona o MedicFlow-AI** — workflow com lightbox
3. **Apresentação Corporativa** — card PPT/PDF
4. **Central de IA** — recursos + link `/central`
5. **Primeiros Passos** — 6 cards com links operacionais
6. **Biblioteca operacional** — busca, FAQ, guias e docs (conteúdo anterior preservado)

---

## 7. URL e evidências

| Item | Valor |
|------|-------|
| **URL da página** | `/ajuda` |
| **Produção** | `https://medicflow.app.br/ajuda` (após deploy) |
| **Staging** | `https://staging.medicflow.app.br/ajuda` (após deploy) |
| **Local** | `http://localhost:3000/ajuda` |

---

## 8. Avaliação UX — Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Propósito** | FAQ e busca de artigos | Centro de treinamento + onboarding + comercial |
| **Materiais institucionais** | Apenas texto em artigos | Workflow visual, PPT executivo, seção IA |
| **Onboarding** | Links dispersos em artigos | 6 cards "Primeiros Passos" com rotas diretas |
| **Comercial** | Link para `/piloto` no header | Apresentação corporativa com visualizar/download |
| **IA** | Mencionada em artigos | Seção dedicada com 8 recursos + CTA `/central` |
| **Visual** | Grid de cards de texto | Seções executivas com ícones Lucide e hierarquia clara |
| **Biblioteca** | Página inteira era biblioteca | Biblioteca mantida abaixo do divisor institucional |

**Impacto:** A página passa a funcionar como **hub institucional** para demos comerciais, treinamento de novos usuários e onboarding de pilotos, sem alterar regras de negócio ou backend.

---

*Gerado automaticamente na entrega HELP-CENTER-01.*
