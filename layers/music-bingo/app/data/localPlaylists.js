/**
 * Local/browse playlist helpers driven by `src/config.json` and bundled `src/data/playlists/*.json`.
 */

import playlistConfig from "../config.json";
import { getPlaylistTracksData } from "./playlistTracks.js";
import { resolvePlaylistImage } from "./playlistStore.js";

function parseSpotifyPlaylistId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^[A-Za-z0-9]{22}$/.test(raw)) return raw;
  const webMatch = raw.match(/playlist\/([A-Za-z0-9]{22})/i);
  if (webMatch?.[1]) return webMatch[1];
  const uriMatch = raw.match(/spotify:playlist:([A-Za-z0-9]{22})/i);
  if (uriMatch?.[1]) return uriMatch[1];
  return "";
}

function normalizePlaylistTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function gradientForPlaylistId(id) {
  const gradients = [
    "bg-gradient-to-br from-fuchsia-600 via-purple-900 to-slate-950",
    "bg-gradient-to-br from-orange-600 via-red-900 to-stone-950",
    "bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-950",
    "bg-gradient-to-br from-rose-600 via-pink-900 to-zinc-950",
    "bg-gradient-to-br from-lime-500 via-emerald-800 to-neutral-950",
    "bg-gradient-to-br from-sky-600 via-blue-950 to-slate-950",
    "bg-gradient-to-br from-violet-700 via-indigo-950 to-black",
    "bg-gradient-to-br from-pink-600 via-purple-800 to-slate-950",
    "bg-[radial-gradient(circle_at_40%_35%,#fef9c3_0%,#94a3b8_25%,#1e293b_55%,#020617_100%)]",
    "bg-gradient-to-r from-amber-700 via-orange-900 to-stone-950",
  ];
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return gradients[h % gradients.length];
}

/** Vite-resolved URLs for files in `src/assets/img/playlists/` (keys = lowercase basename). */
const playlistCoverAssetUrlByBasename = (() => {
  const mods = import.meta.glob("../assets/img/playlists/*.{png,Png,PNG,jpg,JPG,jpeg,JPEG}", {
    eager: true,
    query: "?url",
    import: "default",
  });
  /** @type {Record<string, string>} */
  const map = {};
  for (const path of Object.keys(mods)) {
    const base = path.split("/").pop();
    if (base) map[base.toLowerCase()] = mods[path];
  }
  return map;
})();

function basenameFromPath(p) {
  const s = String(p || "").replace(/\\/g, "/");
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
}

/**
 * Cover image URL from `src/config.json` when `id` or `title` matches a configured row.
 * Paths in config are relative to `src/` (e.g. `assets/img/playlists/80s-Hits.PNG`).
 */
/** Resolve a raw image path (e.g. "assets/img/playlists/foo.png") to a Vite asset URL. */
export function resolvePlaylistImagePath(imagePath) {
  return resolvePlaylistImage(imagePath);
}

export function resolveConfiguredPlaylistCover(playlistId, playlistTitle) {
  const rows = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  const id = String(playlistId || "").trim();
  const title = normalizePlaylistTitle(playlistTitle);
  const row =
    rows.find((r) => r.id && String(r.id) === id) ||
    rows.find(
      (r) => parseSpotifyPlaylistId(r.spotifyPlaylistUrl) === id && Boolean(id),
    ) ||
    rows.find(
      (r) =>
        normalizePlaylistTitle(r.title) === title && Boolean(title),
    );
  if (!row?.image) return "";
  const base = basenameFromPath(row.image);
  return playlistCoverAssetUrlByBasename[base.toLowerCase()] || "";
}

/**
 * Playlists for `/local`: every row from `src/config.json`, sorted A–Z by title.
 */
export function localPlaylistGridFromConfig() {
  const cfgs = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  const out = [];
  for (const cfg of cfgs) {
    const id = cfg?.id != null ? String(cfg.id).trim() : "";
    if (!id) continue;
    const name = String(cfg.title ?? "").trim() || id;
    const tracksData = getPlaylistTracksData(id);
    const trackCount = Array.isArray(tracksData?.tracks) ? tracksData.tracks.length : 0;
    out.push({
      id,
      name,
      songs: trackCount,
      coverClass: gradientForPlaylistId(id),
      coverLabel: null,
      labelClass: undefined,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return out;
}

export function configuredPlaylistIds() {
  const cfgs = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  return cfgs.map((c) => String(c?.id || "").trim()).filter(Boolean);
}

export function isConfiguredPlaylistId(id) {
  const s = String(id || "").trim();
  return configuredPlaylistIds().includes(s);
}

export function getFirstConfiguredPlaylistId() {
  const cfgs = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  const first = cfgs[0];
  const id = first?.id != null ? String(first.id).trim() : "";
  return id || "";
}

/**
 * Rows for `/playlists` when no Spotify playlists are saved — mirrors config + bundled JSON tracks.
 */
export function browseRowsFromConfig() {
  const cfgs = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  const rows = [];
  for (const cfg of cfgs) {
    const id = cfg?.id != null ? String(cfg.id).trim() : "";
    if (!id) continue;
    const name = String(cfg.title ?? "").trim() || id;
    const tracksData = getPlaylistTracksData(id);
    const trackCount = Array.isArray(tracksData?.tracks) ? tracksData.tracks.length : 0;
    const url = String(cfg.spotifyPlaylistUrl || "").trim();
    const coverUrl = resolveConfiguredPlaylistCover(id, name);
    rows.push({
      id,
      name,
      songs: trackCount,
      imageUrl: coverUrl || "",
      coverClass: gradientForPlaylistId(id),
      coverLabel: null,
      labelClass: "",
      isSpotify: false,
      spotifyOpenUrl: url,
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return rows;
}

const CONFIG_PLAYLIST_DESCRIPTION =
  "Tracks for this playlist come from bundled JSON (see src/data/playlists/). Connect Spotify from the Games page to control playback from Spotify.";

/** Shape matches playlist-details `resolved` for non-Spotify browse entries from config. */
export function getConfiguredPlaylistDetails(id) {
  const sid = String(id || "").trim();
  if (!sid) return null;
  const cfgs = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  const cfg = cfgs.find((r) => String(r?.id || "").trim() === sid);
  if (!cfg) return null;
  const name = String(cfg.title || "").trim() || sid;
  const tracksData = getPlaylistTracksData(sid);
  const trackCount = Array.isArray(tracksData?.tracks) ? tracksData.tracks.length : 0;
  const imageUrl = resolveConfiguredPlaylistCover(sid, name);
  const url = String(cfg.spotifyPlaylistUrl || "").trim();
  return {
    source: "config",
    id: sid,
    name,
    spotifyName: name,
    trackCount,
    description: CONFIG_PLAYLIST_DESCRIPTION,
    imageUrl,
    coverClass: gradientForPlaylistId(sid),
    coverLabel: null,
    labelClass: "",
    spotifyUrl: url,
  };
}
