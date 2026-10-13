import { describe, expect, it } from "vitest";
import { getPlan, hasGameAccess } from "../../../shared/utils/plan";

describe("plan entitlements", () => {
  it("uses the requested monthly prices", () => {
    expect(getPlan("single-game").priceMonthly).toBe(14.99);
    expect(getPlan("all-games").priceMonthly).toBe(24.99);
  });

  it("limits an a la carte subscription to its selected game route", () => {
    expect(hasGameAccess("single-game", "music-bingo", "/music-bingo")).toBe(
      true,
    );
    expect(hasGameAccess("single-game", "music-bingo", "/trivia")).toBe(false);
  });

  it("allows all games on the all-games plan and does not restrict non-game routes", () => {
    expect(hasGameAccess("all-games", undefined, "/music-bingo")).toBe(true);
    expect(hasGameAccess("single-game", "trivia", "/account/billing")).toBe(
      true,
    );
  });
});
