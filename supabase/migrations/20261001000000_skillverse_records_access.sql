-- Application records are accessed only by the server after Auth verification.
-- This preserves existing records and closes direct browser access to the KV table.
create table if not exists public.kv_store_6593f319 (
  key text primary key,
  value jsonb not null
);
alter table public.kv_store_6593f319 enable row level security;
revoke all on table public.kv_store_6593f319 from public, anon, authenticated;
grant all on table public.kv_store_6593f319 to service_role;
