import { useEffect, useState } from "react";
import "./index.css";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AccessibilityBar } from "./components/AccessibilityBar";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentUpload } from "./components/DocumentUpload";
import { DocumentList } from "./components/DocumentList";
import { ImageGallery } from "./components/ImageGallery";
import { MembersPanel } from "./components/MembersPanel";
import { VLibras } from "./components/VLibras";
import { AuthScreen } from "./components/auth/AuthScreen";
import { apiFetch } from "./lib/api";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Olá, eu sou o ScribeMind AI. Pergunte algo sobre os processos da empresa.",
    sources: [],
  },
];

function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-cyan-400">ScribeMind AI</span>
        {user?.organization?.name && (
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {user.organization.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-medium text-slate-200">
            {user?.full_name || user?.email}
          </p>
          <p className="text-[11px] text-slate-500">
            {user?.role === "owner"
              ? "Owner"
              : user?.role === "admin"
              ? "Admin"
              : "Membro"}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-red-400 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Sair
        </button>
      </div>
    </header>
  );
}

function AppContent() {
  const { isAdmin } = useAuth();

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentImages, setDocumentImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const [vlibrasEnabled, setVlibrasEnabled] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setDocumentsLoading(true);
    try {
      const response = await apiFetch("/documents/");
      const data = await response.json();
      if (response.ok) setDocuments(data.documents || []);
    } catch {
      // estado vazio comunica a falha
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function deleteDocument(documentId) {
    if (!window.confirm("Tem certeza que deseja excluir este documento?")) return;

    setDeletingDocumentId(documentId);
    try {
      const response = await apiFetch(`/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Erro ao excluir documento.");
        return;
      }
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setDocumentImages([]);
      }
      await loadDocuments();
    } catch {
      alert("Erro ao conectar com o backend.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function loadDocumentImages(document) {
    setSelectedDocument(document);
    setImagesLoading(true);
    setDocumentImages([]);
    try {
      const response = await apiFetch(`/documents/${document.id}/images`);
      const data = await response.json();
      if (!response.ok) {
        alert("Erro ao carregar imagens do documento.");
        return;
      }
      setDocumentImages(data.images || []);
    } catch {
      alert("Erro ao conectar com o backend.");
    } finally {
      setImagesLoading(false);
    }
  }

  async function sendMessage() {
    if (!question.trim()) return;

    const currentQuestion = question;
    setMessages((m) => [
      ...m,
      { role: "user", content: currentQuestion, sources: [] },
    ]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await apiFetch("/chat/", {
        method: "POST",
        body: { question: currentQuestion },
      });
      const data = await response.json();
      if (!response.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.detail || "Erro ao consultar o backend.",
            sources: [],
          },
        ]);
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, sources: data.sources || [] },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Erro ao conectar com o backend. Verifique se a API está rodando.",
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
      const response = await apiFetch("/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadMessage(data.detail || "Erro ao enviar documento.");
        return;
      }
      setUploadMessage(
        `Documento indexado. Chunks: ${data.chunks_created}. Imagens: ${data.images_extracted || 0}.`
      );
      setUploadTitle("");
      setUploadFile(null);
      await loadDocuments();
    } catch {
      setUploadMessage("Erro ao conectar com o backend.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <a
        href="#main-chat"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg focus-visible:outline-none"
      >
        Pular para o chat
      </a>

      <TopBar />

      <AccessibilityBar
        vlibrasEnabled={vlibrasEnabled}
        onToggleVlibras={() => setVlibrasEnabled((v) => !v)}
      />

      <VLibras enabled={vlibrasEnabled} />

      <main
        className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[380px_1fr]"
        role="main"
      >
        <aside aria-label="Painel de gerenciamento" className="space-y-4">
          <DocumentUpload
            uploadTitle={uploadTitle}
            setUploadTitle={setUploadTitle}
            uploadFile={uploadFile}
            setUploadFile={setUploadFile}
            uploading={uploading}
            uploadMessage={uploadMessage}
            onUpload={uploadDocument}
          />

          <DocumentList
            documents={documents}
            documentsLoading={documentsLoading}
            deletingDocumentId={deletingDocumentId}
            selectedDocument={selectedDocument}
            onRefresh={loadDocuments}
            onDelete={deleteDocument}
            onViewImages={loadDocumentImages}
          />

          <ImageGallery
            selectedDocument={selectedDocument}
            documentImages={documentImages}
            imagesLoading={imagesLoading}
            onClose={() => {
              setSelectedDocument(null);
              setDocumentImages([]);
            }}
          />

          {isAdmin && (
            <div>
              <button
                onClick={() => setShowMembers((s) => !s)}
                aria-expanded={showMembers}
                className="mb-2 w-full rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {showMembers ? "Ocultar equipe" : "Gerenciar equipe"}
              </button>
              {showMembers && <MembersPanel />}
            </div>
          )}
        </aside>

        <ChatPanel
          messages={messages}
          question={question}
          setQuestion={setQuestion}
          loading={loading}
          sendMessage={sendMessage}
          clearChat={() => {
            setMessages(INITIAL_MESSAGES);
            setQuestion("");
          }}
        />
      </main>
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400"
      >
        Carregando...
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <Root />
      </AccessibilityProvider>
    </AuthProvider>
  );
}
