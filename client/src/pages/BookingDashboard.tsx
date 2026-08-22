import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, CircleAlert, Gamepad2, Lightbulb, Lock, Radio, Search, Send, Users, X } from "lucide-react";
import { getQuickRequestAction, isActiveRequestStatus, matchesCatalogFilters, sortCatalogGames, type CatalogFilter, type CatalogSort, type PlatformMode, type RequestStatus } from "@/lib/booking";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";

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
const storyDrivenPriority = ["Red Dead Redemption 2", "Kingdom Come: Deliverance II", "Grand Theft Auto V", "S.T.A.L.K.E.R. 2"];
const storyDrivenRank = (title: string) => {
  const index = storyDrivenPriority.indexOf(title);
  return index === -1 ? storyDrivenPriority.length : index;
};

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
      setNotice(result.created ? "Stream request submitted. The streamer will review it and update the public status." : "This title already has an active stream request. Follow the existing queue item instead of creating another.");
      void publicRequestsQuery.refetch();
      setSelectedGame(null);
      setViewerHandle("");
    },
    onError: (error) => setNotice(error.data?.code === "UNAUTHORIZED" ? "Sign in before submitting a stream request." : error.message),
  });
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [viewerHandle, setViewerHandle] = useState("");
  const [viewerPlatform, setViewerPlatform] = useState("TikTok");
  const [showPrivate, setShowPrivate] = useState(false);
  const [notice, setNotice] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionPlatform, setSuggestionPlatform] = useState<Platform>("xbox");
  const [suggestionNote, setSuggestionNote] = useState("");
  const suggestGame = trpc.booking.suggestGame.useMutation({
    onSuccess: (result) => { setNotice(result.created ? "Game suggestion sent to the creator for review." : "That title is already in the creator’s suggestion queue."); setShowSuggestion(false); setSuggestionTitle(""); setSuggestionNote(""); },
    onError: (error) => setNotice(error.data?.code === "UNAUTHORIZED" ? "Sign in before suggesting a game." : error.message),
  });

  const persistedGames = useMemo<Game[]>(() => (catalogQuery.data ?? []).map((game, index) => ({ id: String(game.id), dbId: game.id, title: game.title, genre: game.genre ?? "Catalog title", platform: game.platform, status: game.ownershipStatus === "owned" ? "owned" : "open", note: game.note ?? "Creator-confirmed catalog entry.", releaseDate: game.releaseDate, popularityScore: game.popularityScore, queue: index + 1 })), [catalogQuery.data]);
  const boardGames = useMemo(() => [...persistedGames].sort((a, b) => storyDrivenRank(a.title) - storyDrivenRank(b.title)), [persistedGames]);
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

  const submitSuggestion = () => {
    const title = suggestionTitle.trim();
    if (title.length < 2 || !profile.data?.id) return;
    if (!auth.data) { setNotice("Sign in before suggesting a game. Your account remains private."); startLogin(); return; }
    suggestGame.mutate({ streamerProfileId: profile.data.id, title, platform: suggestionPlatform, note: suggestionNote.trim() || undefined });
  };

  const submitRequest = () => {
    if (!selectedGame || !viewerHandle.trim()) return;
    if (!auth.data) {
      setNotice("Sign in to submit a stream request. Your viewer identity remains private on the public board.");
      startLogin();
      return;
    }
    if (!selectedGame.dbId || !profile.data?.id) {
      setNotice("This catalog entry is still being prepared for booking. Please try again once the creator catalog is published.");
      return;
    }
    const existing = activeRequestFor(selectedGame.id);
    if (existing) {
      setNotice("This title already has an active stream request. Follow the existing queue item instead of creating another.");
      setSelectedGame(null);
      return;
    }
    createRequest.mutate({ streamerProfileId: profile.data.id, gameId: selectedGame.dbId, viewerHandle: viewerHandle.trim(), viewerPlatform });
  };

  return (
    <main className="booking-page" data-platform={mode}><div className="booking-page__background" aria-hidden="true"><span>LIVE CONTROL ROOM / REQUEST BOARD</span></div>
      <header className="booking-header">
        <div>
          <p className="eyebrow"><span /> REQUEST A STREAM / CREATOR BOARD</p>
          <h1>Choose the next <em>story.</em></h1>
          <p className="booking-lede">Choose a game and request a stream. The streamer reviews each request, confirms ownership, and decides when or whether it fits the stream schedule. No money, codes, or purchases move through this site.</p>
        </div>
        <div className="booking-creator-card">
          <div className="booking-avatar">AL</div>
          <div><strong>{profile.data?.displayName ?? creatorSlug}</strong><span><span className="live-dot" /> Approved creator</span></div>
        </div>
        <Link href="/apply/creator" className="booking-creator-apply"><Users size={15} /> Are you a creator? Apply for a portfolio</Link>
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

      <section className="booking-how-it-works" aria-labelledby="booking-how-heading">
        <div className="booking-how-it-works__heading"><p className="eyebrow">HOW IT WORKS</p><h2 id="booking-how-heading">Three moves from idea to stream request.</h2><p>Keep it simple: choose a title, send the request, and let the creator decide what fits.</p></div>
        <div className="booking-how-it-works__steps">
          <article className="booking-how-step"><span>01</span><div><h3>Choose a title</h3><p>Browse the approved catalog or suggest a game that belongs on the board.</p></div></article>
          <article className="booking-how-step"><span>02</span><div><h3>Request a stream</h3><p>Sign in and share the streaming username the creator should recognize. Your identity stays private.</p></div></article>
          <article className="booking-how-step"><span>03</span><div><h3>The creator reviews</h3><p>Ownership, timing, and fit stay with the creator. A request is not a purchase, payment, contract, or guarantee.</p></div></article>
        </div>
      </section>

      <div className="booking-grid">
        <section className="booking-catalog" aria-labelledby="catalog-heading">
          <div className="booking-section-heading"><div><p className="eyebrow">CREATOR CATALOG</p><h2 id="catalog-heading">Request a stream.</h2><p className="booking-section-intro">Start with the story-driven picks below, or search the creator’s full approved catalog.</p></div><div className="booking-heading-actions"><span className="booking-count">{visibleGames.length} of {boardGames.length} titles</span><button type="button" className="booking-suggest-button" onClick={() => setShowSuggestion(true)}><Lightbulb size={15} /> Request a Game</button></div></div>
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
              return <article key={game.id} className={`booking-game-card booking-game-card--${game.platform} booking-game-card--story-${storyDrivenRank(game.title) + 1} ${game.status === "owned" ? "booking-game-card--owned" : ""}`}>
                <div className="booking-game-card__top"><span className="platform-chip">{platformLabel(game.platform)}</span><span>{storyDrivenPriority.includes(game.title) ? "STORY PICK" : "CATALOG"}</span></div>
                <div className="booking-game-card__art"><Gamepad2 size={30} /><span>{game.genre}</span>{game.status === "owned" && <strong>ALREADY OWNED</strong>}</div>
                <div className="booking-game-card__body"><h3>{game.title}</h3><p>{game.note}</p>
                  {quickRequestAction === "follow" && request ? <button type="button" className="booking-card-action booking-card-action--muted" onClick={() => setNotice(`${game.title}: ${statusCopy[request.status]}. Follow this public request instead of creating another.`)}><Users size={15} /> {statusCopy[request.status]} <ChevronRight size={15} /></button> : quickRequestAction === "request" ? <button type="button" className="booking-card-action booking-card-action--quick" onClick={() => setSelectedGame(game)} aria-label={`Request a stream for ${game.title}`}><Send size={15} /> Request a stream <ChevronRight size={15} /></button> : <span className="booking-card-action booking-card-action--owned"><Check size={15} /> Already owned</span>}
                </div>
              </article>;
            })}
          </div>
        </section>

        <aside className="booking-queue" aria-labelledby="queue-heading">
          <div className="booking-section-heading"><div><p className="eyebrow">PUBLIC REQUEST STATUS</p><h2 id="queue-heading">Community requests.</h2></div><span className="booking-count">{visibleRequests.length} live</span></div>
          <p className="booking-privacy"><Lock size={14} /> Viewer identities stay private. Only safe status is public.</p>
          <div className="booking-request-list">
            {publicRequestsQuery.isLoading ? <p className="booking-empty-state">Loading public request status…</p> : visibleRequests.length === 0 ? <p className="booking-empty-state">No public stream requests yet. Status will appear here after an approved creator publishes the catalog.</p> : visibleRequests.map((request) => { const game = boardGames.find((candidate) => candidate.id === request.gameId); if (!game) return null; return <article className="booking-request-card" key={request.id}><div className="booking-request-card__top"><span className="platform-chip">{platformLabel(game.platform)}</span><span>{request.createdAt}</span></div><h3>{game.title}</h3><div className="booking-request-card__status"><span className={`queue-dot queue-dot--${request.status}`} /> {statusCopy[request.status]}</div><p>{request.status === "owned" ? "Creator confirmed ownership. Timing can be coordinated on the mutual streaming platform." : "This request is visible to the community without exposing the viewer's identity."}</p></article>; })}
          </div>
          <button className="booking-privacy-toggle" type="button" onClick={() => setShowPrivate((value) => !value)}>{showPrivate ? "Hide private creator view" : "Preview private creator view"}</button>
          {showPrivate && <div className="booking-private-panel"><p className="eyebrow">PRIVATE CREATOR VIEW</p><p>Viewer handles are visible only to the approved creator and authorized administrators.</p>{visibleRequests.map((request) => <div className="booking-private-row" key={request.id}><strong>{request.viewerHandle}</strong><span>{request.viewerPlatform} · {statusCopy[request.status]}</span></div>)}</div>}
        </aside>
      </div>

      <section className="booking-disclosure"><CircleAlert size={18} /><p><strong>No-funds boundary.</strong> This is a stream request, not a purchase, payment, donation, contract, or guarantee. Xbox/PlayStation purchases, gift cards, wallet credit, codes, refunds, and eligibility stay on the platform’s own system.</p></section>

      {showSuggestion && <div className="booking-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowSuggestion(false); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="suggestion-modal-title"><button className="booking-modal__close" type="button" onClick={() => setShowSuggestion(false)} aria-label="Close game suggestion dialog"><X size={18} /></button><p className="eyebrow">CATALOG SUGGESTION</p><h2 id="suggestion-modal-title">Request a Game.</h2><p>Suggest a title for the creator to consider adding. This sends an idea for review; it does not purchase, gift, reserve, or transfer anything.</p><label>Game title<input value={suggestionTitle} onChange={(event) => setSuggestionTitle(event.target.value)} placeholder="e.g. Baldur’s Gate 3" maxLength={180} /></label><label>Platform<select value={suggestionPlatform} onChange={(event) => setSuggestionPlatform(event.target.value as Platform)}><option value="xbox">Xbox</option><option value="playstation">PlayStation</option></select></label><label>Optional note<textarea value={suggestionNote} onChange={(event) => setSuggestionNote(event.target.value)} placeholder="Why would this make a good stream?" maxLength={1000} rows={3} /></label><div className="booking-modal__hint"><Lock size={14} /> Your account identifies the suggestion privately to the creator. No money, codes, or platform transactions are handled here.</div><button className="signal-button signal-button--primary booking-modal__submit" type="button" onClick={submitSuggestion} disabled={suggestionTitle.trim().length < 2 || suggestGame.isPending}>Send game suggestion <Send size={16} /></button></section></div>}

      {selectedGame && <div className="booking-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedGame(null); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title"><button className="booking-modal__close" type="button" onClick={() => setSelectedGame(null)} aria-label="Close request dialog"><X size={18} /></button><p className="eyebrow">REQUEST A STREAM / {platformLabel(selectedGame.platform)}</p><h2 id="booking-modal-title">{selectedGame.title}</h2><p>Tell the creator which streaming identity to look for. They will confirm whether the game is already owned after reviewing the request.</p><label>Streaming platform<select value={viewerPlatform} onChange={(event) => setViewerPlatform(event.target.value)}><option>TikTok</option><option>Twitch</option><option>YouTube</option><option>Kick</option><option>Other</option></select></label><label>Streaming username<input value={viewerHandle} onChange={(event) => setViewerHandle(event.target.value)} placeholder="@yourhandle" /></label><div className="booking-modal__hint"><Lock size={14} /> Your account details stay private. The creator sees this streaming identity only to recognize you on the mutual platform.</div><button className="signal-button signal-button--primary booking-modal__submit" type="button" onClick={submitRequest} disabled={!viewerHandle.trim()}>Submit stream request <Send size={16} /></button></section></div>}
    </main>
  );
}
