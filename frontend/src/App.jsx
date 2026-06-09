import { useEffect, useState } from "react";
import "./index.css";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { AccessibilityBar } from "./components/AccessibilityBar";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentUpload } from "./components/DocumentUpload";
import { DocumentList } from "./components/DocumentList";
import { ImageGallery } from "./components/ImageGallery";
import { VLibras } from "./components/VLibras";

const API = "http://127.0.0.1:8000";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Olá, eu sou o ScribeMind AI. Pergunte algo sobre os processos da empresa.",
    sources: [],
  },
];

function AppContent() {
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

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setDocumentsLoading(true);
    try {
      const response = await fetch(`${API}/documents/`);
      const data = await response.json();
      if (response.ok) setDocuments(data.documents || []);
    } catch {
      // falha silenciosa — estado vazio já comunica isso
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function deleteDocument(documentId) {
    if (!window.confirm("Tem certeza que deseja excluir este documento?")) return;

    setDeletingDocumentId(documentId);
    try {
      const response = await fetch(`${API}/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        alert("Erro ao excluir documento.");
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
      const response = await fetch(`${API}/documents/${document.id}/images`);
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
      const response = await fetch(`${API}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
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
      const response = await fetch(`${API}/documents/upload`, {
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
      {/* Skip link para navegação por teclado */}
      <a
        href="#main-chat"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg focus-visible:outline-none"
      >
        Pular para o chat
      </a>

      <AccessibilityBar
        vlibrasEnabled={vlibrasEnabled}
        onToggleVlibras={() => setVlibrasEnabled((v) => !v)}
      />

      <VLibras enabled={vlibrasEnabled} />

      <main
        className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[380px_1fr]"
        role="main"
      >
        <aside
          aria-label="Painel de gerenciamento de documentos"
          className="space-y-4"
        >
          <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-cyan-400" aria-hidden="true">
              ScribeMind AI
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              Knowledge Engine Corporativo
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Consulte processos internos com respostas baseadas em documentos
              oficiais.
            </p>
          </header>

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

export default function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
