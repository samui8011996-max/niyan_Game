// GET /share?score=1234  給 LINE、FB 等抓分享預覽用的頁面：標題寫分數，附雪橇貓大圖，真人打開會直接跳去遊戲。
// 預覽圖是固定的 /assets/og-xmas.jpg，分數只放在標題裡（社群網站的預覽圖不吃即時產生的 SVG）。

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const score = Math.max(0, Math.min(1000000, Math.floor(Number(url.searchParams.get('score')) || 0)));
  const title = score > 0 ? `我在聖誕胖胖貓送禮拿到 ${score} 分！換你來挑戰` : '聖誕胖胖貓送禮｜換你來挑戰';
  const desc = '坐上雪橇把禮物丟進煙囪，越送越快，看你能撐多久！玩完還能領泥研製所官網會員 95 折優惠碼。';
  const image = `${url.origin}/assets/og-xmas.jpg`;
  const target = `/?vs=${score}&src=share`;

  const html = `<!doctype html>
<html lang="zh-Hant"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url.origin}/share?score=${score}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${target}">
</head><body style="background:#34414B;color:#FFFDF8;font-family:sans-serif;text-align:center;padding:40px">
<p>正在前往遊戲…</p><p><a href="${target}" style="color:#F6D57A">沒有自動跳轉請點這裡</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
