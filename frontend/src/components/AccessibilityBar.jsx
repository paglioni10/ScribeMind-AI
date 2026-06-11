import { useAccessibility } from "../context/AccessibilityContext";

const FONT_SIZES = [
  { value: "normal", label: "A", ariaLabel: "Fonte normal" },
  { value: "large", label: "A+", ariaLabel: "Fonte grande" },
  { value: "xlarge", label: "A++", ariaLabel: "Fonte muito grande" },
];

export function AccessibilityBar({ vlibrasEnabled, onToggleVlibras }) {
  const { highContrast, setHighContrast, fontSize, setFontSize, theme, setTheme } =
    useAccessibility();

  return (
    <nav
      role="navigation"
      aria-label="Barra de acessibilidade"
      className="accessibility-bar flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-2"
    >
      <span
        className="text-xs font-medium text-slate-500"
        aria-hidden="true"
      >
        Acessibilidade:
      </span>

      {/* Tema claro/escuro */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-pressed={theme === "light"}
        aria-label={
          theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
        }
        className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        {theme === "dark" ? "Modo claro" : "Modo escuro"}
      </button>

      {/* Alto contraste */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        aria-pressed={highContrast}
        aria-label={
          highContrast ? "Desativar alto contraste" : "Ativar alto contraste"
        }
        className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        {highContrast ? "Contraste padrão" : "Alto contraste"}
      </button>

      {/* Tamanho de fonte */}
      <div
        role="group"
        aria-label="Tamanho da fonte"
        className="flex gap-1"
      >
        {FONT_SIZES.map(({ value, label, ariaLabel }) => (
          <button
            key={value}
            onClick={() => setFontSize(value)}
            aria-pressed={fontSize === value}
            aria-label={ariaLabel}
            className={`rounded border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              fontSize === value
                ? "border-cyan-400 text-cyan-400"
                : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* VLibras */}
      <button
        onClick={onToggleVlibras}
        aria-pressed={vlibrasEnabled}
        aria-label="Ativar interpretação em Língua Brasileira de Sinais via VLibras"
        className={`rounded border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          vlibrasEnabled
            ? "border-cyan-400 text-cyan-400"
            : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
        }`}
      >
        {vlibrasEnabled ? "Libras ativo" : "Libras (VLibras)"}
      </button>

      {/* Skip link visível no foco */}
      <a
        href="#main-chat"
        className="ml-auto rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 transition hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sr-only focus:not-sr-only"
      >
        Ir para o chat
      </a>
    </nav>
  );
}
