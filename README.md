# P101 智慧商情研究室入口網站

本 ZIP 為 **P101 智慧商情研究室入口網站**完整部署包，適合放置於 GitHub Pages，並以 Supabase 儲存各作品版本的點閱數。

## 一、網站資訊

- 中文名稱：智慧商情研究室
- 英文名稱：Smart Business Intelligence Lab (SBI Lab)
- 單位英文正式名稱：Department of Business Management, Tzu Chi University
- 標語：Learn. Analyze. Innovate.
- 風格：美式專業智庫風 + 復古學術風

## 二、學生作品

目前包含：

1. P101 校園空間查詢系統：https://liu-ming-yi.github.io/CampusMap01
   - 協助新生、訪客與校內成員快速查詢校園空間資訊，作為經營管理與空間服務設計的學生專題成果。
   - 歷史版本：目前為第一版
2. P104 WhisperTour：https://bagilu.github.io/P104/
   - 用於須小聲導覽的空間。導遊和遊客都使用自己的手機，掃描 QRCode 即可開始連線導覽。
   - 歷史版本：目前為第一版
3. P02 腦力激盪系統：https://bagilu.github.io/P02V3/
   - 教師可隨時出題，請同學回答，教師可依需求選擇同學匿名或顯示姓名，降低同學的發言壓力。
   - 歷史版本：目前為第一版

## 三、檔案結構

```text
P101_sbi_lab_portal_v6_list/
├─ index.html
├─ config.sample.js
├─ assets/
│  ├─ css/styles.css
│  └─ js/app.js
├─ sql/
│  └─ 01_reset_create_P101_tables.sql
├─ edge-functions/
│  └─ P101_increment_counter/index.ts
├─ docs/
│  ├─ SYSTEM_SPECIFICATION.md
│  └─ SETUP_STEPS.md
└─ README.md
```

## 四、重要規則

1. 資料表名稱以 `P101_` 開頭。
2. Edge Function 名稱以 `P101_` 開頭。
3. 前端使用 `config.js` 儲存 Supabase URL 與 anon key。
4. ZIP 只提供 `config.sample.js`，避免覆蓋既有 `config.js`。
5. Edge Function 採 Supabase Dashboard 手動貼上方式，不使用 CLI、不使用 npx deploy、不使用 `_shared`。

## 五、部署摘要

1. Supabase SQL Editor 執行 `sql/01_reset_create_P101_tables.sql`。
2. Supabase Dashboard 建立 Edge Function：`P101_increment_counter`。
3. 將 `edge-functions/P101_increment_counter/index.ts` 全文貼入 Function。
4. 將 `config.sample.js` 複製成 `config.js`，填入 Supabase URL 與 anon key。
5. 將網站檔案上傳 GitHub Pages。

詳細流程請見：`docs/SETUP_STEPS.md`。
