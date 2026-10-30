-- 遊戲領券名單：同一個 email 只存一筆（所有遊戲共用，一人只領一次）
CREATE TABLE IF NOT EXISTS game_leads (
  email       TEXT PRIMARY KEY,
  game        TEXT NOT NULL,                -- catch|zodiac|guess|other（第一次領券時玩的遊戲）
  score       INTEGER NOT NULL DEFAULT 0,   -- 最高分
  src         TEXT,                         -- 網址上的 ?src= 或 utm_source
  consent     INTEGER NOT NULL DEFAULT 1,   -- 同意收電子報
  created_at  INTEGER NOT NULL,             -- 第一次領券（毫秒時間戳）
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_leads_created ON game_leads(created_at DESC);

-- 排行榜：每位玩家（裝置）每款遊戲只留最高分
CREATE TABLE IF NOT EXISTS game_scores (
  game        TEXT NOT NULL,                -- xmas|catch
  player_id   TEXT NOT NULL,                -- 前端產生、存在 localStorage 的玩家 ID
  nick        TEXT NOT NULL,                -- 暱稱（最多 10 字）
  score       INTEGER NOT NULL,             -- 最高分
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,             -- 拿到最高分的時間（同分比先拿到的排前面）
  PRIMARY KEY (game, player_id)
);
CREATE INDEX IF NOT EXISTS idx_game_scores_top ON game_scores(game, score DESC);
