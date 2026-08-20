import { describe, expect, it } from "vitest";
import { getQuickRequestAction, isActiveRequestStatus, matchesCatalogFilters, normalizePlatformMode, sortCatalogGames } from "./booking";

describe("booking platform rules", () => {
  it("treats open workflow states as active for duplicate prevention", () => {
    expect(isActiveRequestStatus("requested")).toBe(true);
    expect(isActiveRequestStatus("reviewing")).toBe(true);
    expect(isActiveRequestStatus("owned")).toBe(true);
    expect(isActiveRequestStatus("support-pending")).toBe(true);
    expect(isActiveRequestStatus("scheduled")).toBe(true);
    expect(isActiveRequestStatus("completed")).toBe(false);
  });

  it("falls back safely when a platform mode is invalid", () => {
    expect(normalizePlatformMode("playstation")).toBe("playstation");
    expect(normalizePlatformMode("xbox")).toBe("xbox");
    expect(normalizePlatformMode("steam")).toBe("all");
    expect(normalizePlatformMode(undefined)).toBe("all");
  });
});


describe("catalog sorting", () => {
  const games = [
    { title: "Zeta", releaseDate: "2024-01-01", popularityScore: 90, queue: 1, platform: "xbox" as const },
    { title: "Alpha", releaseDate: "2025-01-01", popularityScore: 20, queue: 2, platform: "playstation" as const },
    { title: "Beta", releaseDate: null, popularityScore: 120, queue: 3, platform: "xbox" as const },
  ];

  it("orders newest releases first and puts undated games last", () => {
    expect(sortCatalogGames(games, "release").map((game) => game.title)).toEqual(["Alpha", "Zeta", "Beta"]);
  });

  it("orders highest popularity first", () => {
    expect(sortCatalogGames(games, "popularity").map((game) => game.title)).toEqual(["Beta", "Zeta", "Alpha"]);
  });

  it("orders alphabetically", () => {
    expect(sortCatalogGames(games, "alphabetical").map((game) => game.title)).toEqual(["Alpha", "Beta", "Zeta"]);
  });

  it("composes search, platform, ownership, and sorting", () => {
    const filtered = games.filter((game) => matchesCatalogFilters({ ...game, genre: "RPG", note: "Catalog", status: "open" }, "xbox", "available", "zeta"));
    expect(sortCatalogGames(filtered, "popularity").map((game) => game.title)).toEqual(["Zeta"]);
  });
});

describe("quick request card states", () => {
  it("shows Request Game only for an available card without an active request", () => {
    expect(getQuickRequestAction("open", false)).toBe("request");
    expect(getQuickRequestAction("owned", false)).toBe("owned");
  });

  it("shows follow-existing-request for duplicate prevention", () => {
    expect(getQuickRequestAction("open", true)).toBe("follow");
    expect(getQuickRequestAction("owned", true)).toBe("follow");
  });
});

describe("catalog filters", () => {
  const games = [
    { title: "Red Dead Redemption 2", genre: "Open-world western", note: "Already in rotation", platform: "xbox" as const, status: "owned" as const },
    { title: "Returnal", genre: "Roguelike shooter", note: "PlayStation pressure run", platform: "playstation" as const, status: "open" as const },
    { title: "Elden Ring", genre: "Action RPG", note: "Big bosses", platform: "xbox" as const, status: "open" as const },
  ];

  it("matches title and genre search case-insensitively", () => {
    expect(matchesCatalogFilters(games[0], "all", "all", "red dead")).toBe(true);
    expect(matchesCatalogFilters(games[1], "all", "all", "ROGUELIKE")).toBe(true);
    expect(matchesCatalogFilters(games[2], "all", "all", "western")).toBe(false);
  });

  it("filters by ownership and platform", () => {
    expect(matchesCatalogFilters(games[0], "xbox", "owned", "")).toBe(true);
    expect(matchesCatalogFilters(games[0], "playstation", "owned", "")).toBe(false);
    expect(matchesCatalogFilters(games[1], "playstation", "available", "")).toBe(true);
    expect(matchesCatalogFilters(games[0], "xbox", "available", "")).toBe(false);
  });

  it("supports combined platform, ownership, and search filters", () => {
    expect(matchesCatalogFilters(games[2], "xbox", "available", "elden")).toBe(true);
    expect(matchesCatalogFilters(games[2], "xbox", "available", "returnal")).toBe(false);
  });
});
