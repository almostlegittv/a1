import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, ExternalLink, Info, Lock, Plus, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { validateCreatorApplicationDraft, validateGamerTag, validatePublicStreamLink, type CreatorApplicationErrors } from "@/lib/creatorApplication";

type Platform = "xbox" | "playstation";
type Tag = { platform: Platform; handle: string };
type StreamLink = { platform: string; url: string };
type CatalogEntry = { title: string; platform: Platform; genre?: string; note?: string };
type Errors = CreatorApplicationErrors;

const blankTag = (): Tag => ({ platform: "xbox", handle: "" });
const blankLink = (): StreamLink => ({ platform: "TikTok", url: "" });
const blankGame = (): CatalogEntry => ({ title: "", platform: "xbox", genre: "", note: "" });

export default function CreatorApplication() {
  const auth = trpc.auth.me.useQuery();
  const application = trpc.creatorApplications.mine.useQuery(undefined, { enabled: Boolean(auth.data), retry: false });
  const [displayName, setDisplayName] = useState("");
  const [requestedSlug, setRequestedSlug] = useState("");
  const [bio, setBio] = useState("");
  const [gamerTags, setGamerTags] = useState<Tag[]>([blankTag()]);
  const [streamLinks, setStreamLinks] = useState<StreamLink[]>([blankLink()]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([blankGame()]);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [showErrors, setShowErrors] = useState(false);

  const submit = trpc.creatorApplications.submit.useMutation({
    onSuccess: () => { setNotice("Application submitted. The admin review queue will verify your details before anything goes live."); setErrors({}); setShowErrors(false); void application.refetch(); },
    onError: (error) => setNotice(error.message),
  });

  useEffect(() => {
    const saved = application.data;
    if (!saved || !["needs_changes", "rejected"].includes(saved.status)) return;
    try {
      const tags = JSON.parse(saved.gamerTags) as Tag[];
      const links = JSON.parse(saved.streamLinks) as StreamLink[];
      const games = JSON.parse(saved.catalogDraft) as CatalogEntry[];
      setDisplayName(saved.displayName); setRequestedSlug(saved.requestedSlug); setBio(saved.bio ?? "");
      setGamerTags(tags.length ? tags : [blankTag()]); setStreamLinks(links.length ? links : [blankLink()]); setCatalog(games.length ? games : [blankGame()]);
    } catch { setNotice("Your previous application could not be prefilled. You can enter the details again below."); }
  }, [application.data]);

  const authLoading = auth.isLoading;
  const signedOut = !authLoading && !auth.data;
  const status = application.data?.status;
  const isStatusOnly = Boolean(status && ["pending", "in_review", "approved"].includes(status));
  const completedSections = [Boolean(displayName.trim() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedSlug.trim())), gamerTags.every((tag) => tag.handle.trim()), streamLinks.every((link) => link.url.trim()), catalog.some((entry) => entry.title?.trim())].filter(Boolean).length;
  const hasDraft = useMemo(() => catalog.some((entry) => entry.title?.trim()), [catalog]);

  function validate(): Errors {
    return validateCreatorApplicationDraft({ displayName, requestedSlug, bio, gamerTags, streamLinks, catalog });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(); setErrors(next); setShowErrors(true);
    if (Object.keys(next).length) { setNotice("Please complete the highlighted sections before submitting."); return; }
    setNotice("");
    submit.mutate({
      displayName: displayName.trim(), requestedSlug: requestedSlug.trim(), bio: bio.trim() || undefined,
      gamerTags: gamerTags.map((tag) => ({ platform: tag.platform, handle: tag.handle.trim() })),
      streamLinks: streamLinks.map((link) => ({ platform: link.platform.trim(), url: link.url.trim() })),
      catalog: catalog.filter((entry) => entry.title.trim()).map((entry) => ({ title: entry.title.trim(), platform: entry.platform, genre: entry.genre?.trim() || undefined, note: entry.note?.trim() || undefined })),
    });
  }

  const updateTag = (index: number, patch: Partial<Tag>) => setGamerTags((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateLink = (index: number, patch: Partial<StreamLink>) => setStreamLinks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateGame = (index: number, patch: Partial<CatalogEntry>) => setCatalog((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  return <main className="booking-page creator-application-page">
    <header className="booking-header">
      <div><Link href="/" className="booking-back-link">← Request board</Link><p className="eyebrow"><UserPlus size={14} /> CREATOR APPLICATIONS</p><h1>Build your <em>portfolio.</em></h1><p className="booking-lede">Share the details viewers need to find you. An admin checks the submission before your profile, links, and catalog can appear publicly.</p></div>
      <div className="booking-creator-card"><div className="booking-avatar">AP</div><div><strong>Manual review</strong><span><span className="live-dot" /> No self-publishing</span></div></div>
    </header>

    {notice && <div className={`booking-notice ${submit.isError ? "booking-notice--error" : ""}`} role={submit.isError ? "alert" : "status"}><Check size={17} /> <span>{notice}</span></div>}
    {authLoading ? <section className="creator-auth-gate"><Lock size={30} /><p className="eyebrow">CHECKING ACCOUNT</p><h2>Loading sign-in status…</h2></section> : signedOut ? <section className="creator-auth-gate"><ShieldAlert size={30} /><p className="eyebrow">SIGN-IN REQUIRED</p><h2>Sign in to submit a creator application.</h2><p>Your application is linked to your account so the review team can prevent duplicate submissions and contact the correct applicant.</p><button className="signal-button signal-button--primary" type="button" onClick={() => startLogin()}>Creator sign-in <Lock size={15} /></button></section> : isStatusOnly ? <StatusCard status={status!} slug={application.data?.requestedSlug} /> : <form className="creator-application-form" onSubmit={handleSubmit} noValidate aria-labelledby="creator-application-heading">
      <div className="booking-section-heading"><div><p className="eyebrow">PROFILE INTAKE</p><h2 id="creator-application-heading">Your creator details.</h2></div><span className="booking-count">{completedSections}/4 sections ready</span></div>
      <div className="application-progress" aria-label={`${completedSections} of 4 sections complete`}><span style={{ width: `${completedSections * 25}%` }} /></div>
      {status === "needs_changes" && <div className="booking-notice" role="note"><ShieldAlert size={17} /><span>Reviewer notes: {application.data?.reviewerNotes || "Please review your details and resubmit."}</span></div>}
      <p className="application-intro"><Info size={16} /> Complete the four sections below. Anything you submit stays private until an administrator approves it.</p>

      <section className="application-step" aria-labelledby="identity-heading"><div className="application-step__heading"><span>01</span><div><h3 id="identity-heading">Public identity</h3><p>This is the name and address viewers will see if your portfolio is approved.</p></div></div><div className="admin-onboarding-grid"><label>Creator display name<input required value={displayName} aria-invalid={Boolean(showErrors && errors.displayName)} onChange={(event) => setDisplayName(event.target.value)} placeholder="AlmostLegitTV" />{showErrors && errors.displayName && <span className="form-error">{errors.displayName}</span>}</label><label>Requested public slug<input required value={requestedSlug} aria-invalid={Boolean(showErrors && errors.requestedSlug)} onChange={(event) => setRequestedSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="your-creator-name" /><span className="field-hint">Lowercase letters, numbers, and hyphens.</span>{showErrors && errors.requestedSlug && <span className="form-error">{errors.requestedSlug}</span>}</label><label className="admin-onboarding-wide">Short bio<textarea required value={bio} aria-invalid={Boolean(showErrors && errors.bio)} onChange={(event) => setBio(event.target.value)} rows={3} placeholder="What should viewers know about your streams?" />{showErrors && errors.bio && <span className="form-error">{errors.bio}</span>}</label></div></section>

      <section className="application-step" aria-labelledby="tags-heading"><div className="application-step__heading"><span>02</span><div><h3 id="tags-heading">Gamer tags</h3><p>Add the platform names viewers should use to identify you.</p></div></div><div className="application-fieldset"><div className="application-fieldset__header"><strong>Platform accounts</strong><button type="button" onClick={() => setGamerTags((items) => [...items, blankTag()])}><Plus size={14} /> Add tag</button></div>{gamerTags.map((tag, index) => <div className="application-row" key={`tag-${index}`}><select aria-label={`Gamer tag platform ${index + 1}`} value={tag.platform} onChange={(event) => updateTag(index, { platform: event.target.value as Platform })}><option value="xbox">Xbox</option><option value="playstation">PlayStation</option></select><input required value={tag.handle} aria-label={`Gamer tag ${index + 1}`} onChange={(event) => updateTag(index, { handle: event.target.value })} placeholder="Your gamer tag" /><ValidationHint result={validateGamerTag(tag.platform, tag.handle)} />{gamerTags.length > 1 && <button type="button" aria-label="Remove gamer tag" onClick={() => setGamerTags((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>)}{showErrors && errors.gamerTags && <span className="form-error">{errors.gamerTags}</span>}</div></section>

      <section className="application-step" aria-labelledby="links-heading"><div className="application-step__heading"><span>03</span><div><h3 id="links-heading">Stream profiles</h3><p>Give the admin public links to cross-reference. Never enter a password or private credential.</p></div></div><div className="application-fieldset"><div className="application-fieldset__header"><strong>Public profiles</strong><button type="button" onClick={() => setStreamLinks((items) => [...items, blankLink()])}><Plus size={14} /> Add profile</button></div>{streamLinks.map((link, index) => <div className="application-row" key={`link-${index}`}><input className="application-row__platform" value={link.platform} onChange={(event) => updateLink(index, { platform: event.target.value })} placeholder="TikTok" /><input required type="url" value={link.url} aria-label={`${link.platform} profile URL`} onChange={(event) => updateLink(index, { url: event.target.value })} placeholder="https://..." /><ValidationHint result={validatePublicStreamLink(link.platform, link.url)} />{streamLinks.length > 1 && <button type="button" aria-label="Remove stream profile" onClick={() => setStreamLinks((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>)}{showErrors && errors.streamLinks && <span className="form-error">{errors.streamLinks}</span>}</div></section>

      <section className="application-step" aria-labelledby="catalog-heading"><div className="application-step__heading"><span>04</span><div><h3 id="catalog-heading">Starter catalog</h3><p>List the first games you want viewers to be able to request. You can expand the catalog after approval.</p></div></div><div className="application-fieldset"><div className="application-fieldset__header"><strong>Games for review</strong><button type="button" onClick={() => setCatalog((items) => [...items, blankGame()])}><Plus size={14} /> Add game</button></div>{catalog.map((game, index) => <div className="application-game-row" key={`game-${index}`}><input value={game.title} aria-label={`Game title ${index + 1}`} onChange={(event) => updateGame(index, { title: event.target.value })} placeholder="Game title" /><select aria-label={`Game platform ${index + 1}`} value={game.platform} onChange={(event) => updateGame(index, { platform: event.target.value as Platform })}><option value="xbox">Xbox</option><option value="playstation">PlayStation</option></select><input value={game.genre} aria-label={`Game genre ${index + 1}`} onChange={(event) => updateGame(index, { genre: event.target.value })} placeholder="Genre" /><input value={game.note} aria-label={`Game note ${index + 1}`} onChange={(event) => updateGame(index, { note: event.target.value })} placeholder="Creator note" />{catalog.length > 1 && <button type="button" aria-label="Remove catalog game" onClick={() => setCatalog((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</div>)}{showErrors && errors.catalog && <span className="form-error">{errors.catalog}</span>}</div></section>

      <div className="booking-disclosure"><Lock size={17} /><p><strong>Review boundary.</strong> Your application is private until approval. This site does not collect payments, wallet funds, gift codes, platform credentials, or transaction details.</p></div>
      <div className="application-submit-row"><span className="field-hint">Approval creates a public portfolio only after manual review.</span><button type="submit" className="signal-button signal-button--primary" disabled={submit.isPending}>{submit.isPending ? "Submitting application…" : status === "needs_changes" ? "Resubmit for review" : "Submit creator application"} <ChevronRight size={16} /></button></div>
    </form>}
  </main>;
}

function ValidationHint({ result }: { result: { status: "passed" | "warning" | "failed"; note: string } }) { return <span className={`identity-validation identity-validation--${result.status}`} role="status"><span /> {result.note}</span>; }

function StatusCard({ status, slug }: { status: string; slug?: string | null }) {
  const approved = status === "approved";
  return <section className="creator-auth-gate"><Check size={30} /><p className="eyebrow">APPLICATION STATUS</p><h2>{approved ? "Your creator profile is approved." : "Your application is in the review queue."}</h2><p>Status: <strong>{status.replace("_", " ")}</strong>. The admin team controls when or whether a public portfolio becomes visible.</p>{approved && slug && <Link href={`/booking/${slug}`} className="signal-button signal-button--primary">View public portfolio <ExternalLink size={15} /></Link>}</section>;
}
