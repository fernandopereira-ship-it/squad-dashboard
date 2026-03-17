"use client";

import { Bug, Sparkles, Calendar } from "lucide-react";
import { T } from "@/lib/constants";
import type { BacklogTask } from "@/lib/types";

interface TaskCardProps {
  task: BacklogTask;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = task.due_date ? new Date(task.due_date + "T12:00:00") : null;
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue < 3;

  let dueBg: string = T.cinza50;
  let dueFg: string = T.mutedFg;
  if (isOverdue) { dueBg = T.vermelho50; dueFg = T.destructive; }
  else if (isUrgent) { dueBg = "#FEF3C7"; dueFg = "#D97706"; }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onClick={onClick}
      style={{
        backgroundColor: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: "8px",
        padding: "12px",
        cursor: "grab",
        transition: "box-shadow 0.15s",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: "10px",
            fontWeight: 600,
            backgroundColor: task.type === "bug" ? T.vermelho50 : T.azul50,
            color: task.type === "bug" ? T.destructive : T.azul600,
          }}
        >
          {task.type === "bug" ? <Bug size={10} /> : <Sparkles size={10} />}
          {task.type === "bug" ? "Bug" : "Feature"}
        </span>
      </div>
      <div style={{ fontSize: "13px", fontWeight: 500, color: T.fg, marginBottom: "8px", lineHeight: 1.3 }}>
        {task.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        {task.assigned_name && (
          <span style={{ fontSize: "11px", color: T.mutedFg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
            {task.assigned_name}
          </span>
        )}
        {dueDate && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: dueBg,
              color: dueFg,
              marginLeft: "auto",
            }}
          >
            <Calendar size={9} />
            {dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
