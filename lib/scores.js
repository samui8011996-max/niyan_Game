// 排行榜共用：claim.js（留 Email 時順便登錄分數）和 scores.js 都會用到
// 每個 email 每款遊戲只留最高分。客人只看得到「目前最高分」，完整排行榜要管理密碼（出貨幫手用）

export const MAX = { xmas: 30000, catch: 20000 };   // 一局理論上拿不到的分數，超過就不記
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// artevorona@gmail.com → ar***（後台列表用，方便一眼辨認）
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

// 客人看的：目前最高分（沒有人上榜時是 0）
export async function topScore(db, game) {
  const row = await db.prepare('SELECT MAX(score) AS s FROM game_scores WHERE game = ?1').bind(game).first();
  return row && row.s ? row.s : 0;
}

// 出貨幫手看的：完整排行榜
export async function fullBoard(db, game, limit = 200) {
  const { results } = await db
    .prepare('SELECT player_id AS email, score, created_at, updated_at FROM game_scores WHERE game = ?1 ORDER BY score DESC, updated_at ASC LIMIT ?2')
    .bind(game, limit)
    .all();
  return results;
}
