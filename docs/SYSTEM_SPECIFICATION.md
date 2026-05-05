# 智慧商情研究室入口網站 P101 點閱數系統說明書

## 1. 系統目的

本系統是「智慧商情研究室 Smart Business Intelligence Lab (SBI Lab)」入口網站的第一版雛形，重點功能包括：

1. 展示研究室名稱、理念與目標。
2. 展示學生作品。
3. 支援同一學生作品的多版本保存，例如 P101 V01、P101 V02。
4. 以最新版本作為主要入口，同時保留歷史版本連結。
5. 顯示主網頁點閱次數。
6. 顯示各版本連結被點閱的累計次數。

本版本採用 GitHub Pages 靜態網頁 + Supabase PostgreSQL 資料庫。

---

## 2. 技術架構

### 2.1 前端

- `index.html`：首頁。
- `assets/styles.css`：日式文青風格版面，主色為淺藍與淺棕黃。
- `assets/app.js`：專案資料、版本連結、點閱數讀取與累加邏輯。
- `config.js`：Supabase URL 與 anon key 設定檔。此檔需由 `config.example.js` 複製而來。

### 2.2 後端資料庫

使用 Supabase PostgreSQL，主要資料表如下：

1. `TblP101ViewCounters`
   - 保存每一個計數目標的累計點閱數。
   - 例如：主網頁、P101 V01、P101 V02。

2. `TblP101ViewEvents`
   - 保存每一次點閱事件。
   - 日後可用於分析點閱時間、來源、版本比較等。

3. `p101_increment_counter()`
   - Supabase RPC 函數。
   - 前端呼叫此函數進行點閱累加。
   - 使用 PostgreSQL update 原子累加，避免多人同時點擊時遺失計數。

---

## 3. 檔案結構

```text
sbi_lab_p101_counter/
├── index.html
├── config.example.js
├── assets/
│   ├── app.js
│   └── styles.css
├── sql/
│   └── 01_create_p101_counters.sql
└── docs/
    └── SYSTEM_SPECIFICATION.md
```

---

## 4. 安裝與部署步驟

### 4.1 建立 Supabase 資料表

1. 進入 Supabase 專案。
2. 打開 SQL Editor。
3. 貼上並執行：

```text
sql/01_create_p101_counters.sql
```

執行後會建立：

- `TblP101ViewCounters`
- `TblP101ViewEvents`
- `p101_increment_counter()`
- RLS policy 與必要權限

### 4.2 設定前端 config.js

將：

```text
config.example.js
```

複製為：

```text
config.js
```

並填入：

```javascript
window.SBI_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  COUNTER_RPC: "p101_increment_counter"
};
```

注意：

- `SUPABASE_ANON_KEY` 可放在 GitHub Pages。
- 不可把 `service_role key` 放到任何前端檔案。

### 4.3 部署到 GitHub Pages

1. 建立 GitHub repository。
2. 上傳整個資料夾內容。
3. 確認根目錄包含 `index.html`。
4. 到 repository 的 Settings → Pages。
5. Source 選擇 main branch。
6. 等待 GitHub Pages 產生網址。

---

## 5. 點閱數運作方式

### 5.1 主網頁點閱數

使用計數器：

```text
P101_MAIN_PAGE
```

當使用者進入首頁時，前端會呼叫：

```javascript
p101_increment_counter('P101_MAIN_PAGE')
```

資料庫會將主網頁的 `view_count` 加 1。

### 5.2 版本連結點閱數

目前 P101 有兩個版本：

| 專案 | 版本 | counter_key | URL |
|---|---|---|---|
| P101 | V01 | P101_VERSION_V01 | 尚未設定 |
| P101 | V02 | P101_VERSION_V02 | https://liu-ming-yi.github.io/CampusMap01 |

當使用者點選 V02 時，前端會先呼叫：

```javascript
p101_increment_counter('P101_VERSION_V02')
```

完成後再開啟外部連結。

---

## 6. 新增版本的方法

若未來新增 P101 V03，需要修改兩個地方。

### 6.1 SQL 新增 counter

```sql
insert into public."TblP101ViewCounters"
  (counter_key, label, target_type, project_code, version_code, target_url)
values
  ('P101_VERSION_V03', 'P101 校園空間查詢系統 V03 最新版', 'VERSION', 'P101', 'V03', 'https://your-v03-url')
on conflict (counter_key) do update set
  label = excluded.label,
  target_type = excluded.target_type,
  project_code = excluded.project_code,
  version_code = excluded.version_code,
  target_url = excluded.target_url;
```

### 6.2 修改 `assets/app.js`

在 `PROJECTS` 的 `versions` 陣列中新增：

```javascript
{ version: "V03", label: "最新版", url: "https://your-v03-url", counterKey: "P101_VERSION_V03" }
```

並將：

```javascript
latestVersion: "V02"
```

改為：

```javascript
latestVersion: "V03"
```

---

## 7. 資安與資料治理說明

本系統沒有登入功能，因此所有訪客都可以讀取累計點閱數。此設計適合公開展示網站。

但系統不允許前端直接 update 點閱累計表，而是透過 RPC 函數 `p101_increment_counter()` 進行累加。這樣做有三個好處：

1. 避免前端任意修改累計數。
2. 降低多人同時點擊時的計數錯誤。
3. 保留未來擴充事件分析的可能性。

目前事件表 `TblP101ViewEvents` 不開放公開讀取，避免未來擴充欄位後產生隱私疑慮。

---

## 8. 目前限制

1. 點閱數不是唯一訪客數，而是累計點擊次數。
2. 同一使用者重新整理首頁，主網頁點閱數仍會增加。
3. 若使用者阻擋 JavaScript，點閱數不會累加。
4. 若外部連結被瀏覽器阻擋彈出視窗，使用者可能需要允許新分頁。
5. V01 目前尚未設定正式 URL，因此點擊不會累加並開啟連結。

---

## 9. 後續建議

下一版可考慮：

1. 將學生作品資料移入 Supabase，由後台管理。
2. 建立 P101、P102、P103 等多專案通用表格。
3. 增加「年度／屆別／學生姓名／指導老師」欄位。
4. 增加圖像上傳與專案簡介頁。
5. 建立管理後台，讓老師或助理更新專案版本。
6. 區分 page view、link click、unique session view。
