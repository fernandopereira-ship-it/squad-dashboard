import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SQUADS, MQL_INTENCOES, MQL_FAIXAS, MQL_PAGAMENTOS, SQUAD_FROM_COMMERCIAL } from "@/lib/constants";
import type { RegrasMqlData, RegrasMqlEmp, RegrasMqlSquad } from "@/lib/types";

export const dynamic = "force-dynamic";

const TOTAL_INT = MQL_INTENCOES.length;
const TOTAL_FAIXAS = MQL_FAIXAS.length;
const TOTAL_PAG = MQL_PAGAMENTOS.length;

// Nomes a ignorar (não são empreendimentos reais)
const IGNORE_NAMES = new Set(["LP WordPress", "Teste Empreendimento"]);

export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from("squad_baserow_empreendimentos")
      .select("nome, commercial_squad, mql_intencoes, mql_faixas, mql_pagamentos, status, id")
      .eq("status", true)
      .neq("nome", "")
      .order("id", { ascending: false });

    if (error) throw new Error(`Supabase error: ${error.message}`);

    // Deduplica por nome — pega o com id mais alto (mais recente)
    const uniqueMap = new Map<string, (typeof rows)[number]>();
    for (const row of rows || []) {
      if (IGNORE_NAMES.has(row.nome)) continue;
      if (!uniqueMap.has(row.nome)) {
        uniqueMap.set(row.nome, row);
      }
    }

    // Agrupar por squad
    const squadEmps = new Map<number, RegrasMqlEmp[]>();
    for (const [, row] of uniqueMap) {
      const sqId = SQUAD_FROM_COMMERCIAL[row.commercial_squad];
      if (!sqId) continue;

      const intencoes = (row.mql_intencoes || []) as string[];
      const faixas = (row.mql_faixas || []) as string[];
      const pagamentos = (row.mql_pagamentos || []) as string[];

      const aberturaIntencoes = Math.round((intencoes.length / TOTAL_INT) * 100);
      const aberturaFaixas = Math.round((faixas.length / TOTAL_FAIXAS) * 100);
      const aberturaPagamentos = Math.round((pagamentos.length / TOTAL_PAG) * 100);
      const aberturaGeral = Math.round(((intencoes.length / TOTAL_INT + faixas.length / TOTAL_FAIXAS + pagamentos.length / TOTAL_PAG) / 3) * 100);

      const emp: RegrasMqlEmp = {
        nome: row.nome,
        intencoes,
        faixas,
        pagamentos,
        aberturaIntencoes,
        aberturaFaixas,
        aberturaPagamentos,
        aberturaGeral,
      };

      if (!squadEmps.has(sqId)) squadEmps.set(sqId, []);
      squadEmps.get(sqId)!.push(emp);
    }

    const squads: RegrasMqlSquad[] = SQUADS.map((sq) => {
      const emps = squadEmps.get(sq.id) || [];
      const aberturaMedia = emps.length > 0 ? Math.round(emps.reduce((s, e) => s + e.aberturaGeral, 0) / emps.length) : 0;
      return {
        id: sq.id,
        name: sq.name,
        empreendimentos: emps.sort((a, b) => a.nome.localeCompare(b.nome)),
        aberturaMedia,
      };
    });

    const result: RegrasMqlData = { squads };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Regras MQL error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
