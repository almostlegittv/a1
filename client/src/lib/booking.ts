export type PlatformMode = "xbox" | "playstation" | "all";
export type RequestStatus = "requested" | "reviewing" | "owned" | "support-pending" | "scheduled" | "completed";
export type CatalogFilter = "all" | "available" | "owned";
export type CatalogSort = "release" | "popularity" | "alphabetical";

export type CatalogFilterGame = { title: string; genre: string; note: string; platform: "xbox" | "playstation"; status: "open" | "owned" };

export type SortableCatalogGame = { title: string; releaseDate?: string | Date | null; popularityScore?: number | null; queue: number };

export function sortCatalogGames<T extends SortableCatalogGame>(games: T[], sort: CatalogSort) {
  return [...games].sort((a, b) => {
    if (sort === "alphabetical") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) || a.queue - b.queue;
    if (sort === "popularity") return (b.popularityScore ?? 0) - (a.popularityScore ?? 0) || a.title.localeCompare(b.title);
    const aRelease = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const bRelease = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    return bRelease - aRelease || a.title.localeCompare(b.title);
  });
}

export type QuickRequestAction = "request" | "follow" | "owned";

export function getQuickRequestAction(status: "open" | "owned", hasActiveRequest: boolean): QuickRequestAction {
  if (hasActiveRequest) return "follow";
  return status === "open" ? "request" : "owned";
}

export function matchesCatalogFilters(game: CatalogFilterGame, mode: PlatformMode, filter: CatalogFilter, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesPlatform = mode === "all" || game.platform === mode;
  const matchesFilter = filter === "all" || (filter === "owned" ? game.status === "owned" : game.status === "open");
  const matchesSearch = !normalizedQuery || `${game.title} ${game.genre} ${game.note}`.toLocaleLowerCase().includes(normalizedQuery);
  return matchesPlatform && matchesFilter && matchesSearch;
}

export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = ["requested", "reviewing", "owned", "support-pending", "scheduled"];

export function isActiveRequestStatus(status: RequestStatus) {
  return ACTIVE_REQUEST_STATUSES.includes(status);
}

export function normalizePlatformMode(value: string | null | undefined): PlatformMode {
  if (value === "xbox" || value === "playstation" || value === "all") return value;
  return "all";
}
