import { db } from "./client.js";

export function upsertRawPost(row) {
  db.prepare(
    `INSERT INTO raw_posts
      (source, source_id, title, url, permalink, score, comments, created_at, fetched_at)
     VALUES
      (@source, @source_id, @title, @url, @permalink, @score, @comments, @created_at, @fetched_at)
     ON CONFLICT(source, source_id) DO UPDATE SET
      title = excluded.title,
      url = excluded.url,
      permalink = excluded.permalink,
      score = excluded.score,
      comments = excluded.comments,
      fetched_at = excluded.fetched_at`
  ).run(row);
}

export function recentRawPosts(sinceUnix) {
  return db
    .prepare(
      `SELECT * FROM raw_posts WHERE created_at >= ? ORDER BY created_at DESC`
    )
    .all(sinceUnix);
}

export function upsertRelease(row) {
  db.prepare(
    `INSERT INTO releases
      (model_name, model_key, summary, is_release, confidence, first_seen, last_seen,
       mention_count, velocity, top_url, top_source)
     VALUES
      (@model_name, @model_key, @summary, @is_release, @confidence, @first_seen, @last_seen,
       @mention_count, @velocity, @top_url, @top_source)
     ON CONFLICT(model_key) DO UPDATE SET
      model_name = excluded.model_name,
      summary = excluded.summary,
      is_release = excluded.is_release,
      confidence = excluded.confidence,
      last_seen = excluded.last_seen,
      mention_count = excluded.mention_count,
      velocity = excluded.velocity,
      top_url = excluded.top_url,
      top_source = excluded.top_source`
  ).run(row);

  return db.prepare(`SELECT * FROM releases WHERE model_key = ?`).get(row.model_key);
}

export function insertSnapshot(row) {
  db.prepare(
    `INSERT INTO snapshots (release_id, taken_at, mentions, score_sum, comments_sum)
     VALUES (@release_id, @taken_at, @mentions, @score_sum, @comments_sum)`
  ).run(row);
}

export function snapshotNear(releaseId, aroundUnix, windowSeconds = 6 * 3600) {
  return db
    .prepare(
      `SELECT * FROM snapshots
       WHERE release_id = ?
         AND taken_at BETWEEN ? AND ?
       ORDER BY ABS(taken_at - ?) ASC
       LIMIT 1`
    )
    .get(
      releaseId,
      aroundUnix - windowSeconds,
      aroundUnix + windowSeconds,
      aroundUnix
    );
}

export function listLeaderboard(limit = 20) {
  return db
    .prepare(
      `SELECT * FROM releases
       WHERE is_release = 1
       ORDER BY velocity DESC, mention_count DESC
       LIMIT ?`
    )
    .all(limit);
}

export function lastFetchedAt() {
  const row = db
    .prepare(`SELECT MAX(fetched_at) AS fetched_at FROM raw_posts`)
    .get();
  return row?.fetched_at || null;
}
