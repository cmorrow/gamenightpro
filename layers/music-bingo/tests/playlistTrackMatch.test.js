import { describe, expect, it } from "vitest";
import {
  buildLocalTracksFromSpotify,
  matchTracksSpotifyFirst,
  titlesPartialMatch,
  trackMatchScore,
} from "../app/utils/playlistTrackMatch.js";

describe("playlistTrackMatch", () => {
  it("allows edited bingo titles via partial match", () => {
    expect(
      titlesPartialMatch("Hit Me Baby One More Time", "...Baby One More Time"),
    ).toBe(true);
    expect(
      titlesPartialMatch("Gangsta's Paradise", "Gangsta Paradise"),
    ).toBe(true);
  });

  it("rejects weak single-word partial matches", () => {
    expect(titlesPartialMatch("Basket Case", "Case")).toBe(false);
    expect(titlesPartialMatch("Jump", "Jump Around")).toBe(false);
    expect(titlesPartialMatch("Drive", "Drive All Night")).toBe(false);
  });

  it("drops local songs that are not on Spotify", () => {
    const local = [
      { name: "Basket Case", artist: "Green Day" },
      { name: "Drive", artist: "Incubus" },
      { name: "Zombie", artist: "The Cranberries" },
    ];
    const spotify = [
      { text: "Zombie", sub: "The Cranberries", artists: ["The Cranberries"] },
      { text: "When I Come Around", sub: "Green Day", artists: ["Green Day"] },
    ];

    const { pairs, unmatchedLocal } = matchTracksSpotifyFirst(local, spotify);
    const built = buildLocalTracksFromSpotify(local, spotify, pairs);

    expect(unmatchedLocal.map((t) => t.name).sort()).toEqual(["Basket Case", "Drive"]);
    expect(built).toHaveLength(2);
    expect(built.some((t) => t.name === "Basket Case")).toBe(false);
    expect(built.some((t) => t.name === "Drive")).toBe(false);
  });

  it("keeps curated local title when Spotify uses the canonical name", () => {
    const local = [
      { name: "Hit Me Baby One More Time", artist: "Britney Spears" },
    ];
    const spotify = [
      {
        text: "...Baby One More Time",
        sub: "Britney Spears",
        artists: ["Britney Spears"],
      },
    ];

    const { pairs } = matchTracksSpotifyFirst(local, spotify);
    const built = buildLocalTracksFromSpotify(local, spotify, pairs);

    expect(trackMatchScore(local[0], spotify[0])).toBeGreaterThan(0);
    expect(built[0].name).toBe("Hit Me Baby One More Time");
  });

  it("matches on originalName even when the display title is edited beyond recognition", () => {
    const local = [
      {
        name: "Our Wedding Song!",
        artist: "*NSYNC",
        originalName: "Bye Bye Bye",
        originalArtist: "*NSYNC",
      },
    ];
    const spotify = [
      { text: "Bye Bye Bye", sub: "*NSYNC", artists: ["*NSYNC"] },
    ];

    expect(trackMatchScore(local[0], spotify[0])).toBe(2);

    const { pairs, unmatchedLocal } = matchTracksSpotifyFirst(local, spotify);
    expect(unmatchedLocal).toHaveLength(0);

    const built = buildLocalTracksFromSpotify(local, spotify, pairs);
    expect(built[0].name).toBe("Our Wedding Song!");
    expect(built[0].originalName).toBe("Bye Bye Bye");
  });

  it("refreshes originalName/originalArtist from Spotify while keeping the local override", () => {
    const local = [
      {
        name: "Custom Title",
        artist: "Custom Artist",
        originalName: "Old Spotify Title",
        originalArtist: "Old Spotify Artist",
      },
    ];
    const spotify = [
      { text: "Old Spotify Title", sub: "Old Spotify Artist", artists: ["Old Spotify Artist"] },
    ];

    const { pairs } = matchTracksSpotifyFirst(local, spotify);
    const built = buildLocalTracksFromSpotify(local, spotify, pairs);

    expect(built[0].name).toBe("Custom Title");
    expect(built[0].artist).toBe("Custom Artist");
    expect(built[0].originalName).toBe("Old Spotify Title");
    expect(built[0].originalArtist).toBe("Old Spotify Artist");
  });

  it("sets originalName/originalArtist to the Spotify values for brand-new tracks", () => {
    const local = [];
    const spotify = [
      { text: "New Song", sub: "New Artist", artists: ["New Artist"] },
    ];

    const { pairs } = matchTracksSpotifyFirst(local, spotify);
    const built = buildLocalTracksFromSpotify(local, spotify, pairs);

    expect(built[0]).toEqual({
      name: "New Song",
      artist: "New Artist",
      originalName: "New Song",
      originalArtist: "New Artist",
    });
  });
});
