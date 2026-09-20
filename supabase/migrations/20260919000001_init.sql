-- Quotebot starter tables (Deployment Plan section 5).
-- One system for every client. Each row belongs to a client, and Row Level Security
-- (next migration) keeps owners inside their own rows.
-- Only the server writes, using the secret key. The widget never touches the database.

-- A business we run a bot for.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                       -- matches the folder name in clients/
  business_name text not null,
  brand jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'disabled')),
  plan text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Websites allowed to load this client's widget.
create table if not exists public.client_domains (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  domain text not null,
  created_at timestamptz not null default now(),
  unique (client_id, domain)
);

-- Links an owner's login to their client.
create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

-- Every version of a client's pricing rules. signed_off_by_owner stays false
-- until a real owner signs the sheet (golden rule 5).
create table if not exists public.rules_versions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  version text not null,
  rules jsonb not null,
  signed_off_by_owner boolean not null default false,
  signed_off_by text,
  signed_off_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, version)
);

-- One row per chat.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  outcome text check (outcome in ('ok', 'need_info', 'needs_review', 'out_of_area', 'out_of_scope', 'abandoned')),
  visitor_hash text,                               -- hashed, never a raw IP address
  source_domain text,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

-- Every message, including replies the guard blocked and why.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  blocked boolean not null default false,
  block_reasons jsonb,
  photo_count integer not null default 0 check (photo_count between 0 and 3),
  created_at timestamptz not null default now()
);

-- Photos live in Storage; this is where they are and when to delete them.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  storage_path text not null unique,
  bytes integer,
  created_at timestamptz not null default now(),
  delete_after date not null default (now() + interval '90 days')::date
);

-- What the engine was given and what it returned, with the rules version that priced it.
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  rules_version_id uuid references public.rules_versions (id),
  status text not null check (status in ('ok', 'need_info', 'needs_review', 'out_of_area', 'out_of_scope')),
  low numeric(10, 2),
  high numeric(10, 2),
  engine_input jsonb not null,
  engine_output jsonb not null,
  created_at timestamptz not null default now()
);

-- The point of the whole thing. Saved before the owner email is sent (golden rule 8).
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  estimate_id uuid references public.estimates (id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  best_time text,
  consent_texts boolean not null default false,
  alert_sent boolean not null default false,
  alert_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Widget opened, estimate shown, lead submitted. For owner reports later.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Grades from the GPT checker (validator/RUBRIC.md).
create table if not exists public.judge_results (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  model text,
  passed boolean,
  checks jsonb,
  suggested_fix text,
  created_at timestamptz not null default now()
);

create index if not exists conversations_client_started_idx on public.conversations (client_id, started_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists photos_conversation_idx on public.photos (conversation_id);
create index if not exists estimates_conversation_idx on public.estimates (conversation_id, created_at);
create index if not exists leads_client_created_idx on public.leads (client_id, created_at desc);
create index if not exists events_client_created_idx on public.events (client_id, created_at desc);
create index if not exists client_domains_domain_idx on public.client_domains (domain);
create index if not exists rules_versions_client_idx on public.rules_versions (client_id, created_at desc);
