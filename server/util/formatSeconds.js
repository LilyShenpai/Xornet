function formatSeconds(seconds) {
  if(!seconds) return undefined;
  seconds = Number(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor(seconds / 3600 % 24);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 3600 % 60);

  return `${d}d ${h}h ${m}m ${s}s`
}

module.exports = formatSeconds;
