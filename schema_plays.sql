-- 遊玩紀錄：每個 email 每款遊戲一筆（三款都玩就三筆），出貨幫手的「遊戲名單」讀這張
CREATE TABLE IF NOT EXISTS game_plays (
  email       TEXT NOT NULL,
  game        TEXT NOT NULL,                -- catch|xmas|guess|zodiac
  score       INTEGER NOT NULL DEFAULT 0,   -- 這款遊戲的最高分
  created_at  INTEGER NOT NULL,             -- 第一次留下紀錄
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (email, game)
);
CREATE INDEX IF NOT EXISTS idx_game_plays_created ON game_plays(created_at DESC);

-- 把既有資料帶進來：領券名單（第一次玩的遊戲）＋排行榜（其他玩過的遊戲）
INSERT OR IGNORE INTO game_plays (email, game, score, created_at, updated_at)
  SELECT email, game, score, created_at, updated_at FROM game_leads;
INSERT INTO game_plays (email, game, score, created_at, updated_at)
  SELECT player_id, game, score, created_at, updated_at FROM game_scores WHERE true
  ON CONFLICT(email, game) DO UPDATE SET score = MAX(score, excluded.score);
