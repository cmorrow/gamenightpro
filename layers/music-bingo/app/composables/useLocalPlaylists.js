import { computed } from "vue";
import {
  allPlaylists,
  getPlaylist,
  resolvePlaylistImage,
} from "../data/playlistStore.js";

export { resolvePlaylistImage };

/**
 * Shared access to the playlists (bundled library + this host's saved playlists)
 * and their cover images.
 *
 * `playlists` — computed, all playlists sorted A–Z by title.
 *   Each entry is the raw JSON shape: { id, title, image, spotifyPlaylistUrl, tracks, … }
 *
 * `resolvePlaylistImage(imagePath)` — converts a playlist's `image` field to a URL.
 *
 * `getPlaylistById(id)` — finds a playlist by its `id` field.
 */
export function useLocalPlaylists() {
  const playlistCount = computed(() => allPlaylists.value.length);

  return {
    playlists: allPlaylists,
    playlistCount,
    getPlaylistById: getPlaylist,
    resolvePlaylistImage,
  };
}
