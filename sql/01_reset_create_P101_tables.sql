-- P101 智慧商情研究室入口網站：點閱計數資料庫重建 SQL
-- 目的：刪除舊版 P101 點閱資料表與 RPC，重新建立乾淨一致的 schema。
-- 注意：本 SQL 會刪除既有 P101 點閱資料，請確認後再執行。

begin;

drop function if exists public."P101_increment_counter"(text, text, text, text);
drop function if exists public.p101_increment_counter(text, text, text);
drop table if exists public."P101_ViewEvents" cascade;
drop table if exists public."P101_ViewCounters" cascade;
drop table if exists public."TblP101ViewEvents" cascade;
drop table if exists public."TblP101ViewCounters" cascade;

create table public."P101_ViewCounters" (
  counter_key text primary key,
  project_code text not null,
  version_code text,
  target_type text not null check (target_type in ('page', 'version')),
  title text not null,
  target_url text,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public."P101_ViewEvents" (
  id bigserial primary key,
  counter_key text not null references public."P101_ViewCounters"(counter_key) on delete cascade,
  target_type text not null check (target_type in ('page', 'version')),
  referrer text,
  session_id text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

insert into public."P101_ViewCounters"
(counter_key, project_code, version_code, target_type, title, target_url)
values
('P101_MAIN_PAGE', 'P101', null, 'page', '智慧商情研究室主網頁', null),
('P101_V01', 'P101', 'V01', 'version', 'P101 校園空間查詢系統', 'https://liu-ming-yi.github.io/CampusMap01'),
('P104_V01', 'P104', 'V01', 'version', 'P104 WhisperTour', 'https://bagilu.github.io/P104/'),
('P02_V01', 'P02', 'V01', 'version', 'P02 腦力激盪系統', 'https://bagilu.github.io/P02V3/')
on conflict (counter_key) do nothing;

alter table public."P101_ViewCounters" enable row level security;
alter table public."P101_ViewEvents" enable row level security;

drop policy if exists "P101 public can read counters" on public."P101_ViewCounters";
create policy "P101 public can read counters"
on public."P101_ViewCounters"
for select
to anon, authenticated
using (true);

-- Events 不開放 public 直接 insert；由 Edge Function 以 service role 寫入。
-- 如需除錯，可在 Supabase Table Editor 檢查 P101_ViewEvents。

grant usage on schema public to anon, authenticated;
grant select on public."P101_ViewCounters" to anon, authenticated;

commit;
