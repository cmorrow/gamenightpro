// Flags song titles containing "remastered" or a four-digit year (e.g. "1999", "2010").
const FLAG_PATTERN = /remaster(?:ed)?|\b(?:19|20)\d{2}\b/i;

export function findDuplicateTrackNames(tracks) {
  const seen = new Set();
  const duplicates = new Set();
  for (const t of tracks || []) {
    const key = String(t?.name || "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      duplicates.add(String(t.name).trim());
    } else {
      seen.add(key);
    }
  }
  return [...duplicates];
}

export function findFlaggedTrackNames(tracks) {
  const flagged = new Set();
  for (const t of tracks || []) {
    const name = String(t?.name || "").trim();
    if (name && FLAG_PATTERN.test(name)) flagged.add(name);
  }
  return [...flagged];
}

export function validateTracks(tracks) {
  return {
    duplicates: findDuplicateTrackNames(tracks),
    flagged: findFlaggedTrackNames(tracks),
  };
}

export function hasValidationIssues({ duplicates, flagged }) {
  return duplicates.length > 0 || flagged.length > 0;
}
