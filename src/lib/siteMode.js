// While the archive is being finished, every visitor sees the coming-soon
// page. Set UNDER_CONSTRUCTION to false to launch the full site.
export const UNDER_CONSTRUCTION = false;

// Preview the full site while it's hidden: open any page with ?preview=on
// (this browser remembers it), and ?preview=off to see the landing page again.
// This only hides the site from casual visitors; it is not a password.
const PREVIEW_KEY = "potoreek-preview";

function previewEnabled() {
  try {
    const param = new URLSearchParams(window.location.search).get("preview");
    if (param === "on") window.localStorage.setItem(PREVIEW_KEY, "1");
    if (param === "off") window.localStorage.removeItem(PREVIEW_KEY);
    return window.localStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function showComingSoon() {
  return UNDER_CONSTRUCTION && !previewEnabled();
}
