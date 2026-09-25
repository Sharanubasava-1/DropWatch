import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

let client;

export function getClaude() {
  if (!config.anthropicKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropicKey });
  }
  return client;
}

export async function completeJson(prompt) {
  const anthropic = getClaude();
  if (!anthropic) return null;

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}
