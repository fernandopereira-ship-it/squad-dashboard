# Squad Dashboard

## Projeto
Dashboard de acompanhamento de vendas por squads para a Seazone.
- **Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind 4
- **Deploy:** Vercel (squad-dashboard-eight.vercel.app)
- **GitHub:** fernandopereira-ship-it/squad-dashboard
- **Supabase:** ewgqbkdriflarmmifrvs

## Arquitetura
```
Pipedrive API → Edge Function (sync-squad-dashboard) → Supabase Tables
                                ↓ pg_cron (a cada 2h)
Supabase Tables → API Routes (Next.js) → JSON → React Frontend → Vercel
```

## Tabelas Supabase
| Tabela | Descrição |
|--------|-----------|
| squad_daily_counts | Contagens diárias por tab/empreendimento (35 dias) |
| squad_alignment | Deals abertos por empreendimento × owner |
| squad_metas | Metas mensais por squad × tab |
| squad_ratios | Ratios 90d e contagens (1 row por mês) |

## Edge Function: sync-squad-dashboard
- **Modos:** daily (1 tab), alignment, metas, all
- **Auth:** service_role JWT (via Bearer token)
- **Token Pipedrive:** lido do Vault via RPC `vault_read_secret`
- **pg_cron:** 6 jobs separados a cada 2h (minutos :03 a :08)

## Regras
- Dados vêm do Supabase, NÃO do Pipedrive direto
- Pipeline 28 + Canal Marketing filtrados na edge function
- Squads hardcoded em `src/lib/constants.ts`
- REGRA: WORKER_LIMIT no free tier — edge functions separadas em horários distintos
- REGRA: Para popular dados iniciais, usar script local (não edge function)

## Estrutura
```
src/
  app/page.tsx                              -- Dashboard client component
  app/api/dashboard/route.ts                -- API principal (tab + metas do Supabase)
  app/api/dashboard/acompanhamento/route.ts -- Dados de acompanhamento
  app/api/dashboard/alinhamento/route.ts    -- Dados de alinhamento
  components/dashboard/                     -- Header, AcompanhamentoView, AlinhamentoView, UI
  lib/constants.ts                          -- Squads, UI tokens
  lib/supabase.ts                           -- Cliente Supabase (anon key)
  lib/types.ts                              -- Interfaces TypeScript
  lib/dates.ts                              -- Gerador de datas 28d
```

## Env Vars
- `NEXT_PUBLIC_SUPABASE_URL` — URL do Supabase (Vercel + .env.local)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key do Supabase (Vercel + .env.local)
