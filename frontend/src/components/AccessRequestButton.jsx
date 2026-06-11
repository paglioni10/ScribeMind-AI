import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

export function AccessRequestButton() {
  const [status, setStatus] = useState(null); // null | pending | approved | denied
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiJson("/access-requests/mine")
      .then((data) => {
        if (data.request) setStatus(data.request.status);
      })
      .catch(() => {});
  }, []);

  async function request() {
    setLoading(true);
    try {
      const data = await apiJson("/access-requests/", { method: "POST" });
      setStatus(data.request?.status || "pending");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "pending") {
    return (
      <span
        role="status"
        className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-300"
      >
        Pedido de acesso enviado
      </span>
    );
  }

  return (
    <button
      onClick={request}
      disabled={loading}
      className="rounded-lg border border-cyan-500 px-3 py-1 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      {loading ? "Enviando..." : "Solicitar acesso ao Dashboard"}
    </button>
  );
}
