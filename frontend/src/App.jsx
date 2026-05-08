import { useEffect, useState } from "react";
import "./index.css";

function App() {
  const initialMessages = [
    {
      role: "assistant",
      content:
        "Olá, eu sou o ScribeMind AI. Pergunte algo sobre os processos da empresa.",
      sources: [],
    },
  ];

  const [messages, setMessages] = useState(initialMessages);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setDocumentsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/documents/");
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }

  function clearChat() {
    setMessages(initialMessages);
    setQuestion("");
  }

  async function deleteDocument(documentId) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este documento?"
    );

    if (!confirmDelete) return;

    setDeletingDocumentId(documentId);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        alert("Erro ao excluir documento.");
        return;
      }

      await loadDocuments();
    } catch (error) {
      alert("Erro ao conectar com o backend.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function sendMessage() {
    if (!question.trim()) return;

    const userMessage = {
      role: "user",
      content: question,
      sources: [],
    };

    const currentQuestion = question;

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: data.detail || "Erro ao consultar o backend.",
            sources: [],
          },
        ]);
        return;
      }

      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Erro ao conectar com o backend. Verifique se a API FastAPI está rodando.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument() {
    if (!uploadTitle.trim() || !uploadFile) {
      setUploadMessage("Informe um título e selecione um arquivo .md, .txt ou .pdf.");
      return;
    }

    const formData = new FormData();
    formData.append("title", uploadTitle);
    formData.append("file", uploadFile);

    setUploading(true);
    setUploadMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadMessage(data.detail || "Erro ao enviar documento.");
        return;
      }

      setUploadMessage(
        `Documento indexado com sucesso. Chunks criados: ${data.chunks_created}`
      );

      setUploadTitle("");
      setUploadFile(null);

      await loadDocuments();
    } catch (error) {
      setUploadMessage("Erro ao conectar com o backend.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-cyan-400">ScribeMind AI</p>
            <h1 className="mt-1 text-2xl font-bold">
              Knowledge Engine Corporativo
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Consulte processos internos com respostas baseadas em documentos
              oficiais.
            </p>
          </header>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm font-semibold text-slate-100">
              Enviar documento
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Envie arquivos .md, .txt ou .pdf para indexar no motor de conhecimento.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder="Título do documento"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <input
                type="file"
                accept=".md,.txt,.pdf"
                onChange={(event) => {
                  setUploadFile(event.target.files?.[0] || null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-cyan-400"
              />

              <button
                onClick={uploadDocument}
                disabled={uploading}
                className="w-full rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Enviando..." : "Indexar documento"}
              </button>

              {uploadMessage && (
                <p className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
                  {uploadMessage}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Documentos indexados
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Arquivos disponíveis para consulta.
                </p>
              </div>

              <button
                onClick={loadDocuments}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
              >
                Atualizar
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {documentsLoading && (
                <p className="text-xs text-slate-400">
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
                  <div
                    key={document.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
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

                      <button
                        onClick={() => deleteDocument(document.id)}
                        disabled={deletingDocumentId === document.id}
                        className="shrink-0 rounded-lg border border-red-900/70 px-3 py-2 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingDocumentId === document.id
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </aside>

        <section className="flex min-h-[720px] flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Chat com documentos
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Faça uma pergunta e veja a fonte usada na resposta.
              </p>
            </div>

            <button
              onClick={clearChat}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
            >
              Limpar chat
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.sources.length > 0 && (
                    <div className="mt-3 border-t border-slate-700 pt-3">
                      <p className="mb-2 text-xs font-semibold text-slate-400">
                        Fontes encontradas:
                      </p>

                      <div className="space-y-2">
                        {message.sources.map((source, sourceIndex) => (
                          <div
                            key={sourceIndex}
                            className="rounded-xl bg-slate-900 p-3 text-xs text-slate-300"
                          >
                            <p className="font-medium text-slate-100">
                              {source.section_title || "Documento sem título"}
                            </p>

                            {source.source_url && (
                              <a
                                href={source.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 block text-cyan-400 underline"
                              >
                                Abrir fonte
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
                  Consultando documentos...
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;