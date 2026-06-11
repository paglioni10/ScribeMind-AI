import { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

function MetricCard({ label, value, hint, accent = "text-cyan-400" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function QuestionsChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
      <p className="text-sm font-semibold text-slate-100">Perguntas nos últimos 7 dias</p>
      <div
        className="mt-4 flex h-40 items-end gap-2"
        role="img"
        aria-label={`Gráfico de perguntas por dia: ${data
          .map((d) => `${d.date} com ${d.count}`)
          .join(", ")}`}
      >
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-cyan-500/80"
                style={{ height: `${(d.count / max) * 100}%` }}
                title={`${d.count} pergunta(s)`}
              />
            </div>
            <span className="text-[10px] text-slate-500">
              {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
            </span>
            <span className="text-[10px] font-semibold text-slate-300">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [unanswered, setUnanswered] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [m, u, g] = await Promise.all([
        apiJson("/analytics/metrics"),
        apiJson("/analytics/unanswered"),
        apiJson("/analytics/gaps"),
      ]);
      setMetrics(m);
      setUnanswered(u.unanswered || []);
      setGaps(g.gaps || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="p-8 text-center text-slate-400">
        Carregando métricas...
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="p-8 text-center text-red-300">
        {error}
      </div>
    );
  }

  const maxGap = Math.max(1, ...gaps.map((g) => g.count));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            Inteligência operacional
          </h2>
          <p className="text-sm text-slate-400">
            Métricas de uso e lacunas na base de conhecimento.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Atualizar
        </button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Perguntas feitas"
          value={metrics.total_questions}
          hint={`${metrics.total_conversations} conversa(s)`}
        />
        <MetricCard
          label="Taxa de resposta"
          value={`${metrics.answer_rate}%`}
          hint={`${metrics.answered} respondidas`}
          accent="text-emerald-400"
        />
        <MetricCard
          label="Sem resposta"
          value={metrics.unanswered}
          hint="oportunidades de melhoria"
          accent="text-amber-400"
        />
        <MetricCard
          label="Base de conhecimento"
          value={metrics.total_documents}
          hint={`${metrics.total_chunks} chunks · ${metrics.total_images} imagens`}
        />
      </div>

      <QuestionsChart data={metrics.questions_per_day} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Perguntas sem resposta */}
        <section
          aria-labelledby="unanswered-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
        >
          <p id="unanswered-heading" className="text-sm font-semibold text-slate-100">
            Perguntas sem resposta
          </p>
          <p className="mt-1 text-xs text-slate-400">
            O que os usuários perguntaram e o assistente não soube responder.
          </p>

          <ul className="mt-4 space-y-2">
            {unanswered.length === 0 && (
              <li className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                Nenhuma pergunta sem resposta registrada. 🎉
              </li>
            )}
            {unanswered.map((item, index) => (
              <li
                key={index}
                className="rounded-xl border border-amber-900/40 bg-slate-950 p-3"
              >
                <p className="text-sm text-slate-200">{item.question}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("pt-BR")
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Lacunas na base */}
        <section
          aria-labelledby="gaps-heading"
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
        >
          <p id="gaps-heading" className="text-sm font-semibold text-slate-100">
            Lacunas na base de conhecimento
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Termos mais frequentes nas perguntas sem resposta — temas que faltam documentar.
          </p>

          <ul className="mt-4 space-y-2">
            {gaps.length === 0 && (
              <li className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                Sem lacunas identificadas ainda.
              </li>
            )}
            {gaps.map((gap) => (
              <li key={gap.term} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs text-slate-300">
                  {gap.term}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-slate-950">
                  <div
                    className="h-full rounded bg-amber-500/70"
                    style={{ width: `${(gap.count / maxGap) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-400">
                  {gap.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
