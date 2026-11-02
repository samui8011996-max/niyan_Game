// 排行榜共用：claim.js（留 Email 時順便登錄分數）和 scores.js 都會用到
// 每個 email 每款遊戲只留最高分；排行榜上只顯示打碼的 email

export const MAX = { xmas: 30000, catch: 20000 };   // 一局理論上拿不到的分數，超過就不記
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOP = 10;

// artevorona@gmail.com → ar***
export function mask(email) {
  const local = [...email.split('@')[0]];
  return local.slice(0, local.length <= 2 ? 1 : 2).join('') + '***';
}

export async function saveScore(db, game, email, score) {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO game_scores (game, player_id, nick, score, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT(game, player_id) DO UPDATE SET
         updated_at = CASE WHEN excluded.score > score THEN excluded.updated_at ELSE updated_at END,
         score = MAX(score, excluded.score)`
    )
    .bind(game, email, mask(email), score, now)
    .run();
}

export async function board(db, game, email) {
  const { results } = await db
    .prepare('SELECT player_id, nick, score FROM game_scores WHERE game = ?1 ORDER BY score DESC, updated_at ASC LIMIT ?2')
    .bind(game, TOP)
    .all();
  const top = results.map((r) => ({ nick: r.nick, score: r.score, me: r.player_id === email }));
  let me = null;
  if (email) {
    const row = await db
      .prepare(
        `SELECT s.score,
           (SELECT COUNT(*) FROM game_scores o WHERE o.game = s.game AND o.score > s.score) + 1 AS rank
         FROM game_scores s WHERE s.game = ?1 AND s.player_id = ?2`
      )
      .bind(game, email)
      .first();
    if (row) me = { score: row.score, rank: row.rank };
  }
  return { top, me };
}
