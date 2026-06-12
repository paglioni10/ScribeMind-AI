import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

const ACTION_LABEL = {
  "document.upload": "Documento enviado",
  "document.delete": "Documento excluído",
  "document.reprocess": "Documento reprocessado",
  "member.role_changed": "Papel alterado",
  "member.removed": "Membro removido",
  "access_request.created": "Solicitou acesso ao dashboard",
  "access_request.approved": "Acesso ao dashboard aprovado",
  "access_request.denied": "Acesso ao dashboard recusado",
};

const ACTION_COLOR = {
  document: "bg-cyan-900/40 text-cyan-300",
  member: "bg-purple-900/40 text-purple-300",
  access_request: "bg-amber-900/60 text-amber-300",
};

function categoryOf(action) {
  return action.split(".")[0] === "access" ? "access_request" : action.split(".")[0];
}

function detailOf(log) {
  const m = log.metadata || {};
  switch (log.action) {
    case "document.upload":
    case "document.delete":
      return m.title || "—";
    case "document.reprocess":
      return `${m.images_reprocessed ?? 0} imagens · ${m.text_chunks_reembedded ?? 0} chunks`;
    case "member.role_changed":
      return `${m.from} → ${m.to}`;
    case "member.removed":
      return `papel: ${m.role || "—"}`;
    default:
      return "";
  }
}

export function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiJson("/audit/");
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section
      aria-labelledby="audit-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p id="audit-heading" className="text-sm font-semibold text-slate-100">
            Histórico de auditoria
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Registro de ações sensíveis: quem fez o quê e quando.
          </p>
        </div>
        <button
          onClick={load}
          aria-label="Atualizar histórico de auditoria"
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Atualizar
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2" aria-busy={loading}>
        {loading && (
          <li role="status" aria-live="polite" className="text-xs text-slate-400">
            Carregando histórico...
          </li>
        )}

        {!loading && logs.length === 0 && (
          <li className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            Nenhuma ação registrada ainda.
          </li>
        )}

        {!loading &&
          logs.map((log) => {
            const detail = detailOf(log);
            return (
              <li
                key={log.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    ACTION_COLOR[categoryOf(log.action)] || "bg-slate-800 text-slate-300"
                  }`}
                >
                  {ACTION_LABEL[log.action] || log.action}
                </span>

                <span className="min-w-0 flex-1 truncate text-xs text-slate-200">
                  {log.actor_name || log.actor_email || "Usuário removido"}
                  {detail && (
                    <span className="text-slate-400"> · {detail}</span>
                  )}
                </span>

                <span className="shrink-0 text-[11px] text-slate-500">
                  {new Date(log.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
