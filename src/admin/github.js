// Minimal GitHub REST client for the Command Center. Runs in the browser with
// the user's fine-grained token (Contents: read & write on the site repo).
import { REPO } from "./config";

const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const encodePath = (path) => path.split("/").map(encodeURIComponent).join("/");

export function createGitHub(token) {
  const repoPath = `/repos/${REPO.owner}/${REPO.name}`;

  async function request(path, { method = "GET", body, accept } = {}) {
    const res = await fetch(API + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: accept || "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.message) message = data.message;
      } catch {
        // keep the status text
      }
      throw new GitHubError(res.status, message);
    }
    if (res.status === 204) return null;
    return accept && accept.includes("raw") ? res.text() : res.json();
  }

  return {
    // Who is signed in, and can they push to the site repo?
    async verify() {
      const repo = await request(repoPath);
      return { fullName: repo.full_name, canPush: Boolean(repo.permissions?.push), isPrivate: repo.private };
    },

    // Raw file text at the branch head, or null if the file doesn't exist.
    async readText(path) {
      try {
        return await request(`${repoPath}/contents/${encodePath(path)}?ref=${REPO.branch}&t=${Date.now()}`, {
          accept: "application/vnd.github.raw+json",
        });
      } catch (err) {
        if (err.status === 404) return null;
        throw err;
      }
    },

    async readJson(path) {
      const text = await this.readText(path);
      return text == null ? null : JSON.parse(text);
    },

    // Files in a folder: [{ name, path, size }], or [] if it doesn't exist.
    async listDir(path) {
      try {
        const list = await request(`${repoPath}/contents/${encodePath(path)}?ref=${REPO.branch}&t=${Date.now()}`);
        return list.filter((f) => f.type === "file").map((f) => ({ name: f.name, path: f.path, size: f.size }));
      } catch (err) {
        if (err.status === 404) return [];
        throw err;
      }
    },

    async recentCommits(count = 12) {
      const list = await request(`${repoPath}/commits?sha=${REPO.branch}&per_page=${count}`);
      return list.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        date: c.commit.author?.date,
        author: c.commit.author?.name,
        url: c.html_url,
      }));
    },

    // One atomic commit for many files. Each change is
    // { path, content } (text), { path, base64 } (binary) or { path, delete: true }.
    // Retries if the branch moved while we were building the commit.
    async commitFiles(changes, message) {
      for (let attempt = 0; ; attempt++) {
        const ref = await request(`${repoPath}/git/ref/heads/${REPO.branch}`);
        const headSha = ref.object.sha;
        const head = await request(`${repoPath}/git/commits/${headSha}`);

        const tree = [];
        for (const change of changes) {
          if (change.delete) {
            tree.push({ path: change.path, mode: "100644", type: "blob", sha: null });
          } else if (change.base64 != null) {
            const blob = await request(`${repoPath}/git/blobs`, {
              method: "POST",
              body: { content: change.base64, encoding: "base64" },
            });
            tree.push({ path: change.path, mode: "100644", type: "blob", sha: blob.sha });
          } else {
            tree.push({ path: change.path, mode: "100644", type: "blob", content: change.content });
          }
        }

        const newTree = await request(`${repoPath}/git/trees`, {
          method: "POST",
          body: { base_tree: head.tree.sha, tree },
        });
        const commit = await request(`${repoPath}/git/commits`, {
          method: "POST",
          body: { message, tree: newTree.sha, parents: [headSha] },
        });
        try {
          await request(`${repoPath}/git/refs/heads/${REPO.branch}`, {
            method: "PATCH",
            body: { sha: commit.sha, force: false },
          });
          return commit.sha;
        } catch (err) {
          if (err.status === 422 && attempt < 2) continue; // branch moved; rebuild on the new head
          throw err;
        }
      }
    },
  };
}
