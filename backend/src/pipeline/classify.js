import { config } from "../config.js";
import { completeJson } from "../utils/claudeClient.js";
import { logger } from "../utils/logger.js";

const RELEASE_RE =
  /\b(GPT-?\d|Claude\s?\d|Llama\s?\d|Gemini|Mistral|Qwen|DeepSeek|Grok|open[- ]weights|model release|announc(ed|es)|launch(ed|es)?)\b/i;

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function keywordFallback(post) {
  const hit = RELEASE_RE.test(post.title);
  const nameMatch = post.title.match(
    /\b((?:GPT|Claude|Llama|Gemini|Mistral|Qwen|DeepSeek|Grok)[\w.\-]*)\b/i
  );
  return {
    source: post.source,
    source_id: post.source_id,
    is_release: hit,
    model_name: nameMatch ? nameMatch[1] : hit ? post.title.slice(0, 80) : null,
    summary: post.title,
    confidence: hit ? 0.45 : 0.15,
    post,
  };
}

export async function classifyPosts(posts) {
  if (!posts.length) return [];

  if (!config.anthropicKey) {
    logger.warn("classify_keyword_fallback");
    return posts.map(keywordFallback).filter((row) => row.is_release && row.model_name);
  }

  const classified = [];
  for (const batch of chunk(posts, 8)) {
    const prompt = `You classify forum posts about AI models.
Return a JSON array only, one object per post, same order as input.
Each object:
{
  "index": number,
  "is_release": boolean,
  "model_name": string | null,
  "summary": string,
  "confidence": number
}
is_release=true only if a new model, weights, or API model is announced or dropped.
False for tutorials, memes, benchmarks of old models, hiring posts.

Posts:
${batch.map((p, i) => `${i}. [${p.source}] ${p.title}`).join("\n")}`;

    try {
      const parsed = await completeJson(prompt);
      const rows = Array.isArray(parsed) ? parsed : [];
      for (let i = 0; i < batch.length; i++) {
        const post = batch[i];
        const row = rows.find((r) => r.index === i) || rows[i] || {};
        const isRelease = Boolean(row.is_release);
        const modelName = row.model_name || null;
        if (!isRelease || !modelName) continue;
        classified.push({
          source: post.source,
          source_id: post.source_id,
          is_release: true,
          model_name: modelName,
          summary: row.summary || post.title,
          confidence: Number(row.confidence ?? 0.5),
          post,
        });
      }
    } catch (err) {
      logger.warn("classify_batch_failed", { error: err.message });
      for (const post of batch) {
        const fb = keywordFallback(post);
        if (fb.is_release && fb.model_name) classified.push({ ...fb, post });
      }
    }
  }
  return classified;
}
