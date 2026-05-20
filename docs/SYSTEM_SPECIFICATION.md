# P101 智慧商情研究室入口網站 System Specification

## 1. Project Identification

- Project Code: P101
- System Name: 智慧商情研究室入口網站
- English Name: Smart Business Intelligence Lab Portal
- Institutional Unit: Department of Business Management, Tzu Chi University
- Deployment Model: GitHub Pages + Supabase

## 2. Design Style

本版採用兩種風格整合：

1. 美式專業智庫風：深藍主色、嚴謹版面、政策報告式標題、穩重資訊層級。
2. 復古學術風：襯線字體、紙張質感、金棕輔色、研究室／檔案館式視覺語彙。

## 3. Functional Scope

### 3.1 Static Portal

首頁包含：

- 研究室名稱
- 英文名稱
- 標語
- 所屬單位
- 研究室目標
- 學生作品條列清單

### 3.2 Student Project List

學生作品採條列式呈現，適合後續作品數量增加。每個作品項目包含：

- 專案編號
- 專案名稱，可直接超連結至目前展示版
- 點閱數
- 簡介
- 歷史版本；使用 HTML details/summary，點選後才展開

### 3.3 View Counter

計數對象：

- 主網頁：`P101_MAIN_PAGE`
- 各作品版本，例如：`P101_V01`、`P104_V01`、`P02_V01`

主網頁載入後自動累計主頁點閱。使用者點擊作品名稱或版本連結時，先呼叫 Edge Function 更新點閱數，再開啟目標網站。

## 4. Database Design

### 4.1 `P101_ViewCounters`

用途：儲存各 counter 目前累計值。

主要欄位：

- `counter_key`: counter 主鍵，例如 `P101_MAIN_PAGE`
- `project_code`: 專案代號
- `version_code`: 版本代號，可為 null
- `target_type`: `page` 或 `version`
- `title`: 顯示名稱
- `target_url`: 連結網址
- `view_count`: 累計點閱數
- `created_at`, `updated_at`: 建立與更新時間

### 4.2 `P101_ViewEvents`

用途：保留每次點閱事件紀錄，方便後續分析。

主要欄位：

- `id`: 流水號
- `counter_key`: 對應 `P101_ViewCounters`
- `target_type`: `page` 或 `version`
- `referrer`: 來源頁
- `session_id`: 前端產生的匿名 session id
- `user_agent`: 瀏覽器資訊
- `ip_address`: Edge Function 取得的 IP
- `created_at`: 點閱時間

## 5. Security Model

- `P101_ViewCounters`：允許 public select，供首頁顯示點閱數。
- `P101_ViewEvents`：不開放 public insert，由 Edge Function 使用 service role 寫入。
- 前端只放 anon public key，不放 service_role key。
- Edge Function 使用 Supabase 內建環境變數 `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY`。

## 6. Edge Function

- Function Name: `P101_increment_counter`
- Deployment Method: Supabase Dashboard manual paste
- No shared folder
- No CLI
- No npx deploy

支援 action：

1. `list_counters`: 讀取所有 counter。
2. `increment`: 更新指定 counter 並寫入事件紀錄。

## 7. Frontend Configuration

正式部署時需將：

```text
config.sample.js → config.js
```

並填入：

```js
window.P101_CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-public-key",
  COUNTER_FUNCTION: "P101_increment_counter"
};
```

## 8. Versioning Rule

後續若新增版本，需同步修改：

1. `assets/js/app.js` 的 `projects` 陣列。
2. `sql/01_reset_create_P101_tables.sql` 的 seed data。
3. 若使用既有資料庫且不想清空點閱數，請另外以 insert 方式補入新 counter，而不要執行 reset SQL。

若只新增一個作品或版本，不一定要 reset 全部資料；可另寫 insert SQL。但本 ZIP 為乾淨重建版，因此 SQL 會刪除舊表重建。


## 9. Current Student Works in This Version

- P101 校園空間查詢系統：`P101_V01`
- P104 WhisperTour：`P104_V01`
- P02 腦力激盪系統：`P02_V01`
