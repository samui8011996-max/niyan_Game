// GET /api/leads?key=管理密碼  下載 email 名單（CSV，Excel 直接開）
// 沒設定 ADMIN_KEY 或密碼錯誤一律回 404。

const GAME = { catch: '招財貓接財氣', xmas: '聖誕胖胖貓送禮',zodiac: '星座配對', guess: '猜猜我是誰', other: '其他' };

const fmt = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

// 加引號；開頭是 = + - @ 的加單引號，避免 Excel 當成公式
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return new Response('Not found', { status: 404 });

  const { results } = await env.DB.prepare(
    'SELECT email, game, score, src, created_at FROM game_leads ORDER BY created_at DESC'
  ).all();

  const rows = [
    ['Email', '遊戲', '最高分', '來源', '領取時間'],
    ...results.map((r) => [r.email, GAME[r.game] || r.game, r.score, r.src, fmt.format(r.created_at)]),
  ];
  const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="game-leads.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
