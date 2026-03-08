# Squad Dashboard

## Projeto
Dashboard de acompanhamento de vendas por squads para a Seazone.
- **Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind 4
- **Deploy:** Vercel (squad-dashboard-eight.vercel.app)
- **GitHub:** fernandopereira-ship-it/squad-dashboard
- **Fonte de dados:** Pipedrive API (pipeline 28, Canal Marketing)

## Arquitetura
```
Pipedrive API → API Routes (server-side) → JSON → React Frontend → Vercel
```

## Regras
- **SEMPRE** filtrar pipeline_id = 28
- **SEMPRE** filtrar Canal = Marketing (campo `93b3ada8...` == `"12"`)
- **status = all_not_deleted** nas abas MQL/SQL/OPP/WON (inclui won e lost)
- **status = open** APENAS no Alinhamento Squad
- Midnight overflow: para MQL e WON, filtrar localmente pela data estrita
- Squads são hardcoded em `src/lib/constants.ts`

## Campos Pipedrive
| Campo | Key | Field ID |
|-------|-----|----------|
| MQL | add_time | 12462 |
| SQL | bc74bcc4... | 12550 |
| OPP | bfafc352... | 12608 |
| WON | won_time | 12467 |
| Canal | 93b3ada8... | - |
| Empreendimento | 6d565fd4... | - |

## Estrutura
```
src/
  app/page.tsx                    -- Dashboard client component
  app/api/dashboard/route.ts      -- API principal (tab + alinhamento + metas)
  components/dashboard/           -- Header, AcompanhamentoView, AlinhamentoView, UI
  lib/constants.ts                -- Squads, tokens, empreendimentos
  lib/pipedrive.ts                -- Cliente Pipedrive API
  lib/types.ts                    -- Interfaces TypeScript
  lib/dates.ts                    -- Gerador de datas 28d
```

## Env Vars
- `PIPEDRIVE_API_TOKEN` — Token da API do Pipedrive (Vercel production)
