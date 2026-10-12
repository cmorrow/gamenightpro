/** IDs match game / playlist “win pattern” selectors and persisted `bingoGameType`. */
export const BINGO_GAME_MODE_IDS = [
  "standard",
  "four-corners",
  "corners",
  "wine-glass",
  "blackout",
  "x",
  "border",
];

export const BINGO_GAME_MODES = [
  {
    id: "standard",
    label: "One line",
    shortLabel: "Standard bingo",
    description: "Complete any full row, column, or diagonal on your card.",
  },
  {
    id: "four-corners",
    label: "Plus sign",
    shortLabel: "Plus sign",
    description: "Mark the full center row and center column on your card.",
  },
  {
    id: "corners",
    label: "Four corners",
    shortLabel: "Four corners",
    description: "Mark all four corner squares on your card.",
  },
  {
    id: "wine-glass",
    label: "Wine glass",
    shortLabel: "Wine glass",
    description: "Mark the top row, the rim, the stem, and the base to form a wine glass.",
  },
  {
    id: "border",
    label: "Border",
    shortLabel: "Border",
    description: "Mark every square around the outer edge of the card.",
  },
  {
    id: "blackout",
    label: "Blackout",
    shortLabel: "Blackout",
    description: "Mark every square on the card to win.",
  },
  {
    id: "x",
    label: "X pattern",
    shortLabel: "X pattern",
    description: "Mark both diagonal lines through the center.",
  },
];

export function bingoModeMeta(id) {
  return BINGO_GAME_MODES.find((m) => m.id === id) || BINGO_GAME_MODES[0];
}

/** Patterns that rely on a single center cell and don't map onto an even-sized (4×4) grid. */
export const BINGO_GAME_MODES_UNSUPPORTED_ON_4X4 = [
  "x",
  "four-corners",
  "wine-glass",
];

/** Patterns whose shape only maps onto a 5×5 grid. */
export const BINGO_GAME_MODES_5X5_ONLY = ["wine-glass"];

export function isBingoGameModeSupportedForGridSize(id, gridSize) {
  const modeId = String(id);
  const size = Number(gridSize);
  if (BINGO_GAME_MODES_5X5_ONLY.includes(modeId) && size !== 5) return false;
  if (size !== 4) return true;
  return !BINGO_GAME_MODES_UNSUPPORTED_ON_4X4.includes(modeId);
}
