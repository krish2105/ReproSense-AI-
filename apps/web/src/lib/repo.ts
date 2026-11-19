// The public repository (README), so pages can point a reviewer at the exact file or commit behind a claim.
export const REPO_URL = "https://github.com/krish2105/ReproSense-AI-";

/** A file on main, e.g. repoFile("backend/app/db/schema.sql"). */
export const repoFile = (path: string) => `${REPO_URL}/blob/main/${path}`;

/** One commit, e.g. the commit an evidence record was measured at. */
export const repoCommit = (sha: string) => `${REPO_URL}/commit/${sha}`;
