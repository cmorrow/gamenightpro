import {
  fetchYoutubePlaylistTracks,
  parseYoutubePlaylistId,
} from "../composables/useYoutube.js";
import {
  buildLocalTracksFromSpotify,
  matchTracksSpotifyFirst,
} from "./playlistTrackMatch.js";

/**
 * Sync local JSON from YouTube (YouTube is source of truth):
 * - Drop local songs not on the YouTube playlist
 * - Add YouTube songs missing locally
 * - Keep curated local titles when a partial match is found
 */
export async function syncPlaylistFromYoutube(playlist) {
  const playlistId = parseYoutubePlaylistId(
    String(playlist?.youtubePlaylistUrl || "").trim(),
  );
  if (!playlistId) throw new Error("Invalid YouTube playlist URL");

  const localTracks = (Array.isArray(playlist?.tracks) ? playlist.tracks : [])
    .map((t) => ({
      name: String(t?.name || "").trim(),
      artist: String(t?.artist || "").trim(),
      originalName: String(t?.originalName || t?.name || "").trim(),
      originalArtist: String(t?.originalArtist || t?.artist || "").trim(),
      doNotPrint: !!t?.doNotPrint,
    }))
    .filter((t) => t.name);

  const youtubeTracks = await fetchYoutubePlaylistTracks(playlistId);
  const { pairs, unmatchedLocal, unmatchedSpotify: unmatchedYoutube } =
    matchTracksSpotifyFirst(localTracks, youtubeTracks);

  const tracks = buildLocalTracksFromSpotify(localTracks, youtubeTracks, pairs);

  const updatedPlaylist = {
    ...playlist,
    youtubePlaylistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    tracks,
  };

  return {
    updatedPlaylist,
    tracks,
    removedFromLocal: unmatchedLocal,
    removedCount: unmatchedLocal.length,
    addedToLocal: unmatchedYoutube.map((t) => ({
      name: String(t.name || "").trim(),
      artist: String(t.artist || "").trim(),
    })),
    addedCount: unmatchedYoutube.length,
    matchedCount: pairs.length,
    youtubeTrackCount: youtubeTracks.length,
    localTrackCount: localTracks.length,
  };
}

export function describeSyncPlaylistFromYoutubeResult(result) {
  const parts = [];
  if (result.removedCount > 0) {
    parts.push(
      `removed ${result.removedCount} song${result.removedCount === 1 ? "" : "s"} not on YouTube`,
    );
  }
  if (result.addedCount > 0) {
    parts.push(
      `added ${result.addedCount} song${result.addedCount === 1 ? "" : "s"} from YouTube`,
    );
  }
  if (!parts.length) {
    return "Local playlist already matches YouTube.";
  }

  let message = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join(", ") + ".";

  if (result.removedFromLocal?.length) {
    const names = result.removedFromLocal
      .slice(0, 4)
      .map((t) => t.name)
      .join(", ");
    const more =
      result.removedFromLocal.length > 4
        ? ` (+${result.removedFromLocal.length - 4} more)`
        : "";
    message += ` Removed: ${names}${more}.`;
  }

  return message;
}
