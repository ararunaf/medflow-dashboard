# XSD oficial ANS — padrão TISS 4.01.00

Arquivos baixados de `github.com/renatofagalde/app-tiss-schemas` (mirror
público dos arquivos publicados pela própria ANS em
`gov.br/ans/pt-br/assuntos/operadoras/compromissos-e-interacoes-com-a-ans-1/padroes-e-schemas`),
em 2026-09-03 — commit `main` do repositório espelho no momento do download.
Nenhum conteúdo foi editado manualmente.

Usados por F3-S1 (`tiss-xml-serializer.ts`) e F3-S2 (`tiss-xsd-validator.ts`)
para gerar e validar `mensagemTISS` campo a campo contra o schema real.

| Arquivo | Papel |
|---|---|
| `tissV4_01_00.xsd` | Ponto de entrada — declara `mensagemTISS` |
| `tissSimpleTypesV4_01_00.xsd` | Tipos simples (`st_*`, `dm_*` — enums e formatos) |
| `tissComplexTypesV4_01_00.xsd` | Tipos compostos compartilhados |
| `tissGuiasV4_01_00.xsd` | Guias (consulta, SP-SADT, honorário, internação, odonto) |
| `tissAssinaturaDigital_v1.01.xsd` | Tipo `ans:Signature` (assinatura digital de guia) |
| `xmldsig-core-schema.xsd` | XML Signature (W3C) — `ds:Signature` do envelope |

Se a ANS publicar uma versão mais nova do padrão TISS, os 6 arquivos devem
ser rebaixados juntos (mesma versão) — não misturar versões.
