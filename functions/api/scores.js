// 排行榜
// GET  /api/scores?game=xmas&pid=玩家ID   → 前 10 名，加上自己的名次
// POST /api/scores { game, pid, nick, score } → 上榜（每位玩家每款遊戲只留最高分）
// 分數是前端送來的，只做基本把關；有人亂灌分數，到 D1 的 game_scores 刪掉那筆即可。

const MAX = { xmas: 30000, catch: 20000 };   // 一局理論上拿不到的分數，超過就擋
const PID_RE = /^[a-z0-9-]{8,40}$/;
const TOP = 10;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

async function board(db, game, pid) {
  const { results } = await db
    .prepare('SELECT player_id, nick, score FROM game_scores WHERE game = ?1 ORDER BY score DESC, updated_at ASC LIMIT ?2')
    .bind(game, TOP)
    .all();
  const top = results.map((r) => ({ nick: r.nick, score: r.score, me: r.player_id === pid }));
  let me = null;
  if (pid) {
    const row = await db
      .prepare(
        `SELECT s.score, s.nick,
           (SELECT COUNT(*) FROM game_scores o WHERE o.game = s.game AND o.score > s.score) + 1 AS rank
         FROM game_scores s WHERE s.game = ?1 AND s.player_id = ?2`
      )
      .bind(game, pid)
      .first();
    if (row) me = { nick: row.nick, score: row.score, rank: row.rank };
  }
  return { top, me };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const game = url.searchParams.get('game');
  if (!MAX[game]) return json({ ok: false, error: '沒有這個遊戲' }, 400);
  const pid = PID_RE.test(url.searchParams.get('pid') || '') ? url.searchParams.get('pid') : '';
  return json({ ok: true, ...(await board(env.DB, game, pid)) });
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
  if (!PID_RE.test(body.pid || '')) return json({ ok: false, error: '請重新整理再試一次' }, 400);

  // 暱稱：去掉控制字元和 < >，最多 10 個字
  const nick = [...String(body.nick || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim()].slice(0, 10).join('');
  if (!nick) return json({ ok: false, error: '請輸入暱稱' }, 400);

  const score = Math.floor(Number(body.score));
  if (!Number.isFinite(score) || score < 0 || score > MAX[game]) return json({ ok: false, error: '分數怪怪的，請再玩一次' }, 400);

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO game_scores (game, player_id, nick, score, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT(game, player_id) DO UPDATE SET
       nick = excluded.nick,
       updated_at = CASE WHEN excluded.score > score THEN excluded.updated_at ELSE updated_at END,
       score = MAX(score, excluded.score)`
  )
    .bind(game, body.pid, nick, score, now)
    .run();

  return json({ ok: true, ...(await board(env.DB, game, body.pid)) });
}
