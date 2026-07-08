-- ============================================================
-- Lunito AI — Supabase schema setup
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- USERS table (profile data, keyed by auth user id)
create table if not exists public.users (
  id text primary key,
  owner_id text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- CHATS table
create table if not exists public.chats (
  id text primary key,
  owner_id text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- NOTEBOOKS table
create table if not exists public.notebooks (
  id text primary key,
  owner_id text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- MESSAGES table (belongs to a chat via chat_id)
create table if not exists public.messages (
  id text primary key,
  owner_id text,
  chat_id text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists messages_chat_id_idx on public.messages (chat_id);

-- ============================================================
-- Row Level Security: every user can only read/write their own rows
-- ============================================================

alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.notebooks enable row level security;
alter table public.messages enable row level security;

-- USERS policies
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (owner_id = auth.uid()::text or id = auth.uid()::text);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (owner_id = auth.uid()::text or id = auth.uid()::text);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (owner_id = auth.uid()::text or id = auth.uid()::text);

drop policy if exists "users_delete_own" on public.users;
create policy "users_delete_own" on public.users
  for delete using (owner_id = auth.uid()::text or id = auth.uid()::text);

-- CHATS policies
drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own" on public.chats
  for select using (owner_id = auth.uid()::text);

drop policy if exists "chats_insert_own" on public.chats;
create policy "chats_insert_own" on public.chats
  for insert with check (owner_id = auth.uid()::text);

drop policy if exists "chats_update_own" on public.chats;
create policy "chats_update_own" on public.chats
  for update using (owner_id = auth.uid()::text);

drop policy if exists "chats_delete_own" on public.chats;
create policy "chats_delete_own" on public.chats
  for delete using (owner_id = auth.uid()::text);

-- NOTEBOOKS policies
drop policy if exists "notebooks_select_own" on public.notebooks;
create policy "notebooks_select_own" on public.notebooks
  for select using (owner_id = auth.uid()::text);

drop policy if exists "notebooks_insert_own" on public.notebooks;
create policy "notebooks_insert_own" on public.notebooks
  for insert with check (owner_id = auth.uid()::text);

drop policy if exists "notebooks_update_own" on public.notebooks;
create policy "notebooks_update_own" on public.notebooks
  for update using (owner_id = auth.uid()::text);

drop policy if exists "notebooks_delete_own" on public.notebooks;
create policy "notebooks_delete_own" on public.notebooks
  for delete using (owner_id = auth.uid()::text);

-- MESSAGES policies
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select using (owner_id = auth.uid()::text);

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert with check (owner_id = auth.uid()::text);

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update using (owner_id = auth.uid()::text);

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages
  for delete using (owner_id = auth.uid()::text);
