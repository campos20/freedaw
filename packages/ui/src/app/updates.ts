export const REPO_URL = "https://github.com/campos20/freedaw";
export const SPONSOR_URL = "https://github.com/sponsors/campos20";
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
const LATEST_RELEASE_API = "https://api.github.com/repos/campos20/freedaw/releases/latest";

export type UpdateStatus =
  | { kind: "up-to-date" }
  /** The repository has no published release to compare against. */
  | { kind: "no-releases" }
  | { kind: "available"; version: string };

function parseVersion(version: string): [number, number, number] | undefined {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : undefined;
}

/** Whether release `latest` is newer than `current`. Pre-release suffixes are ignored. */
export function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) throw new Error(`Can't compare versions "${latest}" and "${current}"`);
  const i = a.findIndex((part, index) => part !== b[index]);
  return i >= 0 && a[i]! > b[i]!;
}

/** Asks GitHub for the latest published release. Rejects when it can't get an answer. */
export async function checkForUpdate(current: string, signal?: AbortSignal): Promise<UpdateStatus> {
  const response = await fetch(LATEST_RELEASE_API, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });
  if (response.status === 404) return { kind: "no-releases" };
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const { tag_name: tag } = (await response.json()) as { tag_name: string };
  return isNewer(tag, current)
    ? { kind: "available", version: tag.replace(/^v/, "") }
    : { kind: "up-to-date" };
}
