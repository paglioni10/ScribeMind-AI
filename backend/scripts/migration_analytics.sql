-- ============================================================================
-- Épico 12 — Inteligência operacional
-- Marca se uma resposta do assistente conseguiu (ou não) responder à pergunta,
-- alimentando o dashboard de perguntas sem resposta e lacunas de conhecimento.
-- Execute no Supabase SQL Editor.
-- ============================================================================

alter table messages
  add column if not exists answered boolean;

-- Índice para filtrar respostas sem resposta rapidamente
create index if not exists idx_messages_answered on messages (answered);
