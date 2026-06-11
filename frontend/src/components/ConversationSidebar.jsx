export function ConversationSidebar({
  conversations,
  loading,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <section
      aria-labelledby="conversations-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <p id="conversations-heading" className="text-sm font-semibold text-slate-100">
          Conversas
        </p>
        <button
          onClick={onNew}
          aria-label="Iniciar nova conversa"
          className="rounded-lg border border-cyan-500 px-3 py-2 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          + Nova
        </button>
      </div>

      <ul
        className="mt-4 space-y-2"
        role="list"
        aria-label="Histórico de conversas"
        aria-busy={loading}
      >
        {loading && (
          <li className="text-xs text-slate-400" role="status" aria-live="polite">
            Carregando conversas...
          </li>
        )}

        {!loading && conversations.length === 0 && (
          <li className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            Nenhuma conversa ainda. Faça uma pergunta para começar.
          </li>
        )}

        {!loading &&
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <li
                key={conversation.id}
                className={`flex items-center gap-2 rounded-xl border p-2 ${
                  isActive
                    ? "border-cyan-500 bg-slate-950"
                    : "border-slate-800 bg-slate-950"
                }`}
              >
                <button
                  onClick={() => onSelect(conversation.id)}
                  aria-current={isActive ? "true" : undefined}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <p className="truncate text-sm text-slate-100">
                    {conversation.title || "Conversa sem título"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(conversation.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>

                <button
                  onClick={() => onDelete(conversation.id)}
                  aria-label={`Excluir conversa "${conversation.title || "sem título"}"`}
                  className="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 transition hover:border-red-400 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  ✕
                </button>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
