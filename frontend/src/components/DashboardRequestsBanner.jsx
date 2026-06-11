import { useEffect, useState } from "react";
import { apiJson, apiFetch } from "../lib/api";

export function DashboardRequestsBanner() {
  const [requests, setRequests] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);

  async function load() {
    try {
      const data = await apiJson("/access-requests/");
      setRequests(data.requests || []);
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(requestId, action) {
    setResolvingId(requestId);
    try {
      const response = await apiFetch(`/access-requests/${requestId}/${action}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Erro ao processar o pedido.");
        return;
      }
      await load();
    } catch {
      alert("Erro ao conectar com o backend.");
    } finally {
      setResolvingId(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <section
      aria-label="Solicitações de acesso ao dashboard"
      className="border-b border-amber-900/50 bg-amber-950/30 px-4 py-3"
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-xs font-semibold text-amber-300">
          {requests.length} solicitação(ões) de acesso ao Dashboard pendente(s)
        </p>
        <ul className="space-y-2">
          {requests.map((req) => (
            <li
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-900/40 bg-slate-950 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-100">
                  {req.full_name || req.email || "Usuário"}
                </p>
                <p className="truncate text-[11px] text-slate-500">{req.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resolve(req.id, "approve")}
                  disabled={resolvingId === req.id}
                  className="rounded-lg border border-emerald-700 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-600 hover:text-slate-950 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => resolve(req.id, "deny")}
                  disabled={resolvingId === req.id}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
