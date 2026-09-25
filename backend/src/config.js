import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3001),
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  databaseUrl: process.env.DATABASE_URL || "file:./data/tracker.db",
  refreshSecret: process.env.REFRESH_SECRET || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  redditUserAgent:
    process.env.REDDIT_USER_AGENT || "model-release-tracker/0.1",
  lookbackHours: 48,
  keywords: [
    "GPT-",
    "Claude",
    "Llama",
    "Gemini",
    "Mistral",
    "Qwen",
    "DeepSeek",
    "Grok",
    "model release",
    "open weights",
  ],
  hnQueries: [
    "GPT release",
    "Claude model",
    "Llama release",
    "Gemini model",
    "open source LLM",
  ],
  redditSubs: ["MachineLearning", "LocalLLaMA", "OpenAI", "singularity"],
  redditQuery:
    "GPT OR Claude OR Llama OR Gemini OR Mistral OR Qwen OR DeepSeek OR Grok OR \"model release\" OR \"open weights\"",
};
