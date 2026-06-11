import { useEffect, useRef } from "react";

export function Lightbox({ src, alt, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    // Trava o scroll do fundo enquanto aberto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de imagem"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Fechar imagem (Escape)"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#475569] bg-[#0f172acc] text-lg text-[#e2e8f0] transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        ✕
      </button>

      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full max-w-5xl flex-col items-center gap-3"
      >
        <img
          src={src}
          alt={alt || "Imagem ampliada"}
          className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
        />
        {alt && (
          <figcaption className="max-w-2xl text-center text-xs text-[#94a3b8]">
            {alt}
          </figcaption>
        )}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-[#22d3ee] underline hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Abrir original em nova aba
        </a>
      </figure>
    </div>
  );
}
