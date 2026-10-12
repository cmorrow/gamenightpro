/**
 * Playlists = the bundled library (`./playlists/*.json`) plus the signed-in host's own
 * saved copies and new playlists from the server. A host's copy replaces the library
 * playlist with the same id; a delete hides it for that host only.
 *
 * Offline: the host's playlists are cached in localStorage, and saves made without a
 * connection are queued and sent when the browser is back online.
 */
import { computed, shallowRef } from "vue";

const libraryModules = import.meta.glob("./playlists/*.json", {
  eager: true,
  import: "default",
});

const libraryImageUrls = import.meta.glob(
  "../assets/img/playlists/*.{png,Png,PNG,jpg,JPG,jpeg,JPEG}",
  { eager: true, query: "?url", import: "default" },
);

const imageUrlByBasename = Object.fromEntries(
  Object.entries(libraryImageUrls).map(([path, url]) => [
    path.split("/").pop().toLowerCase(),
    url,
  ]),
);

const library = Object.fromEntries(
  Object.entries(libraryModules).map(([path, data]) => [
    String(data?.id || path.replace(/^.*\/([^/]+)\.json$/, "$1")),
    data,
  ]),
);

const API = "/api/music-bingo";
const CACHE_VERSION = "v1";

/** id -> playlist data, or { deleted: true } to hide a library playlist. */
const hostPlaylists = shallowRef({});
let userId = "";
let loadPromise = null;

const cacheKey = () => `mb:playlists:${CACHE_VERSION}:${userId}`;
const queueKey = () => `mb:pending:${CACHE_VERSION}:${userId}`;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the in-memory copy still works for this visit.
  }
}

function setHostPlaylist(id, value) {
  hostPlaylists.value = { ...hostPlaylists.value, [id]: value };
  if (userId) writeJson(cacheKey(), hostPlaylists.value);
}

function readQueue() {
  return userId ? readJson(queueKey(), []) : [];
}

function writeQueue(queue) {
  if (userId) writeJson(queueKey(), queue);
}

/** Library + host playlists, keyed by id, with deleted ones removed. */
export const playlistsById = computed(() => {
  const merged = { ...library };
  for (const [id, value] of Object.entries(hostPlaylists.value)) {
    if (value?.deleted) delete merged[id];
    else merged[id] = value;
  }
  return merged;
});

/** All playlists, sorted A–Z by title. */
export const allPlaylists = computed(() =>
  Object.values(playlistsById.value).sort((a, b) =>
    String(a?.title || "").localeCompare(String(b?.title || ""), undefined, {
      sensitivity: "base",
    }),
  ),
);

export function getPlaylist(id) {
  const key = String(id || "").trim();
  return key ? (playlistsById.value[key] ?? null) : null;
}

/** Resolves a playlist `image` value to a URL: bundled cover art, an uploaded image, or a full URL. */
export function resolvePlaylistImage(imagePath) {
  const path = String(imagePath || "").trim();
  if (!path) return "";
  if (/^(\/api\/|data:|https?:)/i.test(path)) return path;
  return imageUrlByBasename[path.split("/").pop().toLowerCase()] || "";
}

async function request(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json?.statusMessage || json?.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return json;
}

// A thrown TypeError from fetch means no connection; anything with a status is a real server answer.
const isOffline = (e) => !e?.status;

async function flushQueue() {
  let queue = readQueue();
  while (queue.length) {
    const op = queue[0];
    try {
      if (op.type === "save") await request("PUT", `/playlists/${encodeURIComponent(op.id)}`, op.data);
      else if (op.type === "delete") await request("DELETE", `/playlists/${encodeURIComponent(op.id)}`);
    } catch (e) {
      if (isOffline(e)) return;
      // The server rejected it (e.g. too large); drop it so the queue doesn't stall.
      console.warn("[music-bingo] dropped queued playlist change", op, e);
    }
    queue = readQueue().slice(1);
    writeQueue(queue);
  }
}

/** Loads the host's playlists (cache first, then server). Safe to call repeatedly. */
export function loadHostPlaylists(currentUserId) {
  const id = String(currentUserId || "");
  if (!id) return Promise.resolve();
  if (id === userId && loadPromise) return loadPromise;

  userId = id;
  hostPlaylists.value = readJson(cacheKey(), {});
  loadPromise = (async () => {
    await flushQueue();
    try {
      const { playlists } = await request("GET", "/playlists");
      // Keep local values for anything still waiting to upload.
      const pending = new Set(readQueue().map((op) => op.id));
      const next = { ...playlists };
      for (const pid of pending) next[pid] = hostPlaylists.value[pid];
      hostPlaylists.value = next;
      writeJson(cacheKey(), next);
    } catch (e) {
      if (!isOffline(e)) console.warn("[music-bingo] could not load playlists", e);
    }
  })();
  return loadPromise;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (userId) flushQueue();
  });
}

async function saveOrQueue(op) {
  try {
    if (op.type === "save") await request("PUT", `/playlists/${encodeURIComponent(op.id)}`, op.data);
    else await request("DELETE", `/playlists/${encodeURIComponent(op.id)}`);
    return { ok: true };
  } catch (e) {
    if (!isOffline(e)) return { ok: false, error: e.message };
    writeQueue([...readQueue().filter((q) => q.id !== op.id), op]);
    return { ok: true, queued: true };
  }
}

const safeId = (id) => String(id || "").trim().replace(/[^a-z0-9_-]/gi, "-");

export async function savePlaylist(id, data) {
  const key = safeId(id);
  if (!key || !data || typeof data !== "object") return { ok: false, error: "Invalid payload" };
  const value = { ...data, id: data.id || key };
  setHostPlaylist(key, value);
  return saveOrQueue({ type: "save", id: key, data: value });
}

export async function deletePlaylist(id) {
  const key = safeId(id);
  if (!key) return { ok: false, error: "Invalid payload" };
  setHostPlaylist(key, { deleted: true });
  return saveOrQueue({ type: "delete", id: key });
}

/** Uploads a cover image (data URL). Needs a connection. */
export async function uploadPlaylistImage(id, dataUrl) {
  try {
    const json = await request("POST", "/images", { id: safeId(id), dataUrl });
    return { ok: true, image: json.image };
  } catch (e) {
    return {
      ok: false,
      error: isOffline(e) ? "You're offline. Connect to the internet to upload a cover image." : e.message,
    };
  }
}

/**
 * Drop-in for the original app's dev-server endpoints, so existing pages keep their
 * `fetch(...)` + `res.json()` code: `/api/write-playlist` (POST, DELETE ?id=) and
 * `/api/upload-playlist-image` (POST).
 */
export async function playlistApiFetch(url, init = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const u = new URL(url, window.location.origin);
  const body = init.body ? JSON.parse(init.body) : {};
  let result;
  if (u.pathname === "/api/write-playlist" && method === "POST") {
    result = await savePlaylist(body.id, body.data);
  } else if (u.pathname === "/api/write-playlist" && method === "DELETE") {
    result = await deletePlaylist(u.searchParams.get("id"));
  } else if (u.pathname === "/api/upload-playlist-image" && method === "POST") {
    result = await uploadPlaylistImage(body.id, body.dataUrl);
  } else {
    result = { ok: false, error: `Unsupported request: ${method} ${u.pathname}` };
  }
  return {
    ok: result.ok,
    status: result.ok ? 200 : 400,
    json: async () => result,
  };
}
