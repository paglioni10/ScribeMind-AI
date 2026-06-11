-- ============================================================================
-- Migração de embeddings OpenAI (1536) -> Gemini/text-embedding-004 (768)
-- Execute no Supabase SQL Editor.
--
-- ATENÇÃO: isto APAGA os embeddings existentes (a dimensão muda de 1536 para
-- 768). Os documentos continuam, mas precisam ser RE-INDEXADOS depois:
-- use o botão "Reprocessar" em cada documento (admin) para gerar os novos
-- embeddings, ou reenvie os arquivos.
-- ============================================================================

-- 0) Remove a função antiga ANTES de tudo.
-- (Se o create-function falha no meio, o Supabase desfaz a transação inteira,
--  inclusive a troca da coluna abaixo. Por isso o drop vem primeiro.)
drop function if exists match_chunks(vector, integer, uuid);

-- 1) Recria a coluna embedding com a nova dimensão
drop index if exists idx_chunks_embedding;
alter table chunks drop column if exists embedding;
alter table chunks add column embedding vector(768);

-- 2) Recria a função de busca por similaridade com a nova dimensão
create or replace function match_chunks(
  query_embedding vector(768),
  match_count int,
  org_id uuid
)
returns table (
  id uuid,
  content text,
  source_url text,
  section_title text,
  document_id uuid,
  chunk_index int,
  image_id uuid,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.content,
    c.source_url,
    c.section_title,
    c.document_id,
    c.chunk_index,
    c.image_id,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where c.organization_id = org_id
    and c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- 3) (Opcional) Índice para acelerar a busca vetorial
create index if not exists idx_chunks_embedding
  on chunks using hnsw (embedding vector_cosine_ops);
