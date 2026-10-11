// Picks the lighter encode for phones and data-saver connections.
export function pickVideo({ hd, sd }) {
  const conn = navigator.connection;
  const slow = conn?.saveData || /2g/.test(conn?.effectiveType || "");
  return slow || window.innerWidth < 900 ? sd : hd;
}
