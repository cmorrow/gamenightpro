/**
 * Per-playlist track lists: the bundled library plus the host's saved playlists (see playlistStore.js).
 */

import { allPlaylists, getPlaylist } from "./playlistStore.js";

/**
 * Raw playlist file: title, id, image, spotifyPlaylistUrl, tracks[{ name, artist }].
 * @returns {object | null}
 */
export function getPlaylistTracksData(playlistId) {
  const data = getPlaylist(playlistId);
  if (!data || typeof data !== "object") return null;
  return data;
}

/**
 * Finds a bundled playlist JSON by matching the Spotify playlist ID extracted from a URL.
 * Used when a stored playlist's id has been remapped from a slug to a Spotify ID.
 * @returns {object | null}
 */
export function getPlaylistTracksDataBySpotifyUrl(spotifyUrl) {
  const url = String(spotifyUrl || "").trim();
  if (!url) return null;
  const match = url.match(/playlist\/([A-Za-z0-9]{22})/i);
  const spotifyId = match?.[1] || "";
  if (!spotifyId) return null;
  for (const data of allPlaylists.value) {
    const dataUrl = String(data?.spotifyPlaylistUrl || "").trim();
    if (dataUrl.includes(spotifyId)) return data;
  }
  return null;
}

/**
 * All playlists derived from the bundled JSON files, sorted A–Z by title.
 * @returns {{ id: string, name: string }[]}
 */
export function getAllPlaylistsFromFiles() {
  return allPlaylists.value.map((data) => ({
    id: String(data.id),
    name: String(data?.title ?? "").trim() || String(data.id),
  }));
}

/** @returns {{ text: string, sub: string }[]} */
export function tracksToBingoItems(tracks) {
  if (!Array.isArray(tracks)) return [];
  return tracks
    .map((t) => ({
      text: String(t?.name ?? "").trim(),
      sub: String(t?.artist ?? "").trim(),
    }))
    .filter((item) => item.text);
}
