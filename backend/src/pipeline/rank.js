import { upsertRelease, insertSnapshot, snapshotNear } from "../db/queries.js";

function engagement(posts) {
  const score = posts.reduce((sum, p) => sum + (p.score || 0), 0);
  const comments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
  const mentions = posts.length;
  return {
    score,
    comments,
    mentions,
    metric: score + 2 * comments + 5 * mentions,
  };
}

function pickTop(posts) {
  return [...posts].sort(
    (a, b) => b.score + 2 * b.comments - (a.score + 2 * a.comments)
  )[0];
}

export function rankAndStore(groups) {
  const now = Math.floor(Date.now() / 1000);
  const ranked = [];

  for (const group of groups) {
    const posts = group.items.map((item) => item.post).filter(Boolean);
    if (!posts.length) continue;

    const nowEng = engagement(posts);
    const best = pickTop(posts);
    const firstSeen = Math.min(...posts.map((p) => p.created_at));
    const lastSeen = Math.max(...posts.map((p) => p.created_at));
    const bestClassified = group.items[0];

    const release = upsertRelease({
      model_name: group.model_name,
      model_key: group.model_key,
      summary: bestClassified.summary || best.title,
      is_release: 1,
      confidence: bestClassified.confidence ?? 0.5,
      first_seen: firstSeen,
      last_seen: lastSeen,
      mention_count: nowEng.mentions,
      velocity: 0,
      top_url: best.permalink || best.url,
      top_source: best.source,
    });

    insertSnapshot({
      release_id: release.id,
      taken_at: now,
      mentions: nowEng.mentions,
      score_sum: nowEng.score,
      comments_sum: nowEng.comments,
    });

    const older = snapshotNear(release.id, now - 24 * 3600);
    const priorMetric = older
      ? older.score_sum + 2 * older.comments_sum + 5 * older.mentions
      : 0;
    const velocity = nowEng.metric - priorMetric;

    const updated = upsertRelease({
      ...release,
      velocity,
      mention_count: nowEng.mentions,
      last_seen: lastSeen,
      top_url: best.permalink || best.url,
      top_source: best.source,
      summary: bestClassified.summary || best.title,
    });

    ranked.push(updated);
  }

  return ranked.sort((a, b) => b.velocity - a.velocity);
}
