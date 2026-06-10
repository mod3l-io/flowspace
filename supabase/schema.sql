-- =============================================
-- FLOWSPACE — Schema completo
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Workspaces (espacios de trabajo colaborativos)
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Miembros del workspace
create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now() not null,
  primary key (workspace_id, user_id)
);

-- Páginas (documentos y notas anidables)
create table pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  parent_id uuid references pages(id) on delete cascade,
  title text not null default 'Sin título',
  content jsonb,
  icon text not null default '📄',
  type text not null default 'document' check (type in ('document', 'note')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tareas
create table tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  due_date date,
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-actualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at
  before update on pages
  for each row execute function update_updated_at();

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- =============================================
-- Row Level Security
-- =============================================

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table pages enable row level security;
alter table tasks enable row level security;

-- Helper: workspaces accesibles por el usuario actual
create or replace function my_workspace_ids()
returns setof uuid language sql security definer as $$
  select id from workspaces where owner_id = auth.uid()
  union
  select workspace_id from workspace_members where user_id = auth.uid()
$$;

-- Workspaces
create policy "Ver workspaces propios o como miembro"
  on workspaces for select using (id in (select my_workspace_ids()));

create policy "Crear workspace propio"
  on workspaces for insert with check (owner_id = auth.uid());

create policy "Actualizar workspace propio"
  on workspaces for update using (owner_id = auth.uid());

-- Workspace members
create policy "Ver miembros si soy del workspace"
  on workspace_members for select using (workspace_id in (select my_workspace_ids()));

create policy "Unirse a workspace"
  on workspace_members for insert with check (user_id = auth.uid());

create policy "Owner gestiona miembros"
  on workspace_members for delete
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Pages
create policy "Ver páginas del workspace"
  on pages for select using (workspace_id in (select my_workspace_ids()));

create policy "Crear páginas en workspace"
  on pages for insert with check (workspace_id in (select my_workspace_ids()));

create policy "Actualizar páginas del workspace"
  on pages for update using (workspace_id in (select my_workspace_ids()));

create policy "Eliminar páginas del workspace"
  on pages for delete using (workspace_id in (select my_workspace_ids()));

-- Tasks
create policy "Ver tareas del workspace"
  on tasks for select using (workspace_id in (select my_workspace_ids()));

create policy "Crear tareas en workspace"
  on tasks for insert with check (workspace_id in (select my_workspace_ids()));

create policy "Actualizar tareas del workspace"
  on tasks for update using (workspace_id in (select my_workspace_ids()));

create policy "Eliminar tareas del workspace"
  on tasks for delete using (workspace_id in (select my_workspace_ids()));

-- =============================================
-- Realtime
-- =============================================
alter publication supabase_realtime add table pages;
alter publication supabase_realtime add table tasks;
