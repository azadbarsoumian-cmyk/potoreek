// Command Center sign-in with a name and password. The GitHub key stays here on
// the server; signed-in admins reach only this repository's content through it.
// Netlify environment variables:
//   POTOREEK_GITHUB_TOKEN  fine-grained token (Contents: read & write on the repo)
//   POTOREEK_ADMINS        name:password,name2:password2
import { createHmac, timingSafeEqual } from "node:crypto";

const REPO = "/repos/azadbarsoumian-cmyk/potoreek";
const ALLOWED = /^\/(contents|commits|git)(\/|\?|$)/;
const DAYS_30 = 30 * 24 * 3600 * 1000;

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const same = (a, b) => {
  const x = createHmac("sha256", "cmp").update(String(a)).digest();
  const y = createHmac("sha256", "cmp").update(String(b)).digest();
  return timingSafeEqual(x, y);
};
const admins = () =>
  new Map(
    String(process.env.POTOREEK_ADMINS || "")
      .split(",")
      .map((pair) => pair.trim())
      .filter((pair) => pair.includes(":"))
      .map((pair) => [pair.slice(0, pair.indexOf(":")).trim().toLowerCase(), pair.slice(pair.indexOf(":") + 1)])
  );
// Signed with the password too, so changing or removing it ends that person's sessions.
const sign = (name, exp, password) => createHmac("sha256", `${process.env.POTOREEK_GITHUB_TOKEN}|${password}`).update(`${name}.${exp}`).digest("hex");

function sessionOk(req) {
  const [prefix, b64, exp, sig] = (req.headers.get("authorization") || "").replace(/^Bearer /, "").split(".");
  if (prefix !== "pks" || !b64 || !(Number(exp) > Date.now())) return false;
  const name = Buffer.from(b64, "base64url").toString();
  const password = admins().get(name);
  return password != null && same(sig, sign(name, exp, password));
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { message: "Method not allowed" });
  if (!process.env.POTOREEK_GITHUB_TOKEN || !admins().size) return json(503, { message: "Sign-in is not set up yet." });
  const input = await req.json().catch(() => ({}));

  if (input.action === "login") {
    const name = String(input.name || "").trim().toLowerCase();
    const password = admins().get(name);
    await new Promise((r) => setTimeout(r, 800)); // slows password guessing
    if (password == null || !same(input.password || "", password)) return json(401, { message: "Wrong name or password." });
    const exp = Date.now() + DAYS_30;
    return json(200, { session: `pks.${Buffer.from(name).toString("base64url")}.${exp}.${sign(name, exp, password)}` });
  }

  if (!sessionOk(req)) return json(401, { message: "Please sign in again." });
  const path = String(input.path || "");
  const method = input.method || "GET";
  if (!path.startsWith(REPO)) return json(403, { message: "Not allowed." });
  const rest = path.slice(REPO.length);
  if (!(rest === "" && method === "GET") && !ALLOWED.test(rest)) return json(403, { message: "Not allowed." });

  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.POTOREEK_GITHUB_TOKEN}`,
      Accept: input.accept || "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "potoreek-command-center",
      ...(input.body ? { "Content-Type": "application/json" } : {}),
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
  return new Response(res.status === 204 ? null : await res.text(), { status: res.status, headers: { "Content-Type": res.headers.get("content-type") || "application/json", "Cache-Control": "no-store" } });
};

export const config = { path: "/api/admin" };
