export function log(level, message, extra = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...extra,
  };
  const out = level === "error" ? console.error : console.log;
  out(JSON.stringify(line));
}

export const logger = {
  info: (message, extra) => log("info", message, extra),
  warn: (message, extra) => log("warn", message, extra),
  error: (message, extra) => log("error", message, extra),
};
