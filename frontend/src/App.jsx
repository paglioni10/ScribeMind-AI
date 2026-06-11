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
import { ConversationSidebar } from "./components/ConversationSidebar";
import { Dashboard } from "./components/Dashboard";
import { AccessRequestButton } from "./components/AccessRequestButton";
import { DashboardRequestsBanner } from "./components/DashboardRequestsBanner";
import { Logo } from "./components/Logo";
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

function TopBar({ view, setView }) {
  const { user, logout, canViewDashboard } = useAuth();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-3">
        <Logo className="h-7 w-auto" />
        {user?.organization?.name && (
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {user.organization.name}
          </span>
        )}
        {canViewDashboard && (
          <nav className="flex gap-1" aria-label="Navegação principal">
            <button
              onClick={() => setView("chat")}
              aria-current={view === "chat" ? "page" : undefined}
              className={`rounded-lg px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                view === "chat"
                  ? "bg-cyan-500 text-slate-950"
                  : "border border-slate-700 text-slate-300 hover:border-cyan-400"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setView("dashboard")}
              aria-current={view === "dashboard" ? "page" : undefined}
              className={`rounded-lg px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                view === "dashboard"
                  ? "bg-cyan-500 text-slate-950"
                  : "border border-slate-700 text-slate-300 hover:border-cyan-400"
              }`}
            >
              Dashboard
            </button>
          </nav>
        )}

        {!canViewDashboard && <AccessRequestButton />}
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
  const { isAdmin, canViewDashboard } = useAuth();

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
  const [reprocessingId, setReprocessingId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentImages, setDocumentImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const [vlibrasEnabled, setVlibrasEnabled] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [view, setView] = useState("chat");

  useEffect(() => {
    loadDocuments();
    loadConversations();
  }, []);

  async function loadConversations() {
    setConversationsLoading(true);
    try {
      const response = await apiFetch("/conversations/");
      const data = await response.json();
      if (response.ok) setConversations(data.conversations || []);
    } catch {
      // estado vazio comunica a falha
    } finally {
      setConversationsLoading(false);
    }
  }

  async function selectConversation(conversationId) {
    try {
      const response = await apiFetch(`/conversations/${conversationId}`);
      const data = await response.json();
      if (!response.ok) {
        alert("Erro ao carregar a conversa.");
        return;
      }
      const loaded = (data.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
        sources: m.sources || [],
      }));
      setMessages(loaded.length ? loaded : INITIAL_MESSAGES);
      setActiveConversationId(conversationId);
    } catch {
      alert("Erro ao conectar com o backend.");
    }
  }

  function newChat() {
    setActiveConversationId(null);
    setMessages(INITIAL_MESSAGES);
    setQuestion("");
  }

  async function deleteConversation(conversationId) {
    if (!window.confirm("Excluir esta conversa?")) return;
    try {
      const response = await apiFetch(`/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        alert("Erro ao excluir a conversa.");
        return;
      }
      if (activeConversationId === conversationId) newChat();
      await loadConversations();
    } catch {
      alert("Erro ao conectar com o backend.");
    }
  }

  async function reprocessDocument(documentId) {
    if (
      !window.confirm(
        "Reprocessar este documento? Isso re-gera os embeddings e as descrições das imagens via IA (Gemini)."
      )
    )
      return;

    setReprocessingId(documentId);
    try {
      const response = await apiFetch(`/documents/${documentId}/reprocess`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || "Erro ao reprocessar documento.");
        return;
      }
      alert(
        `Reprocessado: ${data.images_reprocessed} imagem(ns) e ${data.text_chunks_reembedded} chunk(s) de texto.`
      );
      if (selectedDocument?.id === documentId) {
        await loadDocumentImages(selectedDocument);
      }
      await loadDocuments();
    } catch {
      alert("Erro ao conectar com o backend.");
    } finally {
      setReprocessingId(null);
    }
  }

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
        body: {
          question: currentQuestion,
          conversation_id: activeConversationId,
        },
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

      // Conversa nova → fixa o id e atualiza a sidebar
      const isNewConversation = activeConversationId !== data.conversation_id;
      setActiveConversationId(data.conversation_id);
      if (isNewConversation) loadConversations();
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

      <TopBar view={view} setView={setView} />

      {isAdmin && <DashboardRequestsBanner />}

      <AccessibilityBar
        vlibrasEnabled={vlibrasEnabled}
        onToggleVlibras={() => setVlibrasEnabled((v) => !v)}
      />

      <VLibras enabled={vlibrasEnabled} />

      {view === "dashboard" && canViewDashboard ? (
        <main className="mx-auto max-w-7xl px-4 py-6" role="main">
          <Dashboard />
        </main>
      ) : (
        <main
          className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[380px_1fr]"
          role="main"
        >
          <aside aria-label="Painel de gerenciamento" className="space-y-4">
          <ConversationSidebar
            conversations={conversations}
            loading={conversationsLoading}
            activeConversationId={activeConversationId}
            onSelect={selectConversation}
            onNew={newChat}
            onDelete={deleteConversation}
          />

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
            reprocessingId={reprocessingId}
            selectedDocument={selectedDocument}
            isAdmin={isAdmin}
            onRefresh={loadDocuments}
            onDelete={deleteDocument}
            onReprocess={reprocessDocument}
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
          clearChat={newChat}
        />
        </main>
      )}
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
