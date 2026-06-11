-- ============================================================================
-- Acesso granular ao dashboard + fluxo de solicitação de acesso
-- Execute no Supabase SQL Editor.
-- ============================================================================

-- Permissão específica de dashboard (independente do papel admin/owner)
alter table organization_members
  add column if not exists dashboard_access boolean not null default false;

-- Solicitações de acesso ao dashboard feitas por membros
create table if not exists dashboard_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

create index if not exists idx_dash_requests_org_status
  on dashboard_access_requests (organization_id, status);

create index if not exists idx_dash_requests_user
  on dashboard_access_requests (user_id);
