"use client";

import { useState } from "react";
import { T, SQUAD_COLORS, MQL_INTENCOES, MQL_FAIXAS, MQL_PAGAMENTOS } from "@/lib/constants";
import type { RegrasMqlData, RegrasMqlEmp } from "@/lib/types";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  data: RegrasMqlData | null;
  loading: boolean;
}

function aberturaColor(pct: number): string {
  if (pct > 70) return T.verde600;
  if (pct >= 40) return T.laranja500;
  return T.destructive;
}

function aberturaColorBg(pct: number): string {
  if (pct > 70) return T.verde50;
  if (pct >= 40) return "#FFF7ED";
  return T.vermelho50;
}

function MiniBar({ filled, total, pct }: { filled: number; total: number; pct: number }) {
  const color = aberturaColor(pct);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div
        style={{
          width: "36px",
          height: "6px",
          borderRadius: "3px",
          backgroundColor: `${color}20`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "3px",
            backgroundColor: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "10px", fontWeight: 500, color: T.cinza600, fontVariantNumeric: "tabular-nums" }}>
        {filled}/{total}
      </span>
    </div>
  );
}

function AberturaBar({ pct }: { pct: number }) {
  const color = aberturaColor(pct);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "60px",
          height: "8px",
          borderRadius: "4px",
          backgroundColor: `${color}20`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "4px",
            backgroundColor: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </div>
  );
}

function OptionDots({
  selected,
  allOptions,
}: {
  selected: string[];
  allOptions: ReadonlyArray<{ value: string; label: string }>;
}) {
  const selectedSet = new Set(selected);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
      {allOptions.map((opt) => {
        const active = selectedSet.has(opt.value);
        return (
          <div key={opt.value} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: active ? T.verde600 : T.cinza200,
                border: active ? "none" : `1px solid ${T.cinza300}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "11px",
                color: active ? T.fg : T.cinza400,
                fontWeight: active ? 500 : 400,
              }}
            >
              {opt.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmpRow({ emp }: { emp: RegrasMqlEmp }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer", transition: "background 0.1s" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.cinza50)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <td
          style={{
            padding: "8px 10px",
            borderBottom: `1px solid ${T.border}`,
            fontSize: "13px",
            fontWeight: 500,
            color: T.fg,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {expanded ? <ChevronDown size={12} color={T.cinza600} /> : <ChevronRight size={12} color={T.cinza600} />}
            {emp.nome}
          </div>
        </td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>
          <MiniBar filled={emp.intencoes.length} total={MQL_INTENCOES.length} pct={emp.aberturaIntencoes} />
        </td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>
          <MiniBar filled={emp.faixas.length} total={MQL_FAIXAS.length} pct={emp.aberturaFaixas} />
        </td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>
          <MiniBar filled={emp.pagamentos.length} total={MQL_PAGAMENTOS.length} pct={emp.aberturaPagamentos} />
        </td>
        <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
          <AberturaBar pct={emp.aberturaGeral} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: "12px 16px 16px 34px",
              borderBottom: `1px solid ${T.border}`,
              backgroundColor: T.cinza50,
            }}
          >
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: T.cinza600, textTransform: "uppercase", marginBottom: "6px" }}>
                  Intenções
                </div>
                <OptionDots selected={emp.intencoes} allOptions={MQL_INTENCOES} />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: T.cinza600, textTransform: "uppercase", marginBottom: "6px" }}>
                  Faixas de Investimento
                </div>
                <OptionDots selected={emp.faixas} allOptions={MQL_FAIXAS} />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: T.cinza600, textTransform: "uppercase", marginBottom: "6px" }}>
                  Pagamentos
                </div>
                <OptionDots selected={emp.pagamentos} allOptions={MQL_PAGAMENTOS} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function BalanceamentoView({ data, loading }: Props) {
  if (loading && !data) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: T.cinza600 }}>
        <p style={{ fontSize: "14px" }}>Carregando regras MQL...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Coluna principal — Regras MQL */}
      <div style={{ flex: 3 }}>
        {data.squads.map((sq) => (
          <div
            key={sq.id}
            style={{
              backgroundColor: T.card,
              borderRadius: "12px",
              border: `1px solid ${T.border}`,
              marginBottom: "16px",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header do squad */}
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${T.border}`,
                backgroundColor: T.cinza50,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: SQUAD_COLORS[sq.id] || T.cinza400,
                  }}
                />
                <span style={{ fontSize: "14px", fontWeight: 600, color: T.fg }}>{sq.name}</span>
                <span style={{ fontSize: "11px", color: T.cinza600 }}>
                  {sq.empreendimentos.length} empreendimento{sq.empreendimentos.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: T.cinza600, textTransform: "uppercase" }}>
                  Abertura média
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: aberturaColor(sq.aberturaMedia),
                    backgroundColor: aberturaColorBg(sq.aberturaMedia),
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {sq.aberturaMedia}%
                </span>
              </div>
            </div>

            {/* Tabela */}
            {sq.empreendimentos.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 10px",
                        fontSize: "9px",
                        fontWeight: 500,
                        color: T.cinza600,
                        borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Empreendimento
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "6px 10px",
                        fontSize: "9px",
                        fontWeight: 500,
                        color: T.cinza600,
                        borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Intenções
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "6px 10px",
                        fontSize: "9px",
                        fontWeight: 500,
                        color: T.cinza600,
                        borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Faixas
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "6px 10px",
                        fontSize: "9px",
                        fontWeight: 500,
                        color: T.cinza600,
                        borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Pagamentos
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 10px",
                        fontSize: "9px",
                        fontWeight: 500,
                        color: T.cinza600,
                        borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Abertura
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sq.empreendimentos.map((emp) => (
                    <EmpRow key={emp.nome} emp={emp} />
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: T.cinza600, fontSize: "13px" }}>
                Nenhum empreendimento ativo
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Coluna direita — Ociosidade (futuro) */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div
          style={{
            backgroundColor: T.card,
            borderRadius: "12px",
            border: `1px dashed ${T.cinza200}`,
            padding: "40px 20px",
            textAlign: "center",
            position: "sticky",
            top: "80px",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>&#9202;</div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, color: T.cinza600, margin: "0 0 6px" }}>Ociosidade</h4>
          <p style={{ fontSize: "12px", color: T.cinza400, margin: 0, lineHeight: 1.4 }}>
            Taxa de ociosidade dos closers por squad — em breve
          </p>
        </div>
      </div>
    </div>
  );
}
