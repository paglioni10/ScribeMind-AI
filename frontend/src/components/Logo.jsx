import { useAccessibility } from "../context/AccessibilityContext";

const PALETTES = {
  dark: { word1: "#ffffff", word2: "#22d3ee", mark: "#22d3ee", accent: "#ffffff" },
  light: { word1: "#0f172a", word2: "#0891b2", mark: "#0891b2", accent: "#0f172a" },
  contrast: { word1: "#ffffff", word2: "#ffff00", mark: "#ffff00", accent: "#ffffff" },
};

/**
 * Logo do ScribeMind AI. Escolhe automaticamente a variante (escura/clara/alto
 * contraste) conforme o tema atual, mas aceita override via prop `theme`.
 */
export function Logo({ theme: themeProp, className = "", title = true }) {
  const ctx = useAccessibility();
  // Alto contraste tem prioridade (força fundo preto independente do tema)
  const variant = ctx?.highContrast
    ? "contrast"
    : themeProp || ctx?.theme || "dark";
  const c = PALETTES[variant] || PALETTES.dark;

  return (
    <svg
      viewBox="0 0 196 36"
      className={className}
      role="img"
      aria-label="ScribeMind AI"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>ScribeMind AI</title>}

      <rect x="2" y="6" width="30" height="21" rx="6" fill="none" stroke={c.mark} strokeWidth="2.5" />
      <path d={`M11 27 L7 33 L19 27 Z`} fill={c.mark} />
      <line x1="9" y1="14" x2="24" y2="11" stroke={c.mark} strokeWidth="1.3" opacity="0.7" />
      <line x1="9" y1="14" x2="16" y2="22" stroke={c.mark} strokeWidth="1.3" opacity="0.7" />
      <line x1="24" y1="11" x2="27" y2="21" stroke={c.mark} strokeWidth="1.3" opacity="0.7" />
      <line x1="16" y1="22" x2="27" y2="21" stroke={c.mark} strokeWidth="1.3" opacity="0.7" />
      <line x1="24" y1="11" x2="16" y2="22" stroke={c.mark} strokeWidth="1.3" opacity="0.7" />
      <circle cx="9" cy="14" r="1.8" fill={c.mark} />
      <circle cx="16" cy="22" r="1.8" fill={c.mark} />
      <circle cx="27" cy="21" r="1.8" fill={c.mark} />
      <circle cx="24" cy="11" r="2.3" fill={c.accent} />

      <text
        x="44"
        y="25"
        fontFamily="inherit"
        fontSize="20"
        fontWeight="600"
      >
        <tspan fill={c.word1}>Scribe</tspan>
        <tspan fill={c.word2}>Mind</tspan>
      </text>
    </svg>
  );
}
