// Netlify Forms access for the Dispatches room (optional second key).
import { NETLIFY_SITE_ID } from "./config";

const API = "https://api.netlify.com/api/v1";

export function createNetlify(token) {
  async function request(path, { method = "GET" } = {}) {
    const res = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Netlify ${res.status} ${res.statusText}`);
    return res.status === 204 ? null : res.json();
  }

  return {
    forms: () => request(`/sites/${NETLIFY_SITE_ID}/forms`),
    submissions: (formId) => request(`/forms/${formId}/submissions?per_page=200`),
    deleteSubmission: (id) => request(`/submissions/${id}`, { method: "DELETE" }),
  };
}
