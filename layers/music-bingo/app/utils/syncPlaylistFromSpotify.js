import {
  fetchCurrentUserId,
  fetchPlaylistOwner,
  fetchPlaylistTracksAndUris,
  parsePlaylistId,
} from "../composables/useSpotify.js";
import {
  buildLocalTracksFromSpotify,
  matchTracksSpotifyFirst,
} from "./playlistTrackMatch.js";

/**
 * Sync local JSON from Spotify (Spotify is source of truth):
 * - Drop local songs not on Spotify
 * - Add Spotify songs missing locally
 * - Keep curated local titles when a partial match is found
 */
export async function syncPlaylistFromSpotify(playlist, token) {
  const spotifyId = parsePlaylistId(String(playlist?.spotifyPlaylistUrl || "").trim());
  if (!spotifyId) throw new Error("Invalid Spotify playlist URL");

  const localTracks = (Array.isArray(playlist?.tracks) ? playlist.tracks : [])
    .map((t) => ({
      name: String(t?.name || "").trim(),
      artist: String(t?.artist || "").trim(),
      originalName: String(t?.originalName || t?.name || "").trim(),
      originalArtist: String(t?.originalArtist || t?.artist || "").trim(),
      doNotPrint: !!t?.doNotPrint,
    }))
    .filter((t) => t.name);

  const [currentUserId, ownerId] = await Promise.all([
    fetchCurrentUserId(token).catch(() => null),
    fetchPlaylistOwner(spotifyId, token).catch(() => null),
  ]);
  if (currentUserId && ownerId && currentUserId !== ownerId) {
    throw new Error(
      `This Spotify playlist is owned by "${ownerId}", not your connected account ("${currentUserId}"). Reconnect Spotify with the account that owns it, or ask the owner to share it.`,
    );
  }

  const { tracks: spotifyTracks } = await fetchPlaylistTracksAndUris(spotifyId, token);
  const { pairs, unmatchedLocal, unmatchedSpotify } = matchTracksSpotifyFirst(
    localTracks,
    spotifyTracks,
  );

  const tracks = buildLocalTracksFromSpotify(localTracks, spotifyTracks, pairs);

  const updatedPlaylist = {
    ...playlist,
    spotifyPlaylistUrl: `https://open.spotify.com/playlist/${spotifyId}`,
    tracks,
  };

  return {
    updatedPlaylist,
    tracks,
    removedFromLocal: unmatchedLocal,
    removedCount: unmatchedLocal.length,
    addedToLocal: unmatchedSpotify.map((t) => ({
      name: String(t.text || "").trim(),
      artist: String(t.sub || "").trim(),
    })),
    addedCount: unmatchedSpotify.length,
    matchedCount: pairs.length,
    spotifyTrackCount: spotifyTracks.length,
    localTrackCount: localTracks.length,
  };
}

export function describeSyncPlaylistResult(result) {
  const parts = [];
  if (result.removedCount > 0) {
    parts.push(
      `removed ${result.removedCount} song${result.removedCount === 1 ? "" : "s"} not on Spotify`,
    );
  }
  if (result.addedCount > 0) {
    parts.push(
      `added ${result.addedCount} song${result.addedCount === 1 ? "" : "s"} from Spotify`,
    );
  }
  if (!parts.length) {
    return "Local playlist already matches Spotify.";
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
