# P101 部署逐步操作指引

## Step 1：解壓縮 ZIP

解壓縮後應看到：

```text
P101_sbi_lab_portal_v6_list/
```

請保留此資料夾結構。

## Step 2：建立 Supabase 資料表

1. 登入 Supabase Dashboard。
2. 進入對應專案。
3. 開啟 SQL Editor。
4. 貼上並執行：

```text
sql/01_reset_create_P101_tables.sql
```

注意：此 SQL 會刪除舊的 P101 點閱表與相關舊表，並重新建立乾淨版本。

## Step 3：建立 Edge Function

1. 在 Supabase Dashboard 左側選單進入 Edge Functions。
2. 建立新 Function。
3. Function 名稱請填：

```text
P101_increment_counter
```

4. 將下列檔案內容完整貼入 Dashboard 編輯器：

```text
edge-functions/P101_increment_counter/index.ts
```

5. 儲存／部署 Function。

本專案不使用 CLI、不使用 `npx supabase functions deploy`、不使用 `_shared`。

## Step 4：確認 Edge Function 環境變數

Supabase Edge Function 通常可使用：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

如果 Dashboard 顯示缺少 service role key，請到 Supabase 的 Function Secrets 或 Project Settings 補上。

## Step 5：建立 config.js

在網站根目錄中，將：

```text
config.sample.js
```

複製成：

```text
config.js
```

並填入自己的 Supabase URL 與 anon key：

```js
window.P101_CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-public-key",
  COUNTER_FUNCTION: "P101_increment_counter"
};
```

注意：

- 可以放 anon public key。
- 不可放 service_role key。
- 之後重新產生 ZIP 時，只會提供 `config.sample.js`，避免覆蓋您原本的 `config.js`。

## Step 6：本機快速檢查

可直接用瀏覽器開啟 `index.html`。若瀏覽器阻擋本機 script，可改用 VS Code Live Server 或上傳 GitHub Pages 後測試。

## Step 7：部署到 GitHub Pages

1. 建立或開啟 GitHub repository。
2. 上傳下列檔案與資料夾：

```text
index.html
config.js
assets/
```

3. repository Settings → Pages。
4. Source 選擇 main branch。
5. 等待 GitHub Pages 更新。

GitHub Pages 更新通常需要數十秒，且瀏覽器可能有快取。若測試新版，建議使用無痕視窗。

## Step 8：測試點閱數

1. 開啟 GitHub Pages 網址。
2. 主頁點閱數應自動增加。
3. 點擊任一作品版本，例如 P101 V02。
4. 回到 Supabase Table Editor 檢查：

```text
P101_ViewCounters
P101_ViewEvents
```

應可看到點閱數增加與事件紀錄。

## Step 9：常見問題

### 1. 畫面顯示 config.js 找不到

請確認已將 `config.sample.js` 複製成 `config.js`。

### 2. 點閱數更新失敗：Missing SUPABASE_SERVICE_ROLE_KEY

請確認 Edge Function 可讀取 `SUPABASE_SERVICE_ROLE_KEY`。

### 3. 點閱數沒有更新

請確認：

- Function 名稱是 `P101_increment_counter`
- `config.js` 的 `COUNTER_FUNCTION` 也是 `P101_increment_counter`
- SQL 已成功建立 `P101_ViewCounters` 與 `P101_ViewEvents`

### 4. GitHub 更新後畫面還是舊版

請等待 30–60 秒，或使用無痕視窗測試。
