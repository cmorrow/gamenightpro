/** Lowercase, strip punctuation/accents for fuzzy title + artist comparison. */
export function normalizeForMatch(value) {
  const base = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base
    .split(" ")
    .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word))
    .join(" ");
}

function spotifyTrackName(track) {
  return track?.text ?? track?.name ?? "";
}

function spotifyTrackArtist(track) {
  return track?.sub ?? track?.artist ?? "";
}

export function spotifyTrackArtists(track) {
  if (Array.isArray(track?.artists) && track.artists.length) {
    return track.artists.map((a) => String(a || "").trim()).filter(Boolean);
  }
  const primary = spotifyTrackArtist(track);
  if (!primary) return [];
  return primary
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

export function artistsCompatible(localArtist, spotifyTrackOrArtist) {
  const local = normalizeForMatch(localArtist);
  if (!local) return true;
  const spotifyArtists =
    typeof spotifyTrackOrArtist === "object" && spotifyTrackOrArtist !== null
      ? spotifyTrackArtists(spotifyTrackOrArtist)
      : spotifyTrackArtists({ sub: spotifyTrackOrArtist });
  if (!spotifyArtists.length) return true;
  return spotifyArtists.some((spot) => {
    const b = normalizeForMatch(spot);
    if (!b) return true;
    return local === b || local.includes(b) || b.includes(local);
  });
}

export function titlesExactMatch(a, b) {
  return normalizeForMatch(a) === normalizeForMatch(b);
}

/** Significant tokens for word-overlap partial matching. */
function significantTitleWords(value) {
  return normalizeForMatch(value)
    .split(" ")
    .filter((word) => word.length >= 3);
}

/** One normalized title contains the other (min 8 chars) — handles edited bingo titles. */
export function titlesPartialMatch(a, b) {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  if (shorter.length >= 8 && longer.includes(shorter)) return true;

  const wordsA = significantTitleWords(a);
  const wordsB = significantTitleWords(b);
  const shorterWords = wordsA.length <= wordsB.length ? wordsA : wordsB;
  const longerWords = new Set(wordsA.length > wordsB.length ? wordsA : wordsB);
  if (shorterWords.length < 2) return false;

  const overlap = shorterWords.filter((word) => longerWords.has(word)).length;
  return overlap >= Math.max(2, Math.ceil(shorterWords.length * 0.75));
}

/**
 * Anchor for matching a local track against Spotify: the original Spotify-sourced
 * title/artist, so a locally edited display title never breaks sync/dedup.
 * Falls back to name/artist for tracks that predate originalName/originalArtist.
 */
function matchAnchor(localTrack) {
  return {
    name: localTrack.originalName || localTrack.name,
    artist: localTrack.originalArtist || localTrack.artist,
  };
}

/** 0 = no match, 1 = partial title, 2 = exact title (artist must be compatible). */
export function trackMatchScore(localTrack, spotifyTrack) {
  const anchor = matchAnchor(localTrack);
  if (!artistsCompatible(anchor.artist, spotifyTrack)) return 0;
  const spotName = spotifyTrackName(spotifyTrack);
  if (titlesExactMatch(anchor.name, spotName)) return 2;
  if (titlesPartialMatch(anchor.name, spotName)) return 1;
  return 0;
}

/**
 * Pair local JSON tracks with Spotify rows. Unmatched Spotify rows are extras to remove.
 * Local titles are never overwritten — partial matches keep the app JSON version.
 */
export function matchLocalTracksToSpotify(localTracks, spotifyTracks) {
  const matchedSpotifyIndices = new Set();
  const pairs = [];

  function tryMatch(passMinScore) {
    for (let li = 0; li < localTracks.length; li++) {
      if (pairs.some((p) => p.localIndex === li)) continue;
      let bestSi = -1;
      let bestScore = 0;
      for (let si = 0; si < spotifyTracks.length; si++) {
        if (matchedSpotifyIndices.has(si)) continue;
        const score = trackMatchScore(localTracks[li], spotifyTracks[si]);
        if (score >= passMinScore && score > bestScore) {
          bestScore = score;
          bestSi = si;
        }
      }
      if (bestSi >= 0) {
        matchedSpotifyIndices.add(bestSi);
        pairs.push({ localIndex: li, spotifyIndex: bestSi, score: bestScore });
      }
    }
  }

  tryMatch(2);
  tryMatch(1);

  const toRemove = spotifyTracks.filter((_, i) => !matchedSpotifyIndices.has(i));
  const unmatchedLocal = localTracks.filter(
    (_, i) => !pairs.some((p) => p.localIndex === i),
  );

  return { pairs, toRemove, unmatchedLocal, matchedSpotifyIndices };
}

/**
 * Pair each Spotify row with a local track (Spotify-first). Unmatched local rows are dropped.
 */
export function matchTracksSpotifyFirst(localTracks, spotifyTracks) {
  const matchedLocalIndices = new Set();
  const pairs = [];

  function tryMatch(passMinScore) {
    for (let si = 0; si < spotifyTracks.length; si++) {
      if (pairs.some((p) => p.spotifyIndex === si)) continue;
      let bestLi = -1;
      let bestScore = 0;
      for (let li = 0; li < localTracks.length; li++) {
        if (matchedLocalIndices.has(li)) continue;
        const score = trackMatchScore(localTracks[li], spotifyTracks[si]);
        if (score >= passMinScore && score > bestScore) {
          bestScore = score;
          bestLi = li;
        }
      }
      if (bestLi >= 0) {
        matchedLocalIndices.add(bestLi);
        pairs.push({ localIndex: bestLi, spotifyIndex: si, score: bestScore });
      }
    }
  }

  tryMatch(2);
  tryMatch(1);

  const unmatchedLocal = localTracks.filter((_, i) => !matchedLocalIndices.has(i));
  const unmatchedSpotify = spotifyTracks.filter(
    (_, i) => !pairs.some((p) => p.spotifyIndex === i),
  );

  return { pairs, unmatchedLocal, unmatchedSpotify };
}

/**
 * Build local JSON tracks in Spotify order. Local display-title/artist overrides are
 * always kept on a real match; originalName/originalArtist are refreshed from Spotify
 * so the match anchor stays accurate even as the display override diverges further.
 */
export function buildLocalTracksFromSpotify(localTracks, spotifyTracks, pairs) {
  const pairBySpotifyIndex = new Map(pairs.map((p) => [p.spotifyIndex, p]));

  return spotifyTracks
    .map((spotifyTrack, si) => {
      const pair = pairBySpotifyIndex.get(si);
      const spotName = String(spotifyTrackName(spotifyTrack) || "").trim();
      const spotArtist = String(spotifyTrackArtist(spotifyTrack) || "").trim();

      if (pair && pair.score > 0) {
        const local = localTracks[pair.localIndex];
        return {
          name: local.name,
          artist: local.artist,
          originalName: spotName,
          originalArtist: spotArtist,
          ...(local.doNotPrint ? { doNotPrint: true } : {}),
        };
      }

      return {
        name: spotName,
        artist: spotArtist,
        originalName: spotName,
        originalArtist: spotArtist,
      };
    })
    .filter((t) => t.name);
}
