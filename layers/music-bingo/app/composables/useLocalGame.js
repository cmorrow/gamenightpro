import { ref } from "vue";

/**
 * Module-level singleton: tracks which local playlist the user has selected
 * on the /local page so other components (e.g. LocalHeader) can read it
 * without prop-drilling.
 */
const activeLocalPlaylistId = ref("");

export function useLocalGame() {
  function setActiveLocalPlaylistId(id) {
    activeLocalPlaylistId.value = String(id || "").trim();
  }

  return { activeLocalPlaylistId, setActiveLocalPlaylistId };
}
