-- ============================================================================
-- Governança — histórico de auditoria
-- Registra ações sensíveis (quem fez o quê, quando) por organização.
-- Execute no Supabase SQL Editor. Escolha "Run without RLS".
-- ============================================================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_org_created
  on audit_logs (organization_id, created_at desc);
