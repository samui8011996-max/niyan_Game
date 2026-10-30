// POST /api/claim  { email, consent, game, score, src, website }
// 存 email 到 D1，回傳優惠碼。優惠碼放在環境變數 COUPON_CODE，不寫在網頁原始碼裡。
// 同一個 email 只存一筆，再送一次只會更新最高分。

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GAMES = ['catch', 'xmas', 'zodiac', 'guess'];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '資料格式錯誤，請重新整理再試一次' }, 400);
  }

  // 隱藏欄位有填 = 機器人
  if (body.website) return json({ ok: false, error: '送出失敗，請再試一次' }, 400);

  const email = String(body.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ ok: false, error: '請輸入正確的 Email' }, 400);
  if (body.consent !== true) return json({ ok: false, error: '請勾選同意，才能寄送優惠給你' }, 400);

  const game = GAMES.includes(body.game) ? body.game : 'other';
  const score = Math.max(0, Math.min(1000000, Math.floor(Number(body.score) || 0)));
  const src = String(body.src || '').slice(0, 60);
  const now = Date.now();

  const row = await env.DB.prepare(
    `INSERT INTO game_leads (email, game, score, src, consent, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, 1, ?5, ?5)
     ON CONFLICT(email) DO UPDATE SET score = MAX(score, excluded.score), updated_at = excluded.updated_at
     RETURNING created_at`
  )
    .bind(email, game, score, src, now)
    .first();

  return json({ ok: true, code: env.COUPON_CODE || 'NIYAN95', isNew: row.created_at === now });
}
