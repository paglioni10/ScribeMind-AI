import { useEffect, useRef } from "react";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

function ImageSource({ image }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500">
          Página {image.page_number} · Imagem {image.image_index}
        </span>
        {image.description_status && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              image.description_status === "completed"
                ? "bg-emerald-900/60 text-emerald-300"
                : "bg-amber-900/60 text-amber-300"
            }`}
            aria-label={`Status: ${image.description_status}`}
          >
            {image.description_status}
          </span>
        )}
        {image.description_provider && image.description_provider !== "mock" && (
          <span className="rounded-full bg-cyan-900/40 px-2 py-0.5 text-[10px] text-cyan-400">
            {image.description_provider}
          </span>
        )}
      </div>

      <a
        href={image.public_url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Abrir imagem da página ${image.page_number} em nova aba`}
      >
        <img
          src={image.public_url}
          alt={
            image.description ||
            `Página ${image.page_number}, imagem ${image.image_index}`
          }
          className="max-h-48 w-full rounded-lg object-contain"
        />
      </a>

      {image.description && image.description_status === "completed" && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          {image.description}
        </p>
      )}
    </div>
  );
}

function SpeakButton({ text, speak, stop, speaking }) {
  const isThisOne = speaking;

  return (
    <button
      onClick={() => (isThisOne ? stop() : speak(text))}
      aria-label={isThisOne ? "Parar leitura" : "Ouvir esta resposta"}
      aria-pressed={isThisOne}
      className="mt-2 flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-[11px] text-slate-400 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      {isThisOne ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.784L4.81 13.5H3a1 1 0 01-1-1v-5a1 1 0 011-1h1.81l3.573-3.284a1 1 0 011-.14zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {isThisOne ? "Parar" : "Ouvir"}
    </button>
  );
}

export function ChatPanel({
  messages,
  question,
  setQuestion,
  loading,
  sendMessage,
  clearChat,
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { speak, stop, speaking, supported: ttsSupported } = useSpeechSynthesis();

  const { listening, start: startListening, stop: stopListening, supported: sttSupported } =
    useSpeechRecognition({ onResult: (text) => setQuestion(text) });

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Foca o input após envio
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
    if (event.key === "Escape") {
      setQuestion("");
    }
  }

  return (
    <section
      id="main-chat"
      aria-label="Chat com documentos"
      className="flex min-h-[720px] flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg"
    >
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
          aria-label="Limpar histórico do chat"
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Limpar chat
        </button>
      </div>

      {/* Região live — leitor de tela anuncia novas mensagens */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Histórico de mensagens"
        aria-relevant="additions"
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4"
      >
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
              aria-label={
                message.role === "user"
                  ? "Você disse"
                  : "Resposta do assistente"
              }
            >
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* TTS por mensagem */}
              {message.role === "assistant" && ttsSupported && (
                <SpeakButton
                  text={message.content}
                  speak={speak}
                  stop={stop}
                  speaking={speaking}
                />
              )}

              {/* Fontes */}
              {message.sources && message.sources.length > 0 && (
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
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-100">
                            {source.section_title || "Documento sem título"}
                          </p>
                          {source.is_visual_chunk && (
                            <span
                              className="rounded-full bg-purple-900/50 px-2 py-0.5 text-[10px] font-semibold text-purple-300"
                              aria-label="Fonte visual — imagem do documento"
                            >
                              imagem
                            </span>
                          )}
                        </div>

                        {source.source_url && (
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir fonte: ${source.section_title || "documento"}`}
                            className="mt-1 block text-cyan-400 underline"
                          >
                            Abrir fonte
                          </a>
                        )}

                        {source.images && source.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {source.images.map((image) => (
                              <ImageSource key={image.id} image={image} />
                            ))}
                          </div>
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
          <div
            role="status"
            aria-label="Consultando documentos, aguarde"
            className="flex justify-start"
          >
            <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
              <span className="animate-pulse">Consultando documentos...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input area */}
      <div className="mt-4 flex gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-3">
        <label htmlFor="chat-input" className="sr-only">
          Digite sua pergunta
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            listening
              ? "Ouvindo... fale sua pergunta"
              : "Digite sua pergunta ou use o microfone..."
          }
          aria-label="Campo de pergunta"
          aria-describedby="chat-input-hint"
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60"
        />
        <span id="chat-input-hint" className="sr-only">
          Pressione Enter para enviar ou Escape para limpar
        </span>

        {/* STT — microfone */}
        {sttSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            aria-label={
              listening ? "Parar gravação de voz" : "Enviar pergunta por voz"
            }
            aria-pressed={listening}
            disabled={loading}
            className={`rounded-xl border px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60 ${
              listening
                ? "border-red-500 bg-red-900/20 text-red-400"
                : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
            }`}
          >
            {listening ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={sendMessage}
          disabled={loading || !question.trim()}
          aria-label="Enviar pergunta"
          className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Enviar
        </button>
      </div>
    </section>
  );
}
