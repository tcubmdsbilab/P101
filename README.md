# P101 好玩實驗室入口網站 v8

本 ZIP 為 **P101 好玩實驗室／智慧商情研究室入口網站**完整部署包，適合放置於 GitHub Pages，並以 Supabase 儲存學生作品、作品版本與點閱數。

## 一、網站定位

- 主標題：好玩實驗室
- 副標：來打造一個可參訪的好玩實驗室吧
- 正式名稱：智慧商情研究室
- 英文名稱：Smart Business Intelligence Lab (SBI Lab)
- 單位英文正式名稱：Department of Business Management, Tzu Chi University
- 風格：創創基地風；以柔光、米白、淺藍綠、淡黃色、教育共創空間感為主要視覺語言。

## 二、本版主要更新

1. 主標題改為「好玩實驗室」。
2. 「學生作品」區塊移到「智慧商情研究室目標」之前。
3. 學生作品資料庫化：作品名稱、簡介、歷史版本、最新版連結、點閱 counter key 都由 Supabase 資料表讀取。
4. 保留點閱數系統與 Edge Function 架構。
5. ZIP 仍完整包含網頁、SQL、Edge Function、文件，方便版本控制。

## 三、檔案結構

```text
P101_sbi_lab_portal_v8_db_projects/
├─ index.html
├─ config.sample.js
├─ assets/
│  ├─ css/styles.css
│  ├─ js/app.js
│  └─ img/innobase-poster.jpg
├─ sql/
│  └─ 01_reset_create_P101_tables.sql
├─ edge-functions/
│  └─ P101_increment_counter/index.ts
├─ docs/
│  ├─ SYSTEM_SPECIFICATION.md
│  └─ SETUP_STEPS.md
└─ README.md
```

## 四、重要部署規則

1. 資料表名稱以 `P101_` 開頭。
2. Edge Function 名稱以 `P101_` 開頭。
3. 前端使用 `config.js` 儲存 Supabase URL 與 anon key。
4. 本 ZIP 只提供 `config.sample.js`，避免覆蓋既有 `config.js`。
5. Edge Function 採 Supabase Dashboard 手動貼上方式，不使用 CLI、不使用 npx deploy、不使用 `_shared`。
