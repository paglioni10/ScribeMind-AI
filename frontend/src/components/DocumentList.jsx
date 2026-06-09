export function DocumentList({
  documents,
  documentsLoading,
  deletingDocumentId,
  selectedDocument,
  onRefresh,
  onDelete,
  onViewImages,
}) {
  return (
    <section
      aria-labelledby="docs-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p id="docs-heading" className="text-sm font-semibold text-slate-100">
            Documentos indexados
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Arquivos disponíveis para consulta.
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

      <div
        className="mt-4 space-y-2"
        role="list"
        aria-label="Lista de documentos indexados"
        aria-busy={documentsLoading}
      >
        {documentsLoading && (
          <p role="status" aria-live="polite" className="text-xs text-slate-400">
            Carregando documentos...
          </p>
        )}

        {!documentsLoading && documents.length === 0 && (
          <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            Nenhum documento indexado ainda.
          </p>
        )}

        {!documentsLoading &&
          documents.map((document) => (
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
                  <p className="mt-1 text-xs text-slate-500">
                    Tipo: {document.source_type || "não informado"}
                  </p>
                  {document.source_url && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      Fonte: {document.source_url}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewImages(document)}
                    aria-label={`Ver imagens do documento "${document.title}"`}
                    aria-pressed={selectedDocument?.id === document.id}
                    className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    Ver imagens
                  </button>

                  <button
                    onClick={() => onDelete(document.id)}
                    disabled={deletingDocumentId === document.id}
                    aria-label={`Excluir documento "${document.title}"`}
                    aria-busy={deletingDocumentId === document.id}
                    className="rounded-lg border border-red-900/70 px-3 py-2 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    {deletingDocumentId === document.id
                      ? "Excluindo..."
                      : "Excluir"}
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
