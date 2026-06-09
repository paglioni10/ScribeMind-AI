-- Adiciona coluna image_id na tabela chunks para vincular chunks visuais à imagem de origem.
-- Execute no Supabase SQL Editor antes de fazer upload de novos documentos com imagens.

ALTER TABLE chunks
ADD COLUMN IF NOT EXISTS image_id uuid REFERENCES document_images(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chunks_image_id ON chunks (image_id);
