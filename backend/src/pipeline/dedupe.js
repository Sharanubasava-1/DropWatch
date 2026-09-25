export function modelKey(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function dedupeClassified(classified) {
  const groups = new Map();
  for (const item of classified) {
    const key = modelKey(item.model_name);
    if (!key) continue;
    if (!groups.has(key)) {
      groups.set(key, {
        model_key: key,
        model_name: item.model_name,
        items: [],
      });
    }
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}
