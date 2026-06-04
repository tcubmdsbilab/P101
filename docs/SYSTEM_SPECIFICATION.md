# P101 v8 系統規格書

## 1. 系統名稱

P101 好玩實驗室入口網站

## 2. 系統目的

建立一個可參訪、可展示、可累積學生作品的研究室入口網站。網站以 GitHub Pages 作為靜態前端，以 Supabase 作為資料庫與點閱數後端。

## 3. 前端功能

### 3.1 首頁標題

- 主標題：好玩實驗室
- 副標：來打造一個可參訪的好玩實驗室吧
- 第二層正式名稱：智慧商情研究室 / Smart Business Intelligence Lab (SBI Lab)

### 3.2 學生作品區

學生作品區由資料庫動態載入，包含：

- 專案編號
- 作品名稱
- 作品超連結
- 點閱數
- 作品簡介
- 歷史版本
- 各版本連結與點閱數

### 3.3 研究室目標區

靜態顯示五項研究室目標。

## 4. 資料庫設計

### 4.1 `P101_Projects`

儲存學生作品主資料。

主要欄位：

- `project_code`
- `project_name`
- `short_description`
- `history_label`
- `sort_order`
- `is_active`

### 4.2 `P101_ProjectVersions`

儲存作品版本資料。

主要欄位：

- `version_key`
- `project_code`
- `version_code`
- `version_label`
- `version_note`
- `target_url`
- `counter_key`
- `is_latest`
- `sort_order`
- `is_active`

### 4.3 `P101_ViewCounters`

儲存點閱數彙總。

主要欄位：

- `counter_key`
- `project_code`
- `version_key`
- `target_type`
- `title`
- `target_url`
- `view_count`

### 4.4 `P101_ViewEvents`

儲存每次點擊事件紀錄。

主要欄位：

- `id`
- `counter_key`
- `target_type`
- `referrer`
- `session_id`
- `user_agent`
- `ip_address`
- `created_at`

## 5. Edge Function

Function 名稱：

```text
P101_increment_counter
```

支援 actions：

- `list_projects`：讀取啟用中的學生作品、版本與點閱數。
- `list_counters`：讀取點閱數。
- `increment`：累加指定 counter。

## 6. 安全設計

- 前端只放 anon key。
- 寫入點閱數與事件紀錄由 Edge Function 使用 service role 執行。
- `P101_ViewEvents` 不開放 public 直接 insert。
- RLS 啟用於所有 P101 資料表。
