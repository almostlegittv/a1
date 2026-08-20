import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, CircleAlert, Gamepad2, Lock, Radio, Search, Send, Users, X } from "lucide-react";
import { getQuickRequestAction, isActiveRequestStatus, matchesCatalogFilters, sortCatalogGames, type CatalogFilter, type CatalogSort, type PlatformMode, type RequestStatus } from "@/lib/booking";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";

type Platform = "xbox" | "playstation";

type Game = {
  id: string;
  title: string;
  genre: string;
  platform: Platform;
  status: "open" | "owned";
  note: string;
  queue: number;
  releaseDate?: string | Date | null;
  popularityScore?: number | null;
  dbId?: number;
};

type Request = {
  id: string;
  gameId: string;
  viewerHandle: string;
  viewerPlatform: string;
  status: RequestStatus;
  createdAt: string;
  publicNote?: string;
};

const statusCopy: Record<RequestStatus, string> = {
  requested: "Requested",
  reviewing: "Streamer reviewing",
  owned: "Already owned",
  "support-pending": "Off-platform support pending",
  scheduled: "Scheduled",
  completed: "Completed",
};

const platformLabel = (platform: Platform) => (platform === "xbox" ? "XBOX" : "PLAYSTATION");

export default function BookingDashboard() {
  const [, routeParams] = useRoute("/booking/:creatorSlug");
  const creatorSlug = routeParams?.creatorSlug ?? "almostlegittv";
  const [mode, setMode] = useState<PlatformMode>(() => {
    if (typeof window === "undefined") return "all";
    const queryMode = new URLSearchParams(window.location.search).get("platform");
    const savedMode = window.sessionStorage.getItem("almostlegit-platform-mode");
    return queryMode === "xbox" || queryMode === "playstation" || queryMode === "all"
      ? queryMode
      : savedMode === "xbox" || savedMode === "playstation" || savedMode === "all"
        ? savedMode
        : "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("release");
  const profile = trpc.booking.profile.useQuery({ slug: creatorSlug }, { retry: false });
  const resolvedProfileId = profile.data?.id ?? 0;
  const catalogQuery = trpc.booking.catalog.useQuery({ streamerProfileId: resolvedProfileId }, { enabled: Boolean(profile.data?.id), retry: false });
  const publicRequestsQuery = trpc.booking.publicRequests.useQuery({ streamerProfileId: resolvedProfileId }, { enabled: Boolean(profile.data?.id), retry: false });
  const auth = trpc.auth.me.useQuery();
  const createRequest = trpc.booking.createRequest.useMutation({
    onSuccess: (result) => {
      setNotice(result.created ? "Request submitted. The streamer will confirm ownership and update the public status." : "This run already has an active request. Follow the existing queue item instead of creating duplicate work.");
      void publicRequestsQuery.refetch();
      setSelectedGame(null);
      setViewerHandle("");
    },
    onError: (error) => setNotice(error.data?.code === "UNAUTHORIZED" ? "Sign in before submitting a booking request." : error.message),
  });
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [viewerHandle, setViewerHandle] = useState("");
  const [viewerPlatform, setViewerPlatform] = useState("TikTok");
  const [showPrivate, setShowPrivate] = useState(false);
  const [notice, setNotice] = useState("");

  const persistedGames = useMemo<Game[]>(() => (catalogQuery.data ?? []).map((game, index) => ({ id: String(game.id), dbId: game.id, title: game.title, genre: game.genre ?? "Catalog title", platform: game.platform, status: game.ownershipStatus === "owned" ? "owned" : "open", note: game.note ?? "Creator-confirmed catalog entry.", releaseDate: game.releaseDate, popularityScore: game.popularityScore, queue: index + 1 })), [catalogQuery.data]);
  const boardGames = persistedGames;
  const persistedRequests = useMemo<Request[]>(() => (publicRequestsQuery.data ?? []).flatMap((request) => {
    if (request.status === "cancelled") return [];
    const status: RequestStatus = request.status === "support_pending" ? "support-pending" : request.status;
    return [{ id: String(request.id), gameId: String(request.gameId), viewerHandle: "Private viewer", viewerPlatform: request.platform, status, createdAt: new Date(request.createdAt).toLocaleDateString(), publicNote: request.publicNote ?? undefined }];
  }), [publicRequestsQuery.data]);
  const boardRequests = persistedRequests;
  const visibleGames = useMemo(() => sortCatalogGames(boardGames.filter((game) => matchesCatalogFilters(game, mode, catalogFilter, searchQuery)), catalogSort), [boardGames, catalogFilter, catalogSort, mode, searchQuery]);
  useEffect(() => {
    window.sessionStorage.setItem("almostlegit-platform-mode", mode);
    const url = new URL(window.location.href);
    if (mode === "all") url.searchParams.delete("platform");
    else url.searchParams.set("platform", mode);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [mode]);

  const visibleRequests = useMemo(
    () => mode === "all" ? boardRequests : boardRequests.filter((request) => boardGames.find((game) => game.id === request.gameId)?.platform === mode),
    [boardGames, boardRequests, mode],
  );

  const activeRequestFor = (gameId: string) => boardRequests.find((request) => request.gameId === gameId && isActiveRequestStatus(request.status));

  const submitRequest = () => {
    if (!selectedGame || !viewerHandle.trim()) return;
    if (!auth.data) {
      setNotice("Sign in to submit a booking request. Your viewer identity remains private on the public board.");
      startLogin();
      return;
    }
    if (!selectedGame.dbId || !profile.data?.id) {
      setNotice("This catalog entry is still being prepared for booking. Please try again once the creator catalog is published.");
      return;
    }
    const existing = activeRequestFor(selectedGame.id);
    if (existing) {
      setNotice("This run already has an active request. Follow the existing queue item instead of creating duplicate work.");
      setSelectedGame(null);
      return;
    }
    createRequest.mutate({ streamerProfileId: profile.data.id, gameId: selectedGame.dbId, viewerHandle: viewerHandle.trim(), viewerPlatform });
  };

  return (
    <main className="booking-page" data-platform={mode}>
      <header className="booking-header">
        <div>
          <p className="eyebrow"><span /> BOOKING CONTROL / CREATOR 001</p>
          <h1>Choose the next <em>run.</em></h1>
          <p className="booking-lede">Browse the full catalog, request a game, and let the streamer confirm ownership after the request. No money or codes move through this site.</p>
        </div>
        <div className="booking-creator-card">
          <div className="booking-avatar">AL</div>
          <div><strong>{profile.data?.displayName ?? creatorSlug}</strong><span><span className="live-dot" /> Approved creator</span></div>
        </div>
      </header>

      <section className="platform-switcher" aria-label="Choose platform mode">
        <div className="platform-switcher__label"><Radio size={15} /> PLATFORM MODE</div>
        {(["all", "xbox", "playstation"] as PlatformMode[]).map((option) => (
          <button key={option} type="button" onClick={() => setMode(option)} className={mode === option ? "platform-switcher__button platform-switcher__button--active" : "platform-switcher__button"} aria-pressed={mode === option}>
            {option === "all" ? "All platforms" : platformLabel(option)}
          </button>
        ))}
        <span className="platform-switcher__active">{mode === "all" ? "MIXED BOARD" : `${platformLabel(mode)} MODE ACTIVE`}</span>
      </section>

      {notice && <div className="booking-notice" role="status"><Check size={17} /> <span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button></div>}

      <div className="booking-grid">
        <section className="booking-catalog" aria-labelledby="catalog-heading">
          <div className="booking-section-heading"><div><p className="eyebrow">01 / CREATOR CATALOG</p><h2 id="catalog-heading">Every game on the board.</h2></div><span className="booking-count">{visibleGames.length} of {boardGames.length} titles</span></div>
          <div className="booking-catalog-tools" aria-label="Search and filter catalog">
            <label className="booking-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search games by title or genre</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title or genre…" aria-label="Search games by title or genre" /></label>
            <div className="booking-filter-group" aria-label="Filter catalog by ownership">
              {(["all", "available", "owned"] as CatalogFilter[]).map((filter) => <button key={filter} type="button" className={catalogFilter === filter ? "booking-filter booking-filter--active" : "booking-filter"} onClick={() => setCatalogFilter(filter)} aria-pressed={catalogFilter === filter}>{filter === "all" ? "All games" : filter === "available" ? "Available to request" : "Already owned"}</button>)}
            </div>
            <label className="booking-sort"><span>Sort by</span><select value={catalogSort} onChange={(event) => setCatalogSort(event.target.value as CatalogSort)} aria-label="Sort games"><option value="release">Newest releases</option><option value="popularity">Most popular</option><option value="alphabetical">Alphabetical</option></select></label>
            {(searchQuery || catalogFilter !== "all" || catalogSort !== "release") && <button type="button" className="booking-clear-filters" onClick={() => { setSearchQuery(""); setCatalogFilter("all"); setCatalogSort("release"); }}>Clear filters</button>}
          </div>
          <div className="booking-game-grid">
            {profile.isLoading || catalogQuery.isLoading ? <p className="booking-empty-state">Loading the approved creator catalog…</p> : !profile.data ? <p className="booking-empty-state">This creator profile is unavailable or not approved yet. Try another creator link.</p> : visibleGames.length === 0 ? <p className="booking-empty-state">The approved creator catalog is being prepared. No request can be submitted until a game is published.</p> : visibleGames.map((game) => {
              const request = activeRequestFor(game.id);
              const quickRequestAction = getQuickRequestAction(game.status, Boolean(request));
              return <article key={game.id} className={`booking-game-card booking-game-card--${game.platform} ${game.status === "owned" ? "booking-game-card--owned" : ""}`}>
                <div className="booking-game-card__top"><span className="platform-chip">{platformLabel(game.platform)}</span><span>QUEUE 0{game.queue}</span></div>
                <div className="booking-game-card__art"><Gamepad2 size={30} /><span>{game.genre}</span>{game.status === "owned" && <strong>ALREADY OWNED</strong>}</div>
                <div className="booking-game-card__body"><h3>{game.title}</h3><p>{game.note}</p>
                  {quickRequestAction === "follow" && request ? <button type="button" className="booking-card-action booking-card-action--muted" onClick={() => setNotice(`${game.title}: ${statusCopy[request.status]}. Follow this public request instead of creating another.`)}><Users size={15} /> {statusCopy[request.status]} <ChevronRight size={15} /></button> : quickRequestAction === "request" ? <button type="button" className="booking-card-action booking-card-action--quick" onClick={() => setSelectedGame(game)} aria-label={`Request ${game.title}`}><Send size={15} /> Request Game <ChevronRight size={15} /></button> : <span className="booking-card-action booking-card-action--owned"><Check size={15} /> Already owned</span>}
                </div>
              </article>;
            })}
          </div>
        </section>

        <aside className="booking-queue" aria-labelledby="queue-heading">
          <div className="booking-section-heading"><div><p className="eyebrow">02 / PUBLIC STATUS</p><h2 id="queue-heading">Community queue.</h2></div><span className="booking-count">{visibleRequests.length} live</span></div>
          <p className="booking-privacy"><Lock size={14} /> Viewer identities stay private. Only safe status is public.</p>
          <div className="booking-request-list">
            {publicRequestsQuery.isLoading ? <p className="booking-empty-state">Loading public request status…</p> : visibleRequests.length === 0 ? <p className="booking-empty-state">No public booking requests yet. Status will appear here after an approved creator publishes the catalog.</p> : visibleRequests.map((request) => { const game = boardGames.find((candidate) => candidate.id === request.gameId); if (!game) return null; return <article className="booking-request-card" key={request.id}><div className="booking-request-card__top"><span className="platform-chip">{platformLabel(game.platform)}</span><span>{request.createdAt}</span></div><h3>{game.title}</h3><div className="booking-request-card__status"><span className={`queue-dot queue-dot--${request.status}`} /> {statusCopy[request.status]}</div><p>{request.status === "owned" ? "Creator confirmed ownership. Timing can be coordinated on the mutual streaming platform." : "This request is visible to the community without exposing the viewer's identity."}</p></article>; })}
          </div>
          <button className="booking-privacy-toggle" type="button" onClick={() => setShowPrivate((value) => !value)}>{showPrivate ? "Hide private creator view" : "Preview private creator view"}</button>
          {showPrivate && <div className="booking-private-panel"><p className="eyebrow">PRIVATE CREATOR VIEW</p><p>Viewer handles are visible only to the approved creator and authorized administrators.</p>{visibleRequests.map((request) => <div className="booking-private-row" key={request.id}><strong>{request.viewerHandle}</strong><span>{request.viewerPlatform} · {statusCopy[request.status]}</span></div>)}</div>}
        </aside>
      </div>

      <section className="booking-disclosure"><CircleAlert size={18} /><p><strong>No-funds boundary.</strong> This is a stream request, not a purchase, payment, donation, contract, or guarantee. Xbox/PlayStation purchases, gift cards, wallet credit, codes, refunds, and eligibility stay on the platform’s own system.</p></section>

      {selectedGame && <div className="booking-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedGame(null); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title"><button className="booking-modal__close" type="button" onClick={() => setSelectedGame(null)} aria-label="Close request dialog"><X size={18} /></button><p className="eyebrow">REQUEST THIS RUN / {platformLabel(selectedGame.platform)}</p><h2 id="booking-modal-title">{selectedGame.title}</h2><p>Tell the creator which streaming identity to look for. They will confirm whether the game is already owned after reviewing the request.</p><label>Streaming platform<select value={viewerPlatform} onChange={(event) => setViewerPlatform(event.target.value)}><option>TikTok</option><option>Twitch</option><option>YouTube</option><option>Kick</option><option>Other</option></select></label><label>Streaming username<input value={viewerHandle} onChange={(event) => setViewerHandle(event.target.value)} placeholder="@yourhandle" /></label><div className="booking-modal__hint"><Lock size={14} /> Your account details stay private. The creator sees this streaming identity only to recognize you on the mutual platform.</div><button className="signal-button signal-button--primary booking-modal__submit" type="button" onClick={submitRequest} disabled={!viewerHandle.trim()}>Submit request <Send size={16} /></button></section></div>}
    </main>
  );
}
