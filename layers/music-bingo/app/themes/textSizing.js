function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Average glyph width as a fraction of font size, for mixed-case text in the
// card's sans-serif font. Used to estimate how many characters fit per
// wrapped line at a given font size.
export const CHAR_WIDTH_FACTOR = 0.52;
const MAX_TITLE_LINES = 6;
const MIN_TITLE_LEADING = 0.95;
const MAX_TITLE_LEADING = 1.15;

// Approximate width a title/word has to wrap within, calibrated from the
// printed letter-size card layout (see cardWidthPx in PrintableBingoPages).
export function getCellContentPx(gridSize) {
  return Number(gridSize) === 5 ? 67 : 85;
}

function estimateLines(len, fontSizePx, cellContentPx) {
  const charsPerLine = Math.max(1, Math.floor(cellContentPx / (fontSizePx * CHAR_WIDTH_FACTOR)));
  return Math.max(1, Math.ceil(len / charsPerLine));
}

/**
 * Shared text sizing rules for all themes.
 * Keeps text mostly uniform while allowing small, card-level adaptation
 * based on the longest title/subtitle in that card.
 */
export function getCardTextVars(cells, { gridSize = 4, showArtist = false } = {}) {
  const n = Number(gridSize) === 5 ? 5 : 4;

  const titleBase = n === 4 ? 20 : 16;
  const titleFloor = n === 4 ? 10 : 8;
  const subBase = n === 4 ? 12 : 10;
  const subLines = showArtist ? 1 : 0;

  const cellContentPx = getCellContentPx(n);

  const textCells = (cells || []).filter((c) => c && c.text && c.text !== "FREE");
  let maxTitleLen = 0;
  let maxSubLen = 0;

  for (const cell of textCells) {
    maxTitleLen = Math.max(maxTitleLen, String(cell.text || "").trim().length);
    if (showArtist) {
      maxSubLen = Math.max(maxSubLen, String(cell.sub || "").trim().length);
    }
  }

  // Shrink font size, then (once the font floor is hit) line spacing, until
  // the estimated wrapped title fits within the cell. Capped at
  // MAX_TITLE_LINES so a pathologically long title degrades gracefully
  // instead of overflowing top and bottom.
  let titleSize = titleBase;
  let titleLeading = MAX_TITLE_LEADING;
  for (let guard = 0; guard < 40; guard++) {
    const lines = estimateLines(maxTitleLen, titleSize, cellContentPx);
    const linesFit = Math.max(1, Math.floor(cellContentPx / (titleSize * titleLeading)));
    if (lines <= Math.min(linesFit, MAX_TITLE_LINES)) break;
    if (titleSize > titleFloor) {
      titleSize = Math.max(titleFloor, titleSize - 0.5);
    } else if (titleLeading > MIN_TITLE_LEADING) {
      titleLeading = Math.max(MIN_TITLE_LEADING, titleLeading - 0.02);
    } else {
      break;
    }
  }

  let subReduction = 0;
  if (showArtist) {
    if (maxSubLen > 22) subReduction += 1;
    if (maxSubLen > 32) subReduction += 1;
  }
  const subSize = clamp(subBase - subReduction, n === 4 ? 10 : 8, subBase);
  const freeSize = clamp(titleSize - (n === 4 ? 4 : 2), 11, titleSize);
  const titleLines = Math.min(MAX_TITLE_LINES, estimateLines(maxTitleLen, titleSize, cellContentPx));

  return {
    "--cell-text-size": `${titleSize}px`,
    "--cell-text-lines": String(titleLines),
    "--cell-text-leading": String(titleLeading),
    "--cell-sub-size": `${subSize}px`,
    "--cell-sub-lines": String(subLines),
    "--free-text-size": `${freeSize}px`,
  };
}
