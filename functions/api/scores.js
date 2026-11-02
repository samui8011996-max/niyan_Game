// 排行榜
// GET  /api/scores?game=xmas              → 目前最高分（給客人看）
// GET  /api/scores?game=xmas&key=管理密碼  → 完整排行榜，含 email（給出貨幫手看，可跨網域讀）
// POST /api/scores { game, email, score } → 更新最高分（email 要先在遊戲裡留過，也就是在 game_leads 裡）
// 分數是前端送來的，只做基本把關；有人亂灌分數，到 D1 的 game_scores 刪掉那筆即可。

import { MAX, EMAIL_RE, saveScore, topScore, fullBoard, savePlay } from '../../lib/scores.js';

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const game = url.searchParams.get('game');
  const key = url.searchParams.get('key');

  if (key !== null) {
    // 出貨幫手放在別的網址，要允許跨網域讀取；沒有正確密碼一律回 404
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ ok: false, error: '管理密碼不對' }, 404, cors);
    if (!MAX[game]) return json({ ok: false, error: '沒有這個遊戲' }, 400, cors);
    return json({ ok: true, rows: await fullBoard(env.DB, game) }, 200, cors);
  }

  if (!MAX[game]) return json({ ok: false, error: '沒有這個遊戲' }, 400);
  return json({ ok: true, best: await topScore(env.DB, game) });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '資料格式錯誤' }, 400);
  }
  const game = body.game;
  if (!MAX[game]) return json({ ok: false, error: '沒有這個遊戲' }, 400);

  const email = String(body.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ ok: false, error: '請輸入正確的 Email' }, 400);
  const known = await env.DB.prepare('SELECT 1 FROM game_leads WHERE email = ?1').bind(email).first();
  if (!known) return json({ ok: false, error: '請先留下 Email' }, 403);

  const score = Math.floor(Number(body.score));
  if (!Number.isFinite(score) || score < 0 || score > MAX[game]) return json({ ok: false, error: '分數怪怪的，請再玩一次' }, 400);

  await saveScore(env.DB, game, email, score);
  await savePlay(env.DB, game, email, score);
  return json({ ok: true, best: await topScore(env.DB, game) });
}
