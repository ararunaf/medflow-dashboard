# Login — Simetria Visual das Logomarcas (V2)

**Data:** 2026-06-11  
**Ambiente:** staging (`https://staging.medicflow.app.br`)  
**Deploy Version ID:** `893e1fb6-78e9-4afe-bf99-ebb047f1d1ab`  
**Tipo:** alteração exclusivamente visual — sem impacto em autenticação, Supabase, RBAC ou recuperação de senha.

---

## FASE 1 — Auditoria

### Painel direito — card da logomarca (`login.tsx`)

| Propriedade | Valor |
| --- | --- |
| Componente | `src/routes/login.tsx` (inline) |
| Container | `flex justify-center mb-8 bg-surface rounded-2xl p-6 border border-border` |
| Logo | `height: 6.25rem` (100px), `w-auto` |
| Fundo | `bg-surface` (branco) |
| Borda | `border border-border` (1px suave) |
| Radius | `rounded-2xl` (16px) |
| Sombra | implícita via contraste surface/border (sem shadow explícita) |
| Espaçamento | `p-6` (24px), `mb-8` abaixo do card |

### Painel esquerdo — antes (`LoginBrandingPanel`)

| Propriedade | Valor (antes) |
| --- | --- |
| Componente | `src/components/login-branding-panel.tsx` |
| Logo | `<img>` direto sobre `bg-brand-gradient` |
| Classes da logo | `h-[7.5rem] lg:h-32 xl:h-36 w-auto max-w-[min(100%,18rem)] object-contain object-left mb-6 lg:mb-8 drop-shadow-sm` |
| Fundo do logo | nenhum (transparente sobre gradiente) |
| Borda / radius | nenhum |
| Alinhamento | `items-start` (esquerda) |

### Assimetria identificada

- Esquerda: logo flutuando no gradiente com `drop-shadow-sm`
- Direita: logo dentro de card branco com borda arredondada
- Resultado: famílias visuais distintas na mesma tela

---

## FASE 2 — Unificação visual

O painel esquerdo passou a usar o **mesmo padrão de card** do painel direito:

```tsx
const LOGIN_LOGO_CARD =
  "flex justify-center bg-surface rounded-2xl border border-border w-full";
```

Aplicado com padding ligeiramente maior (`p-7 lg:p-8`) e logo em `7.5rem` (120px) vs `6.25rem` (100px) do painel direito.

O painel direito permanece **inalterado**.

---

## FASE 3 — Proporções

| Painel | Card padding | Logo height | Observação |
| --- | --- | --- | --- |
| Esquerdo | `p-7 lg:p-8` | `7.5rem` (120px) | ~20% maior, sutil |
| Direito | `p-6` | `6.25rem` (100px) | mantido |

Composição centralizada (`items-center text-center`) no bloco superior do painel esquerdo.

---

## FASE 4 — Hierarquia visual

Ordem vertical no painel esquerdo (centralizada):

1. Card da logomarca (branco)
2. **MedicFlow-AI**
3. **Plataforma Operacional Inteligente**
4. *(área flexível)*
5. **Inteligência que conecta. Operação que transforma.**
6. Escalas, plantões e indicadores clínicos em tempo real, em um único fluxo.

Layout mobile (`< lg`) inalterado — painel esquerdo continua oculto.

---

## FASE 5 — Validação estética

### Antes (V1 — logo sobre gradiente)

| Critério | Nota |
| --- | --- |
| Branding | 7/10 |
| Simetria | 5/10 |
| Elegância | 6/10 |
| Consistência visual | 5/10 |
| Aparência comercial | 7/10 |

### Depois (V2 — cards unificados)

| Critério | Nota |
| --- | --- |
| Branding | 9/10 |
| Simetria | 9/10 |
| Elegância | 9/10 |
| Consistência visual | 9/10 |
| Aparência comercial | 9/10 |

**Ganhos:** simetria esquerda/direita, percepção premium/SaaS enterprise, legibilidade da logo sobre gradiente via card branco.

---

## FASE 6 — Screenshots

| Arquivo | Viewport |
| --- | --- |
| `docs/screenshots/login-branding-v2/login-desktop-v2.png` | 1440×900 |
| `docs/screenshots/login-branding-v2/login-tablet-v2.png` | 1024×768 |
| `docs/screenshots/login-branding-v2/login-mobile-v2.png` | 390×844 |
| `docs/screenshots/login-branding-v2/login-desktop-before-v2.png` | estado anterior (V1) |

Script: `scripts/capture-login-branding-v2-screenshots.mjs`

---

## FASE 7 — Build e deploy

```bash
npm run build          # ✓
npm run build:staging  # ✓
npm run ssr-validate   # ✓
npm run deploy:staging # ✓ — Version ID: 893e1fb6-78e9-4afe-bf99-ebb047f1d1ab
```

---

## Componentes alterados

| Arquivo | Alteração |
| --- | --- |
| `src/components/login-branding-panel.tsx` | Card branco unificado, centralização, hierarquia |
| `scripts/capture-login-branding-v2-screenshots.mjs` | **Novo** — captura screenshots V2 |
| `docs/screenshots/login-branding-v2/*` | Screenshots antes/depois |
| `docs/LOGIN_BRANDING_V2.md` | **Novo** — esta documentação |

**Não alterados:** `login.tsx` (formulário), autenticação, Supabase, RBAC, recuperação de senha, layout mobile.

---

## Justificativa UX

A assimetria entre logo sobre gradiente (esquerda) e logo em card branco (direita) quebrava a coerência visual da tela de login — ponto crítico de primeira impressão em produto B2B/SaaS.

Unificar o tratamento em cards da mesma família (`bg-surface`, `rounded-2xl`, `border-border`) reforça acabamento profissional sem alterar fluxo funcional. O card esquerdo ligeiramente maior mantém hierarquia de branding no painel promocional, enquanto o direito permanece focado no formulário.

---

## Impacto visual

### Antes

![Login desktop antes V2](../screenshots/login-branding-v2/login-desktop-before-v2.png)

Logo esquerda flutuando no gradiente; card branco apenas à direita.

### Depois

![Login desktop depois V2](../screenshots/login-branding-v2/login-desktop-v2.png)

Ambos os painéis com cards da mesma família visual; composição centralizada e simétrica.

---

## Screenshot final para aprovação

![Login desktop V2 — staging](../screenshots/login-branding-v2/login-desktop-v2.png)

**URL:** https://staging.medicflow.app.br/login
