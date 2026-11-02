// 排行榜
// GET  /api/scores?game=xmas&email=...   → 前 10 名，加上自己的名次
// POST /api/scores { game, email, score } → 更新最高分（email 要先在遊戲裡留過，也就是在 game_leads 裡）
// 分數是前端送來的，只做基本把關；有人亂灌分數，到 D1 的 game_scores 刪掉那筆即可。

import { MAX, EMAIL_RE, saveScore, board } from '../../lib/scores.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const cleanEmail = (v) => {
  const e = String(v || '').trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : '';
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const game = url.searchParams.get('game');
  if (!MAX[game]) return json({ ok: false, error: '沒有這個遊戲' }, 400);
  return json({ ok: true, ...(await board(env.DB, game, cleanEmail(url.searchParams.get('email')))) });
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

  const email = cleanEmail(body.email);
  if (!email) return json({ ok: false, error: '請輸入正確的 Email' }, 400);
  const known = await env.DB.prepare('SELECT 1 FROM game_leads WHERE email = ?1').bind(email).first();
  if (!known) return json({ ok: false, error: '請先留下 Email' }, 403);

  const score = Math.floor(Number(body.score));
  if (!Number.isFinite(score) || score < 0 || score > MAX[game]) return json({ ok: false, error: '分數怪怪的，請再玩一次' }, 400);

  await saveScore(env.DB, game, email, score);
  return json({ ok: true, ...(await board(env.DB, game, email)) });
}
