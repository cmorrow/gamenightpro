import { fitText } from "../directives/fitText.js";
import { configureSpotify } from "../composables/useSpotify.js";
import { configureYoutube } from "../composables/useYoutube.js";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("fit-text", fitText);

  const { spotifyClientId, spotifyRedirectUri, youtubeApiKey } = useRuntimeConfig().public;
  configureSpotify({ clientId: spotifyClientId, redirectUri: spotifyRedirectUri });
  configureYoutube({ apiKey: youtubeApiKey });
});
