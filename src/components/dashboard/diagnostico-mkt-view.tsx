"use client";

import { useState, useMemo } from "react";
import { T } from "@/lib/constants";
import type { CampanhasData, MetaAdRow, CampanhasEmpSummary } from "@/lib/types";

interface Props {
  data: CampanhasData | null;
  loading: boolean;
}

function formatBRL(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(v: number): string {
  return `${v.toFixed(2)}%`;
}

const SEV_COLORS = {
  CRITICO: { border: T.destructive, bg: "#FEF2F2", text: T.destructive },
  ALERTA: { border: T.laranja500, bg: "#FFFBEB", text: "#92400E" },
  OK: { border: T.verde600, bg: T.verde50, text: T.verde700 },
} as const;

export function DiagnosticoMktView({ data, loading }: Props) {
  const [filtroEmp, setFiltroEmp] = useState("todos");
  const [filtroSev, setFiltroSev] = useState("todos");

  // Flatten all empreendimentos for the summary table
  const allEmps = useMemo(() => {
    if (!data) return [];
    const emps: CampanhasEmpSummary[] = [];
    for (const sq of data.squads) {
      for (const emp of sq.empreendimentos) {
        if (emp.ads > 0) emps.push(emp);
      }
    }
    return emps.sort((a, b) => b.spend - a.spend);
  }, [data]);

  // Flatten all ads with diagnostico for the full table
  const allAds = useMemo(() => {
    if (!data) return [];
    const ads: MetaAdRow[] = [];
    for (const sq of data.squads) {
      for (const emp of sq.empreendimentos) {
        if (emp.adsDetail) {
          for (const ad of emp.adsDetail) {
            ads.push(ad);
          }
        }
      }
    }
    return ads;
  }, [data]);

  // Unique empreendimentos for filter
  const empOptions = useMemo(() => {
    const set = new Set(allAds.map((a) => a.empreendimento));
    return Array.from(set).sort();
  }, [allAds]);

  // Filtered ads
  const filteredAds = useMemo(() => {
    return allAds.filter((ad) => {
      if (filtroEmp !== "todos" && ad.empreendimento !== filtroEmp) return false;
      if (filtroSev !== "todos" && ad.severidade !== filtroSev) return false;
      return true;
    });
  }, [allAds, filtroEmp, filtroSev]);

  if (loading && !data) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: T.cinza600 }}>
        Carregando diagnósticos...
      </div>
    );
  }

  if (!data || data.summary.totalAds === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: T.cinza600 }}>
        Nenhum dado disponível. Execute o sync primeiro.
      </div>
    );
  }

  const { summary, top10 } = data;

  return (
    <>
      {/* Summary pills */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <SummaryCard
          label="Investimento"
          value={formatBRL(summary.totalSpend)}
          sub={`${summary.totalAds} ads ativos`}
          color={T.azul600}
        />
        <SummaryCard
          label="Leads"
          value={String(summary.totalLeads)}
          sub={`CPL médio ${formatBRL(summary.avgCpl)}`}
          color={T.verde600}
        />
        <SummaryCard
          label="Críticos"
          value={String(summary.criticos)}
          sub="Requerem ação imediata"
          color={T.destructive}
        />
        <SummaryCard
          label="Alertas"
          value={String(summary.alertas)}
          sub="Monitorar de perto"
          color={T.laranja500}
        />
      </div>

      {/* Resumo por Empreendimento */}
      <Section title="Resumo por Empreendimento">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left" }}>Empreendimento</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Ads</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Gasto</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
              <th style={{ ...thStyle, textAlign: "right" }}>CPL</th>
              <th style={{ ...thStyle, textAlign: "right", color: T.destructive }}>Crit.</th>
              <th style={{ ...thStyle, textAlign: "right", color: T.laranja500 }}>Alert.</th>
            </tr>
          </thead>
          <tbody>
            {allEmps.map((emp) => (
              <tr
                key={emp.emp}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.cinza50)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
              >
                <td style={{ ...tdStyle }}>{emp.emp}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{emp.ads}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{formatBRL(emp.spend)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{emp.leads}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{emp.cpl > 0 ? formatBRL(emp.cpl) : "-"}</td>
                <td style={{ ...tdStyle, textAlign: "right", color: emp.criticos > 0 ? T.destructive : T.cinza300, fontWeight: emp.criticos > 0 ? 700 : 400 }}>
                  {emp.criticos}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", color: emp.alertas > 0 ? T.laranja500 : T.cinza300, fontWeight: emp.alertas > 0 ? 700 : 400 }}>
                  {emp.alertas}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Top 10 — Ação Imediata */}
      {top10.length > 0 && (
        <Section title={`Top ${top10.length} — Ação Imediata`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "12px" }}>
            {top10.map((ad) => {
              const sev = SEV_COLORS[ad.severidade] || SEV_COLORS.OK;
              const diagnosticos = ad.diagnostico ? ad.diagnostico.split(" | ") : [];
              return (
                <div
                  key={ad.ad_id}
                  style={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E6E7EA",
                    borderLeft: `4px solid ${sev.border}`,
                    borderRadius: "8px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: T.cinza600 }}>{ad.empreendimento}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: sev.text,
                        backgroundColor: sev.bg,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {ad.severidade}
                    </span>
                  </div>
                  {/* Ad name */}
                  <div
                    style={{ fontSize: "13px", fontWeight: 600, color: T.fg, marginBottom: "8px", lineHeight: 1.3 }}
                    title={ad.ad_name}
                  >
                    {ad.ad_name}
                  </div>
                  {/* Stats inline */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <MiniStat label="Gasto" value={formatBRL(ad.spend)} />
                    <MiniStat label="Leads" value={String(ad.leads)} />
                    <MiniStat label="CPL" value={ad.cpl > 0 ? formatBRL(ad.cpl) : "-"} />
                    <MiniStat label="CTR" value={pct(ad.ctr)} />
                    <MiniStat label="Freq" value={ad.frequency.toFixed(1)} />
                  </div>
                  {/* Diagnósticos */}
                  {diagnosticos.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {diagnosticos.map((d, i) => (
                        <div key={i} style={{ fontSize: "11px", color: sev.text, lineHeight: 1.4 }}>
                          • {d.trim()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Tabela Completa */}
      <Section title="Todos os Ads">
        {/* Filtros */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.cinza700 }}>
            Empreendimento
            <select
              value={filtroEmp}
              onChange={(e) => setFiltroEmp(e.target.value)}
              style={selectStyle}
            >
              <option value="todos">Todos</option>
              {empOptions.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.cinza700 }}>
            Severidade
            <select
              value={filtroSev}
              onChange={(e) => setFiltroSev(e.target.value)}
              style={selectStyle}
            >
              <option value="todos">Todos</option>
              <option value="CRITICO">Crítico</option>
              <option value="ALERTA">Alerta</option>
              <option value="OK">OK</option>
            </select>
          </label>
          <span style={{ fontSize: "11px", color: T.cinza400, alignSelf: "center" }}>
            {filteredAds.length} ads
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left", minWidth: 130 }}>Empreendimento</th>
                <th style={{ ...thStyle, textAlign: "left", minWidth: 160 }}>Campanha</th>
                <th style={{ ...thStyle, textAlign: "left", minWidth: 180 }}>Ad</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Gasto</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Leads</th>
                <th style={{ ...thStyle, textAlign: "right" }}>CPL</th>
                <th style={{ ...thStyle, textAlign: "right" }}>CTR</th>
                <th style={{ ...thStyle, textAlign: "right" }}>CPM</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Freq</th>
                <th style={{ ...thStyle, textAlign: "center", minWidth: 60 }}>Sev</th>
                <th style={{ ...thStyle, textAlign: "left", minWidth: 200 }}>Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => {
                const sev = SEV_COLORS[ad.severidade] || SEV_COLORS.OK;
                return (
                  <tr
                    key={ad.ad_id}
                    style={{ backgroundColor: ad.severidade === "CRITICO" ? "#FEF2F2" : ad.severidade === "ALERTA" ? "#FFFBEB" : "" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <td style={{ ...tdStyle, fontSize: "12px" }}>{ad.empreendimento}</td>
                    <td style={{ ...tdStyle, fontSize: "11px", color: T.cinza600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }} title={ad.campaign_name}>
                      {ad.campaign_name}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "12px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={ad.ad_name}>
                      {ad.ad_name}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontSize: "12px" }}>{formatBRL(ad.spend)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontSize: "12px", fontWeight: ad.leads > 0 ? 600 : 400 }}>{ad.leads > 0 ? ad.leads : "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontSize: "12px" }}>{ad.cpl > 0 ? formatBRL(ad.cpl) : "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontSize: "12px" }}>{pct(ad.ctr)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontSize: "12px" }}>{formatBRL(ad.cpm)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontSize: "12px" }}>{ad.frequency.toFixed(1)}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: sev.text,
                          backgroundColor: sev.bg,
                          padding: "2px 7px",
                          borderRadius: "9999px",
                          textTransform: "uppercase",
                        }}
                      >
                        {ad.severidade}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: "11px", color: T.cinza700, whiteSpace: "normal", lineHeight: 1.4 }}>
                      {ad.diagnostico || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

/* ---- Subcomponents ---- */

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "#FFF",
        border: "1px solid #E6E7EA",
        borderRadius: "12px",
        padding: "14px 20px",
        minWidth: "180px",
        flex: "1 1 180px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: "10px", fontWeight: 500, color: T.cinza600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: T.cinza400, marginTop: "2px" }}>{sub}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: "9px", color: T.cinza400, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label} </span>
      <span style={{ fontSize: "12px", fontWeight: 600, color: T.fg, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#FFF",
        border: "1px solid #E6E7EA",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        marginBottom: "16px",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #E6E7EA" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: T.fg }}>{title}</span>
      </div>
      <div style={{ padding: "0" }}>{children}</div>
    </div>
  );
}

/* ---- Styles ---- */

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: "10px",
  fontWeight: 500,
  color: "#6B6E84",
  borderBottom: "1px solid #E6E7EA",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  backgroundColor: "#F3F3F5",
};

const tdStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderBottom: "1px solid #E6E7EA",
  fontSize: "13px",
  fontWeight: 400,
  color: "#141A3C",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid #E6E7EA",
  fontSize: "12px",
  color: "#141A3C",
  backgroundColor: "#FFF",
  cursor: "pointer",
};
