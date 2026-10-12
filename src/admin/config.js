// Where the Command Center reads and writes. All content changes are commits
// to this repository; Netlify rebuilds the site from every push to `branch`.
export const REPO = { owner: "azadbarsoumian-cmyk", name: "potoreek", branch: "main" };
export const NETLIFY_SITE_ID = "455724da-18cb-4024-95c5-e78b009a2823";
export const SITE_URL = "https://potoreek.com";

// The live site's build stamp. Only readable when the Command Center itself
// runs on the live site (the stamp has no cross-origin headers).
export const versionUrl = () => (window.location.origin === SITE_URL ? "/version.json" : null);

// Where to create the access keys (shown on the sign-in screen).
export const GITHUB_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";
export const NETLIFY_TOKEN_URL = "https://app.netlify.com/user/applications#personal-access-tokens";
