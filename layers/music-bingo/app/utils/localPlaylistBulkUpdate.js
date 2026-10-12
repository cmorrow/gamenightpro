import JSZip from "jszip";
import playlistConfig from "../config.json";
import {
  fetchPlaylistMeta,
  fetchPlaylistTracks,
  parsePlaylistId,
} from "../composables/useSpotify.js";

/**
 * For each playlist in config with a non-empty `spotifyPlaylistUrl`, fetch Spotify
 * metadata + tracks and yield JSON payloads keyed by config `id`.
 *
 * Tracks use `{ name, artist }`; Spotify fetch returns `{ text, sub }`.
 */
export async function collectLocalPlaylistPayloads(accessToken, options = {}) {
  const gapMs = typeof options.requestGapMs === "number" ? options.requestGapMs : 160;
  const rows = Array.isArray(playlistConfig.playlists) ? playlistConfig.playlists : [];
  const payloads = [];
  /** @type {{ id: string, reason: string }[]} */
  const skipped = [];
  /** @type {{ id: string, message: string }[]} */
  const errors = [];

  for (const row of rows) {
    const url = String(row.spotifyPlaylistUrl || "").trim();
    const configId = String(row.id || "").trim();
    if (!configId) continue;
    if (!url) {
      skipped.push({ id: configId, reason: "No spotifyPlaylistUrl in config" });
      continue;
    }

    const spotifyId = parsePlaylistId(url);
    if (!spotifyId) {
      errors.push({ id: configId, message: "Invalid Spotify playlist URL" });
      continue;
    }

    try {
      const meta = await fetchPlaylistMeta(spotifyId, accessToken);
      const rawTracks = await fetchPlaylistTracks(spotifyId, accessToken);
      // TODO: Before overwriting, compare incoming Spotify track names against the
      // existing local JSON (src/data/playlists/<id>.json). Flag any name
      // discrepancies so curated edits made on the Print Cards page are not
      // silently overwritten by a fresh Spotify sync.
      const tracks = rawTracks
        .map((t) => {
          const name = String(t.text || "").trim();
          const artist = String(t.sub || "").trim();
          return { name, artist, originalName: name, originalArtist: artist };
        })
        .filter((t) => t.name);

      const canonicalUrl = `https://open.spotify.com/playlist/${spotifyId}`;
      const payload = {
        title: String(meta?.name || row.title || "").trim() || row.title,
        id: configId,
        image: row.image || "",
        spotifyPlaylistUrl: canonicalUrl,
        tracksDataUrl: `src/data/playlists/${configId}.json`,
        tracks,
      };
      payloads.push({ configId, payload });
    } catch (e) {
      errors.push({
        id: configId,
        message: e?.message || String(e),
      });
    }

    if (gapMs > 0) await new Promise((r) => setTimeout(r, gapMs));
  }

  return { payloads, skipped, errors };
}

/**
 * Build a ZIP with entries `playlists/<id>.json` only (no other parent folders).
 * Copy those files into `src/data/playlists/` in the repo to refresh local JSON.
 */
export async function buildLocalPlaylistZipBlob(accessToken) {
  const { payloads, skipped, errors } = await collectLocalPlaylistPayloads(accessToken);
  const zip = new JSZip();
  for (const { configId, payload } of payloads) {
    const path = `playlists/${configId}.json`;
    zip.file(path, `${JSON.stringify(payload, null, 2)}\n`);
  }
  const blob =
    payloads.length > 0 ? await zip.generateAsync({ type: "blob" }) : null;
  return { blob, skipped, errors, count: payloads.length };
}

export function triggerZipDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
