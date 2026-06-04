-- P101 好玩實驗室／智慧商情研究室入口網站 v8
-- 學生作品資料庫化 + 點閱計數資料表重建 SQL
-- 注意：本 SQL 會刪除既有 P101 相關表格與點閱紀錄，請確認後再執行。

begin;

-- 1. 清除舊版 function 與資料表
-- Edge Function 本身不在 Postgres 內，不需於此刪除。
drop function if exists public."P101_increment_counter"(text, text, text, text);
drop function if exists public.p101_increment_counter(text, text, text);

drop table if exists public."P101_ViewEvents" cascade;
drop table if exists public."P101_ViewCounters" cascade;
drop table if exists public."P101_ProjectVersions" cascade;
drop table if exists public."P101_Projects" cascade;
drop table if exists public."TblP101ViewEvents" cascade;
drop table if exists public."TblP101ViewCounters" cascade;

-- 2. 學生作品主表
create table public."P101_Projects" (
  project_code text primary key,
  project_name text not null,
  short_description text not null,
  history_label text not null default '目前為第一版',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. 學生作品版本表
create table public."P101_ProjectVersions" (
  version_key text primary key,
  project_code text not null references public."P101_Projects"(project_code) on delete cascade,
  version_code text not null,
  version_label text not null,
  version_note text,
  target_url text not null,
  counter_key text not null unique,
  is_latest boolean not null default false,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_code, version_code)
);

-- 4. 點閱數彙總表
create table public."P101_ViewCounters" (
  counter_key text primary key,
  project_code text,
  version_key text references public."P101_ProjectVersions"(version_key) on delete set null,
  target_type text not null check (target_type in ('page', 'version')),
  title text not null,
  target_url text,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. 點閱事件紀錄表
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

create index "P101_ProjectVersions_project_code_idx" on public."P101_ProjectVersions"(project_code);
create index "P101_ProjectVersions_active_sort_idx" on public."P101_ProjectVersions"(is_active, sort_order);
create index "P101_ViewEvents_counter_key_created_idx" on public."P101_ViewEvents"(counter_key, created_at desc);

-- 6. 初始學生作品資料
insert into public."P101_Projects"
(project_code, project_name, short_description, history_label, sort_order, is_active)
values
('P101', '校園空間查詢系統', '協助新生、訪客與校內成員快速查詢校園空間資訊，作為經營管理與空間服務設計的學生專題成果。', '目前為第一版', 10, true),
('P104', 'WhisperTour', '用於須小聲導覽的空間。導遊和遊客都使用自己的手機，掃描 QRCode 即可開始連線導覽。', '目前為第一版', 20, true),
('P02', '腦力激盪系統', '教師可隨時出題，請同學回答，教師可依需求選擇同學匿名或顯示姓名，降低同學的發言壓力。', '目前為第一版', 30, true)
on conflict (project_code) do update set
  project_name = excluded.project_name,
  short_description = excluded.short_description,
  history_label = excluded.history_label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public."P101_ProjectVersions"
(version_key, project_code, version_code, version_label, version_note, target_url, counter_key, is_latest, sort_order, is_active)
values
('P101_V01', 'P101', 'V01', '目前為第一版', 'P101 校園空間查詢系統', 'https://liu-ming-yi.github.io/CampusMap01', 'P101_V01', true, 10, true),
('P104_V01', 'P104', 'V01', '目前為第一版', 'P104 WhisperTour', 'https://bagilu.github.io/P104/', 'P104_V01', true, 20, true),
('P02_V01', 'P02', 'V01', '目前為第一版', 'P02 腦力激盪系統', 'https://bagilu.github.io/P02V3/', 'P02_V01', true, 30, true)
on conflict (version_key) do update set
  project_code = excluded.project_code,
  version_code = excluded.version_code,
  version_label = excluded.version_label,
  version_note = excluded.version_note,
  target_url = excluded.target_url,
  counter_key = excluded.counter_key,
  is_latest = excluded.is_latest,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 7. 初始點閱 counter
insert into public."P101_ViewCounters"
(counter_key, project_code, version_key, target_type, title, target_url, view_count)
values
('P101_MAIN_PAGE', 'P101', null, 'page', '好玩實驗室主網頁', null, 0),
('P101_V01', 'P101', 'P101_V01', 'version', 'P101 校園空間查詢系統', 'https://liu-ming-yi.github.io/CampusMap01', 0),
('P104_V01', 'P104', 'P104_V01', 'version', 'P104 WhisperTour', 'https://bagilu.github.io/P104/', 0),
('P02_V01', 'P02', 'P02_V01', 'version', 'P02 腦力激盪系統', 'https://bagilu.github.io/P02V3/', 0)
on conflict (counter_key) do update set
  project_code = excluded.project_code,
  version_key = excluded.version_key,
  target_type = excluded.target_type,
  title = excluded.title,
  target_url = excluded.target_url,
  updated_at = now();

-- 8. RLS 與權限
alter table public."P101_Projects" enable row level security;
alter table public."P101_ProjectVersions" enable row level security;
alter table public."P101_ViewCounters" enable row level security;
alter table public."P101_ViewEvents" enable row level security;

drop policy if exists "P101 public can read active projects" on public."P101_Projects";
create policy "P101 public can read active projects"
on public."P101_Projects"
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "P101 public can read active versions" on public."P101_ProjectVersions";
create policy "P101 public can read active versions"
on public."P101_ProjectVersions"
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "P101 public can read counters" on public."P101_ViewCounters";
create policy "P101 public can read counters"
on public."P101_ViewCounters"
for select
to anon, authenticated
using (true);

-- Events 不開放 public 直接 insert；由 Edge Function 以 service role 寫入。

grant usage on schema public to anon, authenticated, service_role;
grant select on public."P101_Projects" to anon, authenticated;
grant select on public."P101_ProjectVersions" to anon, authenticated;
grant select on public."P101_ViewCounters" to anon, authenticated;
grant select, insert, update, delete on public."P101_Projects" to service_role;
grant select, insert, update, delete on public."P101_ProjectVersions" to service_role;
grant select, insert, update, delete on public."P101_ViewCounters" to service_role;
grant select, insert, update, delete on public."P101_ViewEvents" to service_role;
grant usage, select on sequence public."P101_ViewEvents_id_seq" to service_role;

commit;
