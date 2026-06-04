# P101 v8 部署步驟

## 1. 執行 SQL

到 Supabase Dashboard → SQL Editor，執行：

```text
sql/01_reset_create_P101_tables.sql
```

注意：此 SQL 會刪除並重建 P101 相關資料表，既有點閱數會歸零。

## 2. 建立或更新 Edge Function

到 Supabase Dashboard → Edge Functions。

Function 名稱：

```text
P101_increment_counter
```

將以下檔案全文貼入：

```text
edge-functions/P101_increment_counter/index.ts
```

## 3. 設定 Edge Function Secrets

在 Supabase Edge Function 的 Secrets / Environment Variables 設定：

```text
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key
```

注意：`service_role key` 只能放在 Supabase Edge Function 環境變數，不可放到 GitHub。

## 4. 建立 config.js

將：

```text
config.sample.js
```

複製成：

```text
config.js
```

並填入：

```js
window.P101_CONFIG = {
  SUPABASE_URL: "https://你的專案.supabase.co",
  SUPABASE_ANON_KEY: "你的 anon public key",
  COUNTER_FUNCTION: "P101_increment_counter"
};
```

## 5. 上傳 GitHub Pages

將整個網站資料夾內容上傳到 GitHub Pages repository。

請確認包含：

```text
index.html
config.js
assets/
```

## 6. 日後新增學生作品

日後新增作品不需要修改網頁，只需在 Supabase 資料表新增資料：

1. 在 `P101_Projects` 新增作品主資料。
2. 在 `P101_ProjectVersions` 新增版本資料。
3. 在 `P101_ViewCounters` 新增對應 counter。

若忘記新增 counter，Edge Function 會自動建立基本 counter，但建議仍由資料表完整維護。
