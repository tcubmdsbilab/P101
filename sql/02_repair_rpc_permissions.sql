-- P101 點閱數系統：RPC / RLS 修正版
-- 若前一版出現「點閱數更新失敗」，請整段執行。

-- 0. 確認必要資料存在
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

-- 1. 重新建立 RPC 函數
-- 重點：
-- 1) SECURITY DEFINER：由函數擁有者執行 update / insert。
-- 2) 點閱事件寫入若失敗，不讓整個 counter 更新失敗。
-- 3) 回傳欄位名稱與前端一致。
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
  update public."TblP101ViewCounters" as c
  set view_count = c.view_count + 1
  where c.counter_key = p_counter_key
  returning * into v_counter;

  if not found then
    raise exception 'P101 counter key does not exist: %', p_counter_key;
  end if;

  begin
    insert into public."TblP101ViewEvents"
      (counter_key, target_type, project_code, version_code, session_id, referrer)
    values
      (v_counter.counter_key, v_counter.target_type, v_counter.project_code, v_counter.version_code, p_session_id, p_referrer);
  exception when others then
    -- 不讓事件紀錄問題影響前台點閱數更新。
    null;
  end;

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

-- 2. 權限與 RLS
alter table public."TblP101ViewCounters" enable row level security;
alter table public."TblP101ViewEvents" enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public."TblP101ViewCounters" to anon, authenticated;
grant execute on function public.p101_increment_counter(text, text, text) to anon, authenticated;

-- 允許公開讀取 counter。
drop policy if exists "P101 counters are publicly readable" on public."TblP101ViewCounters";
create policy "P101 counters are publicly readable"
on public."TblP101ViewCounters"
for select
to anon, authenticated
using (true);

-- 保留事件表寫入 policy，避免日後函數擁有者或 RLS 設定差異造成 insert 被擋。
drop policy if exists "P101 events can be inserted by public" on public."TblP101ViewEvents";
create policy "P101 events can be inserted by public"
on public."TblP101ViewEvents"
for insert
to anon, authenticated
with check (true);

grant insert on public."TblP101ViewEvents" to anon, authenticated;
grant usage, select on sequence public."TblP101ViewEvents_id_seq" to anon, authenticated;

-- 3. SQL Editor 內部測試：應回傳一列資料，且 view_count 增加。
select * from public.p101_increment_counter('P101_MAIN_PAGE', 'sql-test', 'sql-editor-test');

-- 4. 檢查函數是否存在與可見。
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'p101_increment_counter';
