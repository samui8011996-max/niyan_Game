# 泥研製所小遊戲

官網外嵌小遊戲，玩完留下 Email 領 95 折優惠碼。

- 根網址 `/`：聖誕胖胖貓送禮（看煙囪顏色丟紅／綠禮物）
- `/catch/`：招財貓接財氣（接金幣和百元鈔、躲炸彈）

## 檔案

| 路徑 | 用途 |
|---|---|
| `public/index.html` | 聖誕胖胖貓送禮（根網址） |
| `public/catch/index.html` | 招財貓接財氣 |
| `public/assets/` | 素材（招福貓、百元鈔） |
| `functions/api/claim.js` | 收 Email、存進 D1、回傳優惠碼 |
| `functions/api/leads.js` | 下載 Email 名單 CSV：`/api/leads?key=管理密碼` |
| `schema.sql` | D1 資料表 `game_leads` |
| `wrangler.toml` | Pages 設定：D1 綁定（DB → game）、優惠碼 `COUPON_CODE` |
| `官網嵌入碼_聖誕.html` | 聖誕遊戲，貼到 SHOPLINE「自訂 HTML」 |
| `官網嵌入碼.html` | 招財貓遊戲，貼到 SHOPLINE「自訂 HTML」 |

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
