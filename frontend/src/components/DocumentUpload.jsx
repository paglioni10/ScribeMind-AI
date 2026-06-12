export function DocumentUpload({
  uploadTitle,
  setUploadTitle,
  uploadFile,
  setUploadFile,
  uploading,
  uploadMessage,
  onUpload,
}) {
  function handleKeyDown(event) {
    if (event.key === "Enter") onUpload();
  }

  return (
    <section
      aria-labelledby="upload-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <p id="upload-heading" className="text-sm font-semibold text-slate-100">
        Enviar documento
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Envie arquivos .md, .txt ou .pdf (até 10 MB) para indexar no motor de
        conhecimento.
      </p>

      <div className="mt-4 space-y-3">
        <label htmlFor="doc-title" className="sr-only">
          Título do documento
        </label>
        <input
          id="doc-title"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Título do documento"
          aria-required="true"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400"
        />

        <label htmlFor="doc-file" className="sr-only">
          Arquivo do documento (.md, .txt ou .pdf)
        </label>
        <input
          id="doc-file"
          type="file"
          accept=".md,.txt,.pdf"
          aria-describedby="doc-file-hint"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        />
        <p id="doc-file-hint" className="sr-only">
          Formatos aceitos: .md, .txt ou .pdf
        </p>

        <button
          onClick={onUpload}
          disabled={uploading}
          aria-busy={uploading}
          aria-describedby={uploadMessage ? "upload-status" : undefined}
          className="w-full rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {uploading ? "Enviando..." : "Indexar documento"}
        </button>

        {uploadMessage && (
          <p
            id="upload-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300"
          >
            {uploadMessage}
          </p>
        )}
      </div>
    </section>
  );
}
