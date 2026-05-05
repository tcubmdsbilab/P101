-- P101 點閱數系統初始化 SQL
-- 適用環境：Supabase PostgreSQL
-- 執行位置：Supabase Dashboard → SQL Editor

-- 1. 點閱累計表：每一個可被點閱的目標一筆資料
create table if not exists public."TblP101ViewCounters" (
  counter_key text primary key,
  label text not null,
  target_type text not null check (target_type in ('PAGE', 'VERSION')),
  project_code text,
  version_code text,
  target_url text,
  view_count bigint not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public."TblP101ViewCounters" is 'P101 主網頁與各版本連結的累計點閱數。';
comment on column public."TblP101ViewCounters".counter_key is '計數器唯一代碼，例如 P101_MAIN_PAGE、P101_VERSION_V02。';

-- 2. 點閱事件表：每一次點閱留下一筆紀錄，方便日後分析
create table if not exists public."TblP101ViewEvents" (
  id bigserial primary key,
  counter_key text not null references public."TblP101ViewCounters"(counter_key) on delete cascade,
  target_type text not null check (target_type in ('PAGE', 'VERSION')),
  project_code text,
  version_code text,
  session_id text,
  referrer text,
  created_at timestamptz not null default now()
);

comment on table public."TblP101ViewEvents" is 'P101 點閱事件紀錄。累計數以 TblP101ViewCounters 為準，此表供分析使用。';

-- 3. updated_at 自動更新 trigger
create or replace function public.p101_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_p101_view_counters_updated_at on public."TblP101ViewCounters";
create trigger trg_p101_view_counters_updated_at
before update on public."TblP101ViewCounters"
for each row execute function public.p101_set_updated_at();

-- 4. 初始化資料
insert into public."TblP101ViewCounters"
  (counter_key, label, target_type, project_code, version_code, target_url)
values
  ('P101_MAIN_PAGE', 'P101 主網頁', 'PAGE', 'P101', null, null),
  ('P101_VERSION_V01', 'P101 校園空間查詢系統 V01', 'VERSION', 'P101', 'V01', null),
  ('P101_VERSION_V02', 'P101 校園空間查詢系統 V02 最新版', 'VERSION', 'P101', 'V02', 'https://liu-ming-yi.github.io/CampusMap01')
on conflict (counter_key) do update set
  label = excluded.label,
  target_type = excluded.target_type,
  project_code = excluded.project_code,
  version_code = excluded.version_code,
  target_url = excluded.target_url;

-- 5. 原子化累加函數
-- 前端只呼叫此函數，不直接 update 表格，避免同時點擊造成計數遺失。
create or replace function public.p101_increment_counter(
  p_counter_key text,
  p_session_id text default null,
  p_referrer text default null
)
returns table (
  counter_key text,
  label text,
  target_type text,
  project_code text,
  version_code text,
  target_url text,
  view_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counter public."TblP101ViewCounters"%rowtype;
begin
  update public."TblP101ViewCounters" c
  set view_count = c.view_count + 1
  where c.counter_key = p_counter_key
  returning * into v_counter;

  if not found then
    raise exception 'Counter key % does not exist.', p_counter_key;
  end if;

  insert into public."TblP101ViewEvents"
    (counter_key, target_type, project_code, version_code, session_id, referrer)
  values
    (v_counter.counter_key, v_counter.target_type, v_counter.project_code, v_counter.version_code, p_session_id, p_referrer);

  return query
  select
    v_counter.counter_key,
    v_counter.label,
    v_counter.target_type,
    v_counter.project_code,
    v_counter.version_code,
    v_counter.target_url,
    v_counter.view_count;
end;
$$;

-- 6. RLS 與權限
alter table public."TblP101ViewCounters" enable row level security;
alter table public."TblP101ViewEvents" enable row level security;

-- 允許公開讀取累計數，方便首頁顯示。
drop policy if exists "P101 counters are publicly readable" on public."TblP101ViewCounters";
create policy "P101 counters are publicly readable"
on public."TblP101ViewCounters"
for select
to anon, authenticated
using (true);

-- 事件表不開放公開 select，避免日後若增加更多欄位時洩漏細節。
-- 前端透過 security definer function 寫入事件，不需要直接 insert policy。

grant usage on schema public to anon, authenticated;
grant select on public."TblP101ViewCounters" to anon, authenticated;
grant execute on function public.p101_increment_counter(text, text, text) to anon, authenticated;

-- 建議不要授權 anon 直接 update / insert 兩張表。
revoke insert, update, delete on public."TblP101ViewCounters" from anon;
revoke select, insert, update, delete on public."TblP101ViewEvents" from anon;
