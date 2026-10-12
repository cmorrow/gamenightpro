import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildLocalTracksFromSpotify,
  matchTracksSpotifyFirst,
  trackMatchScore,
} from "../app/utils/playlistTrackMatch.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const PLAYLIST_ID = "90s-hits";
const SPOTIFY_PLAYLIST_ID = "5R0nJF3lOAl5D1poyk4cG2";

function loadLocalPlaylist() {
  const path = join(root, "app/data/playlists", `${PLAYLIST_ID}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

async function fetchSpotifyTracks(token) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/items?limit=100&additional_types=track`;

  while (url) {
    const fullUrl = url.startsWith("http") ? url : `https://api.spotify.com/v1${url}`;
    const res = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Spotify API ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    for (const item of data.items || []) {
      const media = item?.item ?? item?.track;
      if (!media?.name) continue;
      if (media.type && media.type !== "track") continue;
      const artists = (media.artists || [])
        .map((a) => (a?.name ? String(a.name).trim() : ""))
        .filter(Boolean);
      tracks.push({
        text: String(media.name || "").trim(),
        sub: artists[0] || "",
        artists,
        uri: typeof media.uri === "string" ? media.uri : "",
      });
    }
    url = data.next || "";
  }

  return tracks;
}

const token = process.env.SPOTIFY_ACCESS_TOKEN?.trim();
const describeIfToken = token ? describe : describe.skip;

describeIfToken("90s-hits local playlist vs Spotify", () => {
  it("has the same number of tracks as Spotify", async () => {
    const playlist = loadLocalPlaylist();
    const local = playlist.tracks;
    const spotify = await fetchSpotifyTracks(token);

    expect(local).toHaveLength(spotify.length);
  });

  it("matches every Spotify track to a local row", async () => {
    const playlist = loadLocalPlaylist();
    const local = playlist.tracks;
    const spotify = await fetchSpotifyTracks(token);
    const { pairs, unmatchedSpotify } = matchTracksSpotifyFirst(local, spotify);

    expect(unmatchedSpotify).toHaveLength(0);
    expect(pairs).toHaveLength(spotify.length);
  });

  it("has no local-only songs missing from Spotify", async () => {
    const playlist = loadLocalPlaylist();
    const local = playlist.tracks;
    const spotify = await fetchSpotifyTracks(token);
    const { unmatchedLocal } = matchTracksSpotifyFirst(local, spotify);

    expect(unmatchedLocal).toEqual([]);
  });

  it("produces the same track list as a fresh Spotify sync", async () => {
    const playlist = loadLocalPlaylist();
    const local = playlist.tracks;
    const spotify = await fetchSpotifyTracks(token);
    const { pairs } = matchTracksSpotifyFirst(local, spotify);
    const synced = buildLocalTracksFromSpotify(local, spotify, pairs);

    expect(synced).toHaveLength(spotify.length);
    expect(synced).toEqual(local);
  });

  it("does not include removed songs (Basket Case, Drive)", async () => {
    const playlist = loadLocalPlaylist();
    const names = playlist.tracks.map((t) => t.name);

    expect(names).not.toContain("Basket Case");
    expect(names).not.toContain("Drive");
  });
});

describe("90s-hits playlist file", () => {
  it("has 55 tracks in the local JSON", () => {
    const playlist = loadLocalPlaylist();
    expect(playlist.tracks).toHaveLength(55);
  });
});
