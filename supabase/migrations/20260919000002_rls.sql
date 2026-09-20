-- Row Level Security: on for every table, deny by default.
--
-- Owners can READ only their own client's rows, once the owner portal exists.
-- Nobody gets insert, update, or delete through RLS. All writes go through our server,
-- which uses the secret key and bypasses RLS. The widget only ever calls /api/*.

alter table public.clients enable row level security;
alter table public.client_domains enable row level security;
alter table public.owners enable row level security;
alter table public.rules_versions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.photos enable row level security;
alter table public.estimates enable row level security;
alter table public.leads enable row level security;
alter table public.events enable row level security;
alter table public.judge_results enable row level security;

-- Is the logged-in user an owner of this client?
-- security definer so it can read owners even though owners itself is locked down.
create or replace function public.is_owner_of(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.owners o
    where o.client_id = target_client
      and o.user_id = auth.uid()
  );
$$;

revoke all on function public.is_owner_of(uuid) from public, anon;
grant execute on function public.is_owner_of(uuid) to authenticated;

-- Read policies, owners only.
create policy "owners read their client" on public.clients
  for select to authenticated using (public.is_owner_of(id));

create policy "owners read their domains" on public.client_domains
  for select to authenticated using (public.is_owner_of(client_id));

create policy "owners read their own link" on public.owners
  for select to authenticated using (user_id = (select auth.uid()));

create policy "owners read their rules" on public.rules_versions
  for select to authenticated using (public.is_owner_of(client_id));

create policy "owners read their conversations" on public.conversations
  for select to authenticated using (public.is_owner_of(client_id));

create policy "owners read their leads" on public.leads
  for select to authenticated using (public.is_owner_of(client_id));

create policy "owners read their events" on public.events
  for select to authenticated using (public.is_owner_of(client_id));

-- Child tables reach the client through their conversation.
create policy "owners read their messages" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and public.is_owner_of(c.client_id)
    )
  );

create policy "owners read their photos" on public.photos
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = photos.conversation_id and public.is_owner_of(c.client_id)
    )
  );

create policy "owners read their estimates" on public.estimates
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = estimates.conversation_id and public.is_owner_of(c.client_id)
    )
  );

create policy "owners read their judge results" on public.judge_results
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = judge_results.conversation_id and public.is_owner_of(c.client_id)
    )
  );

-- Nothing is readable or writable without a login and an owners row.
revoke all on all tables in schema public from anon;
