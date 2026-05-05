# SBI Lab P101 Counter Website v4 Clean

本套件是「智慧商情研究室 Smart Business Intelligence Lab」入口網站的乾淨重建版本，包含 GitHub Pages 前端、Supabase SQL、點閱數 RPC 與系統說明。

## 檔案結構

```text
sbi_lab_p101_clean_v4/
├─ index.html
├─ config.example.js
├─ assets/
│  ├─ styles.css
│  └─ app.js
├─ sql/
│  └─ 01_reset_and_create_p101_counter.sql
└─ docs/
   └─ SYSTEM_SPECIFICATION.md
```

## 安裝步驟

1. 到 Supabase SQL Editor 執行：
   `sql/01_reset_and_create_p101_counter.sql`

2. 將 `config.example.js` 複製成 `config.js`。

3. 在 `config.js` 填入：

```js
window.SBI_CONFIG = {
  SUPABASE_URL: "https://你的專案代碼.supabase.co",
  SUPABASE_ANON_KEY: "你的 anon public key"
};
```

4. 將整個資料夾內容上傳到 GitHub repository。

5. GitHub Pages 啟用 main branch / root。

## 目前 P101 版本

- P101_MAIN_PAGE：智慧商情研究室入口主頁點閱
- P101_V01：歷史版本，暫無外部網址
- P101_V02：最新版本，連至 https://liu-ming-yi.github.io/CampusMap01

## 重要原則

- 前端只放 Supabase anon key，不可放 service_role key。
- 點閱累加透過 RPC：`p101_increment_counter(p_counter_key, p_referrer, p_session_id)`。
- 前端使用的資料表是 `TblP101Counters`。
- 事件紀錄資料表是 `TblP101Events`。
- 本版 SQL 會刪除舊版 `TblP101ViewCounters`、`TblP101ViewEvents` 等可能殘留的舊表。
