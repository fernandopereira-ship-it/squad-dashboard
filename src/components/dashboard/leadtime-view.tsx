"use client";

import { T, SQUAD_COLORS } from "@/lib/constants";
import type { LeadtimeData, LeadtimeStageRow } from "@/lib/types";

interface Props {
  data: LeadtimeData | null;
  loading: boolean;
  daysBack: number;
  onDaysChange: (days: number) => void;
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

const PERIOD_OPTIONS = [
  { label: "30d", value: 30 },
  { label: "60d", value: 60 },
  { label: "90d", value: 90 },
  { label: "180d", value: 180 },
  { label: "12m", value: 365 },
];

const cardStyle = (accent?: string): React.CSSProperties => ({
  backgroundColor: "#FFF",
  border: `1px solid ${accent ? accent + "33" : T.border}`,
  borderRadius: "12px",
  padding: "16px 20px",
  flex: "1 1 0",
  minWidth: "140px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
});

const thStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: T.cinza600,
  textTransform: "uppercase",
  padding: "8px 10px",
  textAlign: "left",
  borderBottom: `1px solid ${T.border}`,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  fontSize: "13px",
  color: T.fg,
  padding: "8px 10px",
  borderBottom: `1px solid ${T.cinza100}`,
  fontVariantNumeric: "tabular-nums",
};

function daysColor(val: number, avg: number): string {
  if (avg === 0) return T.fg;
  if (val <= avg * 0.8) return "#15803D";
  if (val >= avg * 1.2) return "#E7000B";
  return T.fg;
}

export function LeadtimeView({ data, loading, daysBack, onDaysChange }: Props) {
  if (loading && !data) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: T.mutedFg }}>
        <p style={{ fontSize: "14px" }}>Carregando leadtime...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: T.mutedFg }}>
        <p style={{ fontSize: "14px" }}>Sem dados de leadtime</p>
      </div>
    );
  }

  const stagesWithData = data.stages.filter((s) => s.wonDeals > 0 || s.openDeals > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header + Period Filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: T.fg, margin: 0 }}>
          Leadtime do Funil
        </h2>
        <div style={{ display: "flex", gap: "2px", backgroundColor: T.cinza50, borderRadius: "9999px", padding: "3px", border: `1px solid ${T.border}` }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDaysChange(opt.value)}
              style={{
                padding: "4px 12px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 500,
                transition: "all 0.15s",
                letterSpacing: "0.02em",
                backgroundColor: daysBack === opt.value ? T.azul600 : "transparent",
                color: daysBack === opt.value ? "#FFF" : T.cinza600,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ ...cardStyle(), backgroundColor: T.fg, border: "none" }}>
          <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "4px" }}>Leadtime Medio</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#FFF" }}>{fmt(data.avgCycleDays)}d</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>Criacao a Venda</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: "11px", fontWeight: 500, color: T.cinza600, textTransform: "uppercase", marginBottom: "4px" }}>Mediana</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: T.azul600 }}>{fmt(data.medianCycleDays)}d</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: "11px", fontWeight: 500, color: T.cinza600, textTransform: "uppercase", marginBottom: "4px" }}>P90</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#92400E" }}>{fmt(data.p90CycleDays)}d</div>
        </div>
        <div style={cardStyle("#5EA500")}>
          <div style={{ fontSize: "11px", fontWeight: 500, color: T.cinza600, textTransform: "uppercase", marginBottom: "4px" }}>Deals Ganhos</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#15803D" }}>{data.totalWonDeals}</div>
        </div>
        <div style={cardStyle("#0055FF")}>
          <div style={{ fontSize: "11px", fontWeight: 500, color: T.cinza600, textTransform: "uppercase", marginBottom: "4px" }}>Deals Abertos</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: T.azul600 }}>{data.totalOpenDeals}</div>
        </div>
      </div>

      {/* Leadtime por Etapa */}
      <div style={{ backgroundColor: "#FFF", border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: T.cinza600, textTransform: "uppercase", marginBottom: "4px" }}>Leadtime por Etapa</div>
        <div style={{ fontSize: "11px", color: T.cinza600, marginBottom: "12px" }}>Tempo estimado por etapa (deals ganhos) + lead aberto mais antigo</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Etapa</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ordem</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Media (dias)</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Mediana</th>
                <th style={{ ...thStyle, textAlign: "right" }}>P90</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Deals Ganhos</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Abertos</th>
                <th style={thStyle}>Lead + Antigo</th>
              </tr>
            </thead>
            <tbody>
              {stagesWithData.map((s) => (
                <StageRow key={s.stageOrder} stage={s} globalAvg={data.avgCycleDays} />
              ))}
              <tr style={{ backgroundColor: T.cinza50 }}>
                <td style={{ ...tdStyle, fontWeight: 700 }} colSpan={2}>Total</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{fmt(data.avgCycleDays)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{fmt(data.medianCycleDays)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{fmt(data.p90CycleDays)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{data.totalWonDeals}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{data.totalOpenDeals}</td>
                <td style={tdStyle} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Leadtime por Closer */}
      <div style={{ backgroundColor: "#FFF", border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: T.cinza600, textTransform: "uppercase", marginBottom: "12px" }}>Leadtime por Closer</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Closer</th>
                <th style={thStyle}>Squad</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Media (dias)</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Mediana</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Deals Ganhos</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Abertos</th>
              </tr>
            </thead>
            <tbody>
              {data.byCloser.map((c) => {
                const sqColor = SQUAD_COLORS[c.squadId] || T.cinza600;
                return (
                  <tr key={c.name}>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: sqColor, display: "inline-block" }} />
                        {c.name}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: T.cinza600 }}>{c.squadId}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: daysColor(c.avgCycleDays, data.avgCycleDays) }}>
                      {c.wonDeals > 0 ? fmt(c.avgCycleDays) : "-"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {c.wonDeals > 0 ? fmt(c.medianCycleDays) : "-"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{c.wonDeals}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{c.openDeals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StageRow({ stage, globalAvg }: { stage: LeadtimeStageRow; globalAvg: number }) {
  const stageAvg = globalAvg / 14; // rough per-stage average for color coding
  return (
    <tr>
      <td style={tdStyle}>{stage.stageName}</td>
      <td style={{ ...tdStyle, textAlign: "right", color: T.cinza600 }}>{stage.stageOrder}</td>
      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: daysColor(stage.avgDays, stageAvg) }}>
        {stage.wonDeals > 0 ? fmt(stage.avgDays) : "-"}
      </td>
      <td style={{ ...tdStyle, textAlign: "right" }}>
        {stage.wonDeals > 0 ? fmt(stage.medianDays) : "-"}
      </td>
      <td style={{ ...tdStyle, textAlign: "right" }}>
        {stage.wonDeals > 0 ? fmt(stage.p90Days) : "-"}
      </td>
      <td style={{ ...tdStyle, textAlign: "right" }}>{stage.wonDeals || "-"}</td>
      <td style={{ ...tdStyle, textAlign: "right" }}>{stage.openDeals || "-"}</td>
      <td style={tdStyle}>
        {stage.oldestOpen ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <a
              href={stage.oldestOpen.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: T.azul600, textDecoration: "none", fontWeight: 500 }}
              title={stage.oldestOpen.title}
            >
              {stage.oldestOpen.title.length > 30 ? stage.oldestOpen.title.substring(0, 30) + "..." : stage.oldestOpen.title}
            </a>
            <span style={{ color: T.cinza600 }}>({stage.oldestOpen.owner_name})</span>
            <span style={{
              padding: "1px 6px",
              borderRadius: "9999px",
              fontSize: "10px",
              fontWeight: 600,
              backgroundColor: stage.oldestOpen.ageDays >= 90 ? "#fee2e2" : stage.oldestOpen.ageDays >= 30 ? "#fef3c7" : "#f0fdf4",
              color: stage.oldestOpen.ageDays >= 90 ? "#E7000B" : stage.oldestOpen.ageDays >= 30 ? "#92400E" : "#15803D",
            }}>
              {stage.oldestOpen.ageDays}d
            </span>
          </span>
        ) : (
          <span style={{ color: T.cinza400 }}>-</span>
        )}
      </td>
    </tr>
  );
}
