import { useEffect, useRef, useState } from "react";
import { cleanAiText } from "../lib/text";
import { Lightbox } from "./Lightbox";

export function ImageGallery({
  selectedDocument,
  documentImages,
  imagesLoading,
  onClose,
}) {
  const closeButtonRef = useRef(null);
  const [lightbox, setLightbox] = useState(null); // { src, alt }

  // Move foco para o botão fechar ao abrir
  useEffect(() => {
    if (selectedDocument) closeButtonRef.current?.focus();
  }, [selectedDocument]);

  // Fecha com Escape (mas não quando o lightbox está aberto — ele tem o próprio Esc)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && selectedDocument && !lightbox) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedDocument, onClose, lightbox]);

  if (!selectedDocument) return null;

  return (
    <section
      aria-labelledby="gallery-heading"
      aria-live="polite"
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id="gallery-heading" className="text-sm font-semibold text-slate-100">
            Imagens extraídas
          </p>
          <p className="mt-1 text-xs text-slate-400">{selectedDocument.title}</p>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fechar painel de imagens (Escape)"
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          Fechar
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {imagesLoading && (
          <p role="status" aria-live="polite" className="text-xs text-slate-400">
            Carregando imagens...
          </p>
        )}

        {!imagesLoading && documentImages.length === 0 && (
          <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            Nenhuma imagem extraída para este documento.
          </p>
        )}

        {!imagesLoading &&
          documentImages.map((image) => (
            <figure
              key={image.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">
                  Página {image.page_number} · Imagem {image.image_index}
                </span>
                {image.description_status && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      image.description_status === "completed"
                        ? "bg-emerald-900/60 text-emerald-300"
                        : image.description_status === "mock"
                        ? "bg-amber-900/60 text-amber-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                    aria-label={`Status da descrição: ${image.description_status}`}
                  >
                    {image.description_status}
                  </span>
                )}
                {image.description_provider &&
                  image.description_provider !== "mock" && (
                    <span
                      className="rounded-full bg-cyan-900/40 px-2 py-0.5 text-[10px] text-cyan-400"
                      aria-label={`Gerado por: ${image.description_provider}`}
                    >
                      {image.description_provider}
                    </span>
                  )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    src: image.public_url,
                    alt: image.description
                      ? cleanAiText(image.description)
                      : `Imagem ${image.image_index} da página ${image.page_number} do documento ${selectedDocument.title}`,
                  })
                }
                aria-label={`Ampliar imagem da página ${image.page_number}`}
                className="group block w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <img
                  src={image.public_url}
                  alt={
                    image.description
                      ? cleanAiText(image.description)
                      : `Imagem ${image.image_index} da página ${image.page_number} do documento ${selectedDocument.title}`
                  }
                  className="max-h-64 w-full cursor-zoom-in rounded-lg object-contain transition group-hover:opacity-90"
                />
              </button>

              {image.description && (
                <figcaption className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-2">
                  <p
                    className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                    aria-hidden="true"
                  >
                    Descrição IA
                  </p>
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">
                    {cleanAiText(image.description)}
                  </p>
                </figcaption>
              )}
            </figure>
          ))}
      </div>

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
