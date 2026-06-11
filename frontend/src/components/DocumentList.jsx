import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentList({
  documents,
  documentsLoading,
  deletingDocumentId,
  reprocessingId,
  selectedDocument,
  isAdmin,
  onRefresh,
  onDelete,
  onReprocess,
  onViewImages,
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const types = useMemo(() => {
    const set = new Set(documents.map((d) => d.source_type).filter(Boolean));
    return ["all", ...set];
  }, [documents]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesTerm = !term || (d.title || "").toLowerCase().includes(term);
      const matchesType = typeFilter === "all" || d.source_type === typeFilter;
      return matchesTerm && matchesType;
    });
  }, [documents, search, typeFilter]);

  return (
    <section
      aria-labelledby="docs-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p id="docs-heading" className="text-sm font-semibold text-slate-100">
            Biblioteca de documentos
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {documents.length} documento(s) indexado(s).
          </p>
        </div>
        <button
          onClick={onRefresh}
          aria-label="Atualizar lista de documentos"
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Atualizar
        </button>
      </div>

      {/* Busca + filtro */}
      <div className="mt-4 space-y-2">
        <label htmlFor="doc-search" className="sr-only">
          Buscar documento por título
        </label>
        <input
          id="doc-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400"
        />

        {types.length > 2 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por tipo">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                aria-pressed={typeFilter === type}
                className={`rounded-lg border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  typeFilter === type
                    ? "border-cyan-400 text-cyan-400"
                    : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
                }`}
              >
                {type === "all" ? "Todos" : type}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="mt-4 space-y-2"
        role="list"
        aria-label="Documentos"
        aria-busy={documentsLoading}
      >
        {documentsLoading && (
          <p role="status" aria-live="polite" className="text-xs text-slate-400">
            Carregando documentos...
          </p>
        )}

        {!documentsLoading && filtered.length === 0 && (
          <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            {documents.length === 0
              ? "Nenhum documento indexado ainda."
              : "Nenhum documento corresponde à busca."}
          </p>
        )}

        {!documentsLoading &&
          filtered.map((document) => (
            <article
              key={document.id}
              role="listitem"
              aria-label={`Documento: ${document.title}`}
              className={`rounded-xl border p-3 ${
                selectedDocument?.id === document.id
                  ? "border-cyan-500 bg-slate-950"
                  : "border-slate-800 bg-slate-950"
              }`}
            >
              <div className="space-y-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {document.title}
                  </p>

                  {/* Metadados */}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {document.source_type || "—"}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {document.chunk_count ?? 0} chunks
                    </span>
                    {document.image_count > 0 && (
                      <span className="rounded-full bg-purple-900/40 px-2 py-0.5 text-[10px] text-purple-300">
                        {document.image_count} imagens
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {formatDate(document.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onViewImages(document)}
                    aria-label={`Ver imagens do documento "${document.title}"`}
                    aria-pressed={selectedDocument?.id === document.id}
                    className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    Ver imagens
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => onReprocess(document.id)}
                      disabled={reprocessingId === document.id}
                      aria-label={`Reprocessar documento "${document.title}"`}
                      aria-busy={reprocessingId === document.id}
                      title="Re-gerar embeddings e descrições de imagem"
                      className="rounded-lg border border-amber-900/70 px-3 py-2 text-xs text-amber-300 transition hover:border-amber-400 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      {reprocessingId === document.id ? "Reprocessando..." : "Reprocessar"}
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => onDelete(document.id)}
                      disabled={deletingDocumentId === document.id}
                      aria-label={`Excluir documento "${document.title}"`}
                      aria-busy={deletingDocumentId === document.id}
                      className="rounded-lg border border-red-900/70 px-3 py-2 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      {deletingDocumentId === document.id ? "Excluindo..." : "Excluir"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
