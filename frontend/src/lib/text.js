/**
 * Limpa formatação markdown que alguns modelos retornam (asteriscos, #, `),
 * deixando texto legível em plain text. Serve como rede de segurança para
 * descrições/respostas já armazenadas.
 */
export function cleanAiText(text) {
  if (!text) return "";

  return (
    text
      // listas: "* item" ou "- item" no início da linha -> "• item"
      .replace(/^[ \t]*[*-][ \t]+/gm, "• ")
      // títulos markdown "### Título" -> "Título"
      .replace(/^#{1,6}[ \t]*/gm, "")
      // negrito/itálico ** __ e asteriscos/underscores soltos de ênfase
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/(?<=\S)\*(?=\S)|(?<=\s)\*(?=\S)|(?<=\S)\*(?=\s)/g, "")
      // code inline `texto`
      .replace(/`/g, "")
      // espaços antes de pontuação e linhas em branco em excesso
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
