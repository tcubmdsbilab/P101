# 智慧商情研究室入口網站 P101 點閱數系統說明書 v4 Clean

## 1. 系統目的

本系統用於建立「智慧商情研究室 Smart Business Intelligence Lab」入口網站，並展示學生作品。第一個學生作品為 P101 校園空間查詢系統。系統支援主頁點閱數與各版本點閱數統計。

## 2. 網站內容

首頁大標題：

- 智慧商情研究室
- Smart Business Intelligence Lab (SBI Lab)
- Learn. Analyze. Innovate.
- 慈濟大學 經營管理學系
- 來打造一個可參訪的好玩實驗室吧

研究室目標：

1. 管理智慧商情研究室
2. 管理智慧商店設備
3. 設計開發商情專案，管理商情伺服器
4. 協助經營管理學系專題製作或相關課程
5. 參與智慧商情相關計畫或研究

學生作品：

- P101 校園空間查詢系統
- V01：歷史版本，保留展示
- V02：最新版本，主要連結為 https://liu-ming-yi.github.io/CampusMap01

## 3. 設計風格

本版採用淡藍色系為主，搭配少量淡棕黃作為溫暖輔色。整體風格希望比前一版更明亮、活潑、可參訪，適合作為學生專題與研究室入口展示頁。

## 4. 前端技術

- 純 HTML / CSS / JavaScript
- 可部署於 GitHub Pages
- 使用 Supabase JS v2 CDN
- 前端設定檔為 `config.js`

## 5. Supabase 資料庫設計

### 5.1 TblP101Counters

用途：儲存每一個可計數目標的累計點閱數。

欄位：

- counter_key：主鍵，例如 P101_MAIN_PAGE、P101_V01、P101_V02
- project_code：固定為 P101
- target_type：page 或 version
- version_code：版本代號，例如 V01、V02；主頁為 NULL
- target_title：顯示名稱
- target_url：版本外部網址
- view_count：累計點閱數
- created_at：建立時間
- updated_at：更新時間

### 5.2 TblP101Events

用途：記錄每一次點閱事件，方便未來分析。

欄位：

- id：流水號
- counter_key：對應 TblP101Counters.counter_key
- project_code：固定為 P101
- target_type：page 或 version
- version_code：版本代號
- referrer：來源網址
- session_id：前端 localStorage 產生的匿名 session id
- user_agent：保留欄位，本版未由前端寫入
- clicked_at：點閱時間

## 6. RPC 設計

前端只呼叫一個 RPC：

```text
p101_increment_counter(p_counter_key text, p_referrer text, p_session_id text)
```

功能：

1. 檢查 counter_key 是否存在。
2. 將 TblP101Counters.view_count 加 1。
3. 將事件寫入 TblP101Events。
4. 回傳更新後的 counter_key 與 view_count。

## 7. RLS 與權限

- TblP101Counters：允許 anon / authenticated SELECT。
- TblP101Events：不開放直接 INSERT；事件寫入由 SECURITY DEFINER RPC 執行。
- RPC p101_increment_counter：授權 anon / authenticated 執行。

此設計避免前端直接任意寫入事件表，同時保留公開網站可累計點閱數的便利性。

## 8. 前端點閱邏輯

頁面載入時：

1. 初始化 Supabase client。
2. 自動呼叫 RPC 累加 P101_MAIN_PAGE。
3. 讀取 P101_MAIN_PAGE、P101_V01、P101_V02 的目前點閱數。

使用者點擊 V01 / V02 時：

1. 攔截點擊。
2. 呼叫 RPC 累加該版本的 counter_key。
3. 更新頁面點閱數。
4. 如果該版本有外部網址，開啟新分頁。

## 9. 除錯訊息

頁面下方會顯示狀態訊息，例如：

- SBI Lab counter v4 clean 已載入，正在連線 Supabase……
- 點閱數系統已正常連線。
- 點閱數初始化失敗：...
- 點閱數更新失敗：...

若出現錯誤，請優先檢查：

1. SQL 是否完整執行。
2. `config.js` 是否存在。
3. Supabase URL 是否為 `https://xxxx.supabase.co`，不可加 `/rest/v1`。
4. anon key 是否正確。
5. GitHub Pages 是否已更新到 v4 檔案。

## 10. 未來擴充方向

- 新增 P102、P103 等學生作品。
- 將作品資料改為由 Supabase 管理。
- 增加管理後台，讓教師或學生新增專案版本。
- 增加每月點閱統計與圖表。
- 增加作品頁面的版本時間軸。
