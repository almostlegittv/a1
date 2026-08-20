import { useMemo, useState } from "react";
import { Check, ExternalLink, Lock, Plus, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Platform = "xbox" | "playstation";
type Tag = { platform: Platform; handle: string };
type StreamLink = { platform: string; url: string };
type CatalogEntry = { title: string; platform: Platform; genre?: string; note?: string };

const blankTag = (): Tag => ({ platform: "xbox", handle: "" });
const blankLink = (): StreamLink => ({ platform: "TikTok", url: "" });
const blankGame = (): CatalogEntry => ({ title: "", platform: "xbox", genre: "", note: "" });

export default function CreatorApplication() {
  const auth = trpc.auth.me.useQuery();
  const application = trpc.creatorApplications.mine.useQuery(undefined, { enabled: Boolean(auth.data), retry: false });
  const submit = trpc.creatorApplications.submit.useMutation({ onSuccess: () => { setNotice("Application submitted. The admin review queue will verify your public profiles before anything goes live."); void application.refetch(); }, onError: (error) => setNotice(error.message) });
  const [displayName, setDisplayName] = useState("");
  const [requestedSlug, setRequestedSlug] = useState("");
  const [bio, setBio] = useState("");
  const [gamerTags, setGamerTags] = useState<Tag[]>([blankTag()]);
  const [streamLinks, setStreamLinks] = useState<StreamLink[]>([blankLink()]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([blankGame()]);
  const [notice, setNotice] = useState("");
  const authLoading = auth.isLoading;
  const signedOut = !authLoading && !auth.data;
  const hasDraft = useMemo(() => catalog.some((entry) => entry.title.trim()), [catalog]);
  const canSubmit = Boolean(displayName.trim() && requestedSlug.trim() && gamerTags.every((tag) => tag.handle.trim()) && streamLinks.every((link) => link.url.trim()) && hasDraft && !submit.isPending);

  const updateTag = (index: number, patch: Partial<Tag>) => setGamerTags((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateLink = (index: number, patch: Partial<StreamLink>) => setStreamLinks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateGame = (index: number, patch: Partial<CatalogEntry>) => setCatalog((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  function submitApplication() {
    submit.mutate({
      displayName: displayName.trim(),
      requestedSlug: requestedSlug.trim().toLowerCase(),
      bio: bio.trim() || undefined,
      gamerTags: gamerTags.map((tag) => ({ platform: tag.platform, handle: tag.handle.trim() })),
      streamLinks: streamLinks.map((link) => ({ platform: link.platform.trim(), url: link.url.trim() })),
      catalog: catalog.filter((entry) => entry.title.trim()).map((entry) => ({ title: entry.title.trim(), platform: entry.platform, genre: entry.genre?.trim() || undefined, note: entry.note?.trim() || undefined })),
    });
  }

  return <main className="booking-page creator-application-page">
    <header className="booking-header">
      <div><Link href="/" className="booking-back-link">← Request board</Link><p className="eyebrow"><UserPlus size={14} /> CREATOR APPLICATIONS</p><h1>Build your <em>portfolio.</em></h1><p className="booking-lede">Tell us how viewers should find you, which platforms you use, and what games belong on your request board. An admin verifies the details before your profile can go public.</p></div>
      <div className="booking-creator-card"><div className="booking-avatar">AP</div><div><strong>Manual review</strong><span><span className="live-dot" /> No self-publishing</span></div></div>
    </header>

    {notice && <div className="booking-notice" role="status"><Check size={17} /> <span>{notice}</span></div>}
    {authLoading ? <section className="creator-auth-gate"><Lock size={30} /><p className="eyebrow">CHECKING ACCOUNT</p><h2>Loading sign-in status…</h2></section> : signedOut ? <section className="creator-auth-gate"><ShieldAlert size={30} /><p className="eyebrow">SIGN-IN REQUIRED</p><h2>Sign in to submit a creator application.</h2><p>Your application is linked to your account so the review team can contact the correct person and prevent duplicate submissions.</p><button className="signal-button signal-button--primary" type="button" onClick={() => startLogin()}>Creator sign-in <Lock size={15} /></button></section> : application.data?.status && ["pending", "in_review", "approved"].includes(application.data.status) ? <section className="creator-auth-gate"><Check size={30} /><p className="eyebrow">APPLICATION STATUS</p><h2>{application.data.status === "approved" ? "Your creator profile is approved." : "Your application is in the review queue."}</h2><p>Status: <strong>{application.data.status.replace("_", " ")}</strong>. The admin team controls when a public portfolio becomes visible.</p>{application.data.status === "approved" && <Link href={`/booking/${application.data.requestedSlug}`} className="signal-button signal-button--primary">View public portfolio <ExternalLink size={15} /></Link>}</section> : <section className="creator-application-form" aria-labelledby="creator-application-heading">
      <div className="booking-section-heading"><div><p className="eyebrow">PROFILE INTAKE</p><h2 id="creator-application-heading">Your creator details.</h2></div><span className="booking-count">Private until approved</span></div>{application.data?.status === "needs_changes" && <div className="booking-notice" role="note"><ShieldAlert size={17} /><span>Reviewer notes: {application.data.reviewerNotes || "Please review your profile details and resubmit."}</span></div>}
      <div className="admin-onboarding-grid">
        <label>Creator display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="AlmostLegitTV" /></label>
        <label>Requested public slug<input value={requestedSlug} onChange={(event) => setRequestedSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="your-creator-name" /><span className="field-hint">Lowercase letters, numbers, and hyphens.</span></label>
        <label className="admin-onboarding-wide">Short bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} placeholder="What should viewers know about your streams?" /></label>
        <div className="application-fieldset admin-onboarding-wide"><div className="application-fieldset__header"><strong>Gamer tags</strong><button type="button" onClick={() => setGamerTags((items) => [...items, blankTag()])}><Plus size={14} /> Add tag</button></div>{gamerTags.map((tag, index) => <div className="application-row" key={`tag-${index}`}><select value={tag.platform} onChange={(event) => updateTag(index, { platform: event.target.value as Platform })}><option value="xbox">Xbox</option><option value="playstation">PlayStation</option></select><input value={tag.handle} onChange={(event) => updateTag(index, { handle: event.target.value })} placeholder="Your gamer tag" />{gamerTags.length > 1 && <button type="button" aria-label="Remove gamer tag" onClick={() => setGamerTags((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>)}</div>
        <div className="application-fieldset admin-onboarding-wide"><div className="application-fieldset__header"><strong>Stream profiles to verify</strong><button type="button" onClick={() => setStreamLinks((items) => [...items, blankLink()])}><Plus size={14} /> Add profile</button></div>{streamLinks.map((link, index) => <div className="application-row" key={`link-${index}`}><input className="application-row__platform" value={link.platform} onChange={(event) => updateLink(index, { platform: event.target.value })} placeholder="TikTok" /><input type="url" value={link.url} onChange={(event) => updateLink(index, { url: event.target.value })} placeholder="https://..." />{streamLinks.length > 1 && <button type="button" aria-label="Remove stream profile" onClick={() => setStreamLinks((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>)}</div>
        <div className="application-fieldset admin-onboarding-wide"><div className="application-fieldset__header"><strong>Starter game catalog</strong><button type="button" onClick={() => setCatalog((items) => [...items, blankGame()])}><Plus size={14} /> Add game</button></div>{catalog.map((game, index) => <div className="application-game-row" key={`game-${index}`}><input value={game.title} onChange={(event) => updateGame(index, { title: event.target.value })} placeholder="Game title" /><select value={game.platform} onChange={(event) => updateGame(index, { platform: event.target.value as Platform })}><option value="xbox">Xbox</option><option value="playstation">PlayStation</option></select><input value={game.genre} onChange={(event) => updateGame(index, { genre: event.target.value })} placeholder="Genre" /><input value={game.note} onChange={(event) => updateGame(index, { note: event.target.value })} placeholder="Creator note" />{catalog.length > 1 && <button type="button" aria-label="Remove catalog game" onClick={() => setCatalog((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>)}</div>
      </div>
      <div className="booking-disclosure"><Lock size={17} /><p><strong>Review boundary.</strong> Your information is private during review. Approval creates a public portfolio with creator-approved profile and catalog details only. This site does not collect payments, wallet funds, gift codes, or platform transaction data.</p></div>
      <button type="button" className="signal-button signal-button--primary admin-submit-button" disabled={!canSubmit} onClick={submitApplication}>{submit.isPending ? "Submitting application…" : "Submit creator application"}</button>
    </section>}
  </main>;
}
