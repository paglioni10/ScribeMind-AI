-- ============================================================================
-- Épico 10 — Multiusuário, organizações e permissões
-- Execute no Supabase SQL Editor.
-- Pré-requisito: Authentication > Providers > Email habilitado no painel.
-- ============================================================================

-- 1) Perfis de usuário (espelham auth.users) ---------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- 2) Código de convite por organização ---------------------------------------
-- Permite que novos usuários entrem numa org existente sem admin API.
alter table organizations
  add column if not exists invite_code text unique;

-- Gera um código para organizações que ainda não têm
update organizations
set invite_code = substr(md5(random()::text), 1, 8)
where invite_code is null;

-- 3) Membros da organização (papel) ------------------------------------------
create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_org_members_user on organization_members (user_id);
create index if not exists idx_org_members_org on organization_members (organization_id);

-- 4) Cria profile automaticamente quando um usuário se cadastra ---------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Observação sobre RLS:
-- O backend FastAPI usa a service key e faz o controle de acesso por
-- organização na camada de aplicação (escopo por org_id + checagem de papel).
-- Se quiser defesa em profundidade, habilite RLS nas tabelas e crie policies
-- baseadas em organization_members. Não é obrigatório para o app funcionar.
-- ============================================================================
