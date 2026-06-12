-- ============================================================================
-- Governança — Row Level Security (defesa em profundidade)
-- Execute no Supabase SQL Editor.
--
-- SEGURO: o backend usa a service_role key, que IGNORA o RLS. Ativar RLS aqui
-- não afeta a aplicação — apenas bloqueia acesso direto às tabelas por chaves
-- não privilegiadas (ex.: anon key vazada), restringindo cada usuário aos
-- dados da sua própria organização.
--
-- Observação: as comparações usam ::text para funcionar mesmo se algumas
-- colunas de id tiverem sido criadas como text em vez de uuid no schema inicial.
-- ============================================================================

-- Helper: o usuário autenticado é membro da organização?
drop function if exists is_org_member(uuid);
create or replace function is_org_member(org text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where organization_id::text = org
      and user_id::text = auth.uid()::text
  );
$$;

-- organizations ---------------------------------------------------------------
alter table organizations enable row level security;
drop policy if exists org_member_select on organizations;
create policy org_member_select on organizations
  for select to authenticated using (is_org_member(id::text));

-- profiles (próprio perfil ou de colegas da mesma organização) ----------------
alter table profiles enable row level security;
drop policy if exists profiles_self_or_org on profiles;
create policy profiles_self_or_org on profiles
  for select to authenticated using (
    id::text = auth.uid()::text or exists (
      select 1
      from organization_members m1
      join organization_members m2 on m1.organization_id::text = m2.organization_id::text
      where m1.user_id::text = auth.uid()::text
        and m2.user_id::text = profiles.id::text
    )
  );

-- organization_members --------------------------------------------------------
alter table organization_members enable row level security;
drop policy if exists members_org_select on organization_members;
create policy members_org_select on organization_members
  for select to authenticated using (is_org_member(organization_id::text));

-- documents -------------------------------------------------------------------
alter table documents enable row level security;
drop policy if exists documents_org_all on documents;
create policy documents_org_all on documents
  for all to authenticated
  using (is_org_member(organization_id::text))
  with check (is_org_member(organization_id::text));

-- document_versions (escopo via documento pai) --------------------------------
alter table document_versions enable row level security;
drop policy if exists doc_versions_org_all on document_versions;
create policy doc_versions_org_all on document_versions
  for all to authenticated
  using (exists (
    select 1 from documents d
    where d.id::text = document_versions.document_id::text
      and is_org_member(d.organization_id::text)
  ))
  with check (exists (
    select 1 from documents d
    where d.id::text = document_versions.document_id::text
      and is_org_member(d.organization_id::text)
  ));

-- chunks ----------------------------------------------------------------------
alter table chunks enable row level security;
drop policy if exists chunks_org_all on chunks;
create policy chunks_org_all on chunks
  for all to authenticated
  using (is_org_member(organization_id::text))
  with check (is_org_member(organization_id::text));

-- document_images -------------------------------------------------------------
alter table document_images enable row level security;
drop policy if exists doc_images_org_all on document_images;
create policy doc_images_org_all on document_images
  for all to authenticated
  using (is_org_member(organization_id::text))
  with check (is_org_member(organization_id::text));

-- conversations (apenas as do próprio usuário) --------------------------------
alter table conversations enable row level security;
drop policy if exists conversations_own on conversations;
create policy conversations_own on conversations
  for all to authenticated
  using (user_id::text = auth.uid()::text and is_org_member(organization_id::text))
  with check (user_id::text = auth.uid()::text and is_org_member(organization_id::text));

-- messages (escopo via conversa do usuário) -----------------------------------
alter table messages enable row level security;
drop policy if exists messages_own on messages;
create policy messages_own on messages
  for all to authenticated
  using (exists (
    select 1 from conversations c
    where c.id::text = messages.conversation_id::text
      and c.user_id::text = auth.uid()::text
  ))
  with check (exists (
    select 1 from conversations c
    where c.id::text = messages.conversation_id::text
      and c.user_id::text = auth.uid()::text
  ));

-- dashboard_access_requests ---------------------------------------------------
alter table dashboard_access_requests enable row level security;
drop policy if exists dash_requests_org on dashboard_access_requests;
create policy dash_requests_org on dashboard_access_requests
  for all to authenticated
  using (is_org_member(organization_id::text))
  with check (is_org_member(organization_id::text));

-- audit_logs (leitura por membros; inserção só via service_role) ---------------
alter table audit_logs enable row level security;
drop policy if exists audit_org_select on audit_logs;
create policy audit_org_select on audit_logs
  for select to authenticated using (is_org_member(organization_id::text));

-- feedback (ainda sem uso): RLS ligado, acesso só via service_role ------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'feedback'
  ) then
    execute 'alter table feedback enable row level security';
  end if;
end $$;
