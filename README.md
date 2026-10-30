# 招財貓接財氣

泥研製所官網外嵌小遊戲。左右移動招財貓接金幣和百元鈔、躲炸彈，玩完留下 Email 領 95 折優惠碼。

## 檔案

| 路徑 | 用途 |
|---|---|
| `public/` | 遊戲網頁（index.html、素材） |
| `functions/api/claim.js` | 收 Email、存進 D1、回傳優惠碼 |
| `functions/api/leads.js` | 下載 Email 名單 CSV：`/api/leads?key=管理密碼` |
| `schema.sql` | D1 資料表 `game_leads` |
| `wrangler.toml` | Pages 設定：D1 綁定（DB → game）、優惠碼 `COUPON_CODE` |
| `官網嵌入碼.html` | 貼到 SHOPLINE「自訂 HTML」的 iframe |

## 部署

推到 GitHub `main` 分支，Cloudflare Pages 會自動部署。

- 換優惠碼：改 `wrangler.toml` 的 `COUPON_CODE`，推上去
- 管理密碼 `ADMIN_KEY`：在 Cloudflare 後台 Pages 專案 → Settings → Variables and Secrets 加一個 Secret，不要寫進程式碼
- 第一次上線前建立資料表：`wrangler d1 execute game --remote --file=schema.sql`

## 本機測試

```
wrangler d1 execute game --local --file=schema.sql
wrangler pages dev
```
建 `.dev.vars` 放 `ADMIN_KEY=隨便一組`，就能在本機下載名單。
