/**
 * SIGNAL RAID DESIGN REMINDER
 * Broadcast-control-room energy; graphite ground, Signal Green action states,
 * asymmetric rails, and games framed as future stream programming—not products.
 */
import { useEffect, useMemo, useState } from "react";
import { PAYPAL_QR_URL, PAYPAL_RECIPIENT, DONATION_SEPARATION_COPY } from "@/lib/donation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CirclePlay,
  Gamepad2,
  Gift,
  Menu,
  MessageCircle,
  Radio,
  Send,
  X,
  Youtube,
} from "lucide-react";

const ASSETS = {
  hero: "/assets/almostlegit-hero-broadcast.jpg",
  western: "/assets/almostlegit-game-western.jpg",
  survival: "/assets/almostlegit-game-survival.jpg",
  mark: "/assets/almostlegit-al-mark.png",
};

const SOCIALS = {
  tiktok: "https://www.tiktok.com/@almostlegittv",
  youtube: "https://youtube.com/@almostlegittv",
  twitch: "https://m.twitch.tv/almostlegittv/home",
  kick: "https://kick.com/almostlegittv",
  lnkBio: "https://lnk.bio/almostlegittv",
};

type GameStatus = "wishlist" | "received" | "streamed";

type Game = {
  title: string;
  genre: string;
  gameStatus: GameStatus;
  streamStatus: string;
  note: string;
  xboxUrl: string;
  art?: string;
  artLabel: string;
  featured?: boolean;
};

const GAMES: Game[] = [
  {
    title: "Red Dead Redemption 2",
    genre: "Open-world western",
    gameStatus: "streamed",
    streamStatus: "On rotation",
    note: "A campfire, a long ride, and the kind of story that deserves a full run.",
    xboxUrl: "https://www.xbox.com/games/store/red-dead-redemption-2/9N2ZDN7NWQKV/0010",
    art: ASSETS.western,
    artLabel: "A frontier ride at blue hour",
    featured: true,
  },
  {
    title: "S.T.A.L.K.E.R. 2",
    genre: "Survival FPS",
    gameStatus: "wishlist",
    streamStatus: "Ready when gifted",
    note: "Unforgiving survival exploration with plenty of room for chat to make bad decisions.",
    xboxUrl: "https://www.xbox.com/games/store/stalker-2-heart-of-chernobyl-xbox-edition/9p7zbf3s7pss",
    art: ASSETS.survival,
    artLabel: "A rain-soaked survival station at night",
    featured: true,
  },
  {
    title: "Elden Ring",
    genre: "Action RPG",
    gameStatus: "wishlist",
    streamStatus: "Support to schedule",
    note: "Big bosses, bigger maps, and absolutely no pretending the first try was a warm-up.",
    xboxUrl: "https://www.xbox.com/games/store/elden-ring/9P3J32CTXLRZ/0010",
    artLabel: "Abstract bronze dusk game art",
  },
  {
    title: "Cyberpunk 2077",
    genre: "Action RPG",
    gameStatus: "wishlist",
    streamStatus: "Support to schedule",
    note: "A deep dive into Night City—stories, side quests, and questionable driving choices.",
    xboxUrl: "https://www.xbox.com/games/store/cyberpunk-2077/BX3M8L83BBRW/0001",
    artLabel: "Abstract neon game art",
  },
];

const FILTERS: { id: "all" | GameStatus; label: string }[] = [
  { id: "all", label: "All games" },
  { id: "wishlist", label: "Wishlist" },
  { id: "received", label: "Gifted" },
  { id: "streamed", label: "On stream" },
];

const STATUS_COPY: Record<GameStatus, string> = {
  wishlist: "Wishlist",
  received: "Gift received",
  streamed: "Streamed",
};

function StatusChip({ status }: { status: GameStatus }) {
  const icon = status === "streamed" ? <CirclePlay size={13} /> : status === "received" ? <Check size={13} /> : <Gift size={13} />;
  return (
    <span className={`status-chip status-chip--${status}`}>
      {icon}
      {STATUS_COPY[status]}
    </span>
  );
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const giftable = game.gameStatus === "wishlist";
  return (
    <article className={`game-dossier game-dossier--${index + 1} ${game.featured ? "game-dossier--featured" : ""}`}>
      <div className="game-dossier__art">
        {game.art ? <img src={game.art} alt={game.artLabel} /> : <div className="game-dossier__synthetic-art" aria-label={game.artLabel} role="img" />}
        <div className="game-dossier__shade" />
        <div className="game-dossier__number"><span>QUEUE</span> 0{index + 1}</div>
        <StatusChip status={game.gameStatus} />
      </div>
      <div className="game-dossier__body">
        <div className="game-dossier__meta">
          <span>{game.genre}</span>
          <span className="game-dossier__stream">{game.streamStatus}</span>
        </div>
        <h3>{game.title}</h3>
        <span className="game-dossier__comment">CREATOR NOTE</span>
        <p>{game.note}</p>
        {giftable ? (
          <a className="link-action" href={game.xboxUrl} target="_blank" rel="noreferrer">
            Gift through Xbox — continue there <ArrowUpRight size={16} />
          </a>
        ) : (
          <a className="link-action" href={SOCIALS.youtube} target="_blank" rel="noreferrer">
            Watch current runs <ArrowUpRight size={16} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | GameStatus>("all");
  const [donationOpen, setDonationOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredGames = useMemo(
    () => (activeFilter === "all" ? GAMES : GAMES.filter((game) => game.gameStatus === activeFilter)),
    [activeFilter],
  );

  const closeNav = () => setNavOpen(false);
  useEffect(() => {
    if (!donationOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDonationOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [donationOpen]);

  const openDonationPanel = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDonationOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#10110f] text-[#f4f3eb]">
      <header className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}>
        <div className="site-nav__inner">
          <a className="brand" href="#top" aria-label="AlmostLegitTV home" onClick={closeNav}>
            <img className="brand__mark" src={ASSETS.mark} alt="" />
            <span className="brand__word">Almost<span>Legit</span>TV</span>
          </a>

          <nav className={`nav-links ${navOpen ? "nav-links--open" : ""}`} aria-label="Primary navigation">
            <a href="/booking" onClick={closeNav}>Booking board</a>
            <a href="#watch" onClick={closeNav}>Watch</a>
            <a href="#queue" onClick={closeNav}>Game queue</a>
            <a href="#support" onClick={closeNav}>Support</a>
            <a href="#how-it-works" onClick={closeNav}>How it works</a>
          </nav>

          <a className="nav-live" href={SOCIALS.tiktok} target="_blank" rel="noreferrer">
            <span className="live-dot" /> Live links
          </a>
          <button className="nav-toggle" type="button" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen} aria-label="Toggle menu">
            {navOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-image" style={{ backgroundImage: `url(${ASSETS.hero})` }} aria-hidden="true" />
          <div className="hero-scanlines" aria-hidden="true" />
          <div className="hero-section__content">
            <div className="eyebrow eyebrow--hero"><span /> Channel 001 · AlmostLegitTV</div>
            <h1>Gift a game.<br /><em>Set up the next stream.</em></h1>
            <p className="hero-section__lede">Game support is a direct way to back what shows up on stream next. Pick from the Xbox wishlist, then use Xbox/Microsoft’s own gifting flow to complete the purchase and delivery on their platform.</p>
            <div className="hero-section__actions">
              <a className="signal-button signal-button--primary" href="/booking">Open booking board <ArrowDownRight size={18} /></a>
              <a className="signal-button signal-button--quiet" href="#queue">Browse the game queue <ArrowDownRight size={18} /></a>
              <a className="signal-button signal-button--quiet" href={SOCIALS.tiktok} target="_blank" rel="noreferrer"><Radio size={17} /> Watch on TikTok</a>
              <button type="button" className="signal-button signal-button--donation" onClick={openDonationPanel}><Send size={17} /> Tip via PayPal</button>
            </div>
            <div className="hero-status-row">
              <div><span className="live-dot" /> Creator-led gaming</div>
              <div>Xbox Series S · Digital gifts</div>
            </div>
          </div>
          <div className="hero-section__program" aria-label="Current stream programming">
            <div className="program__top"><span>NOW PLAYING</span><span>01:42:18</span></div>
            <div className="program__line" />
            <div className="program__game">RDR2 <span>ON ROTATION</span></div>
            <p>Ride, roam, and let chat decide whether the plan survives.</p>
          </div>
        </section>

        <section className="ticker-section" aria-label="How game support works">
          <div className="ticker-section__rail" />
          <div className="ticker-section__content">
            <span className="ticker-kicker">GAME SUPPORT SIGNAL</span>
            <span>Pick a game from the queue</span><ChevronRight size={16} aria-hidden="true" />
            <span>Purchase happens through Xbox/Microsoft</span><ChevronRight size={16} aria-hidden="true" />
            <span>Xbox completes the gift on-platform</span>
          </div>
        </section>

        <section className="program-section" id="how-it-works">
          <div className="section-rail"><span>01 / THE DEAL</span><div /></div>
          <div className="program-section__grid">
            <h2>A game gift is more than a gift card.</h2>
            <div className="program-section__copy">
              <p>It is a clear signal that you want to see that game on AlmostLegitTV. A received game gets priority in the stream plan—think of it as supporting or effectively booking a future run, without locking anyone into a specific date.</p>
              <div className="notice-card">
                <Gift size={18} />
                <p><strong>This site does not process game purchases.</strong> The actual checkout happens off-site through Xbox/Microsoft. AlmostLegitTV never asks for your payment details or stores game codes.</p>
              </div>
            </div>
          </div>
          <div className="steps-row">
            <div className="step-card"><span>01</span><h3>Choose a title</h3><p>Find a game with a Wishlist status in the queue.</p></div>
            <div className="step-card"><span>02</span><h3>Buy off-site</h3><p>The Xbox link opens Microsoft’s own purchase page in a new tab.</p></div>
            <div className="step-card"><span>03</span><h3>Xbox completes delivery</h3><p>Xbox handles the gift, payment, and code delivery on its own platform. This site never receives or stores codes.</p></div>
          </div>
        </section>

        <section className="queue-section" id="queue">
          <div className="section-rail"><span>02 / GAME QUEUE</span><div /></div>
          <div className="queue-section__heading">
            <div>
              <p className="eyebrow">The playable list</p>
              <h2>What should hit the stream next?</h2>
            </div>
              <p>Every dossier names its queue position, game status, and stream signal. When a game arrives, its receipt and next-run status get updated here.</p>
          </div>
          <div className="filter-row" aria-label="Filter game queue">
            {FILTERS.map((filter) => (
              <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={`filter-pill ${activeFilter === filter.id ? "filter-pill--active" : ""}`}>
                {filter.label}
              </button>
            ))}
          </div>
          <div className="game-grid">
            {filteredGames.map((game, index) => <GameCard key={game.title} game={game} index={index} />)}
          </div>
          {filteredGames.length === 0 && (
            <div className="empty-queue"><Gift size={19} /><p>No received games are listed yet. When a gift arrives, the creator can update this status here.</p></div>
          )}
          <div className="queue-disclaimer"><span>IMPORTANT</span><p>“Gift via Xbox” takes you to Xbox/Microsoft. Purchase availability, gifting eligibility, and pricing are determined there—not by AlmostLegitTV. Digital gifts generally must be purchased and redeemed in the same country/region, and eligibility can vary by title and account. Confirm the details in Xbox/Microsoft before purchasing.</p></div>
        </section>

        <section className="support-section" id="support">
          <div className="section-rail"><span>03 / SUPPORT</span><div /></div>
          <div className="support-section__heading">
            <p className="eyebrow">Choose your support</p>
            <h2>Game support and regular tips are <em>not</em> the same thing.</h2>
          </div>
          <div className="support-lanes">
            <article className="support-lane support-lane--game">
              <div className="support-lane__icon"><Gamepad2 size={27} /></div>
              <span className="support-lane__index">LANE 01</span>
              <h3>Gift a game</h3>
              <p>Choose a title from the game queue, then complete the gift through Xbox/Microsoft. Xbox handles payment, gifting, and delivery on its own platform. It supports a possible future stream.</p>
              <a href="#queue" className="lane-link">View the game queue <ArrowDownRight size={18} /></a>
            </article>
            <article className="support-lane support-lane--tip">
              <div className="support-lane__icon"><Send size={25} /></div>
              <span className="support-lane__index">LANE 02</span>
              <h3>Leave a regular tip</h3>
              <p>Want to back the channel without choosing a game? Tips are separate from the wishlist and do not reserve a game or stream.</p>
              <button type="button" onClick={openDonationPanel} className="lane-link lane-link--button lane-link--donation"><span className="donation-pulse" /> Scan to donate with PayPal <ArrowUpRight size={18} /></button>
            </article>
          </div>
        </section>

        <section className="watch-section" id="watch">
          <div className="watch-section__copy">
            <div className="section-rail"><span>04 / WATCH</span><div /></div>
            <p className="eyebrow">Pull up a chair</p>
            <h2>Catch the runs, the clips, and the inevitable chaos.</h2>
            <p className="watch-section__lede">Follow the channels for live notifications, game updates, and everything that makes it out of a stream alive.</p>
          </div>
          <div className="watch-links">
            <a className="watch-card" href={SOCIALS.tiktok} target="_blank" rel="noreferrer"><MessageCircle size={25} /><div><span>TIKTOK / LIVE</span><strong>Turn on the next-run alert</strong></div><ArrowUpRight size={20} /></a>
            <a className="watch-card" href={SOCIALS.youtube} target="_blank" rel="noreferrer"><Youtube size={26} /><div><span>YOUTUBE / REPLAY</span><strong>Catch what chat started</strong></div><ArrowUpRight size={20} /></a>
            <a className="watch-card watch-card--minor" href={SOCIALS.twitch} target="_blank" rel="noreferrer"><Radio size={24} /><div><span>TWITCH / SIGNAL</span><strong>Join the live room</strong></div><ArrowUpRight size={20} /></a>
            <a className="watch-card watch-card--minor" href={SOCIALS.kick} target="_blank" rel="noreferrer"><CirclePlay size={24} /><div><span>KICK / ALT FEED</span><strong>Find the second channel</strong></div><ArrowUpRight size={20} /></a>
            <a className="watch-card watch-card--minor" href={SOCIALS.lnkBio} target="_blank" rel="noreferrer"><ArrowUpRight size={24} /><div><span>LNK.BIO / ALL LINKS</span><strong>Open the full link hub</strong></div><ArrowUpRight size={20} /></a>
          </div>
        </section>

        <section className="faq-section">
          <div className="faq-section__rail"><span>FAQ / CLEAR SIGNAL</span></div>
          <div className="faq-list">
            <details open><summary>Does AlmostLegitTV sell games?<ChevronRight size={18} /></summary><p>No. Game links open Xbox/Microsoft’s own store. Checkout, pricing, and gifting rules belong to Xbox/Microsoft—not this website.</p></details>
            <details><summary>Does a game gift guarantee a stream date?<ChevronRight size={18} /></summary><p>It gets the game closer to the stream plan, but it does not lock in an exact date, runtime, or completion. The creator will update game and stream statuses in the queue.</p></details>
            <details><summary>How is an Xbox game gift completed?<ChevronRight size={18} /></summary><p>Use the Xbox/Microsoft link on the game card and complete its gifting flow there. Xbox handles payment, code delivery, and redemption; AlmostLegitTV does not receive or store codes.</p></details>
          </div>
        </section>
      </main>

      {donationOpen && (
        <div className="donation-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDonationOpen(false); }}>
          <section className="donation-modal__panel" role="dialog" aria-modal="true" aria-labelledby="donation-title">
            <button type="button" className="donation-modal__close" onClick={() => setDonationOpen(false)} aria-label="Close PayPal donation panel"><X size={20} /></button>
            <div className="donation-modal__eyebrow"><span className="live-dot" /> SUPPORT LANE 02 / PAYPAL</div>
            <h2 id="donation-title">Tip the channel<br /><em>in a few seconds.</em></h2>
            <p>Scan the PayPal code below to send a regular tip to <strong>{PAYPAL_RECIPIENT}</strong>. {DONATION_SEPARATION_COPY}</p>
            <div className="donation-modal__qr-wrap"><img src={PAYPAL_QR_URL} alt={`PayPal QR code for ${PAYPAL_RECIPIENT}`} /></div>
            <div className="donation-modal__scan-note"><span>1</span><p>Open your phone camera or PayPal app.</p><span>2</span><p>Point it at the code and finish securely in PayPal.</p></div>
            <p className="donation-modal__privacy">Payment happens entirely through PayPal. This website does not collect or store payment details.</p>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <div className="site-footer__brand"><img src={ASSETS.mark} alt="" /><div><span>AlmostLegitTV</span><small>Almost legit energy.</small></div></div>
        <p>© 2026 AlmostLegitTV. Game purchase links lead off-site to Xbox/Microsoft.</p>
        <a href="#top">Back to signal <ArrowUpRight size={15} /></a>
      </footer>
    </div>
  );
}
