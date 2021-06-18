/**
 * @author Geoxor
 * 
 * Formats seconds into days, hours, minutes and seconds.
 * @return {Object} days, hours, minutes, seconds
 */
function formatSeconds(seconds) {
  if (!seconds) return undefined;
  seconds = Number(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds / 3600) % 24);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor((seconds % 3600) % 60);

  return { d, h, m, s };
}

module.exports = formatSeconds;
