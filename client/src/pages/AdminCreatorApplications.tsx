import { useState } from "react";
import { Check, ExternalLink, FileCheck2, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Application = { id: number; applicantName?: string | null; applicantEmail?: string | null; displayName: string; requestedSlug: string; bio?: string | null; gamerTags: string; streamLinks: string; catalogDraft: string; status: "pending" | "in_review" | "needs_changes" | "approved" | "rejected"; reviewerNotes?: string | null; createdAt: string | Date };

function safeJson<T>(value: string, fallback: T): T { try { return JSON.parse(value) as T; } catch { return fallback; } }

export default function AdminCreatorApplications() {
  const auth = trpc.auth.me.useQuery();
  const applications = trpc.admin.applications.useQuery(undefined, { enabled: auth.data?.role === "admin", retry: false });
  const review = trpc.admin.reviewApplication.useMutation({ onSuccess: () => { setNotice("Application review updated."); void applications.refetch(); }, onError: (error) => setNotice(error.message) });
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const authLoading = auth.isLoading;
  const unauthorized = !authLoading && auth.data?.role !== "admin";

  return <main className="booking-page admin-applications-page">
    <header className="booking-header"><div><Link href="/admin/onboard" className="booking-back-link">← Admin onboarding</Link><p className="eyebrow"><FileCheck2 size={14} /> ADMIN REVIEW QUEUE</p><h1>Verify creator <em>applications.</em></h1><p className="booking-lede">Cross-reference submitted stream profiles, gamer tags, and catalog details before approving a public portfolio. Nothing becomes public from the application form alone.</p></div><div className="booking-creator-card"><div className="booking-avatar">RV</div><div><strong>Verification desk</strong><span><span className="live-dot" /> Admin only</span></div></div></header>
    {notice && <div className="booking-notice" role="status"><Check size={17} /> <span>{notice}</span></div>}
    {authLoading ? <section className="creator-auth-gate"><Lock size={30} /><h2>Checking admin session…</h2></section> : unauthorized ? <section className="creator-auth-gate"><ShieldAlert size={30} /><p className="eyebrow">ADMIN AUTHORIZATION REQUIRED</p><h2>Sign in as the site administrator.</h2><button type="button" className="signal-button signal-button--primary" onClick={() => startLogin()}>Admin sign-in <Lock size={15} /></button></section> : <section className="admin-review-list" aria-labelledby="application-review-heading"><div className="booking-section-heading"><div><p className="eyebrow">PRIVATE APPLICATIONS</p><h2 id="application-review-heading">Review queue.</h2></div><span className="booking-count">{applications.data?.length ?? 0} submissions</span></div>{applications.isLoading ? <p className="booking-empty-state">Loading applications…</p> : !applications.data?.length ? <p className="booking-empty-state">No creator applications are waiting for review.</p> : applications.data.map((application) => <ApplicationCard key={application.id} application={application as Application} notes={notes[application.id] ?? application.reviewerNotes ?? ""} onNotes={(value) => setNotes((current) => ({ ...current, [application.id]: value }))} onReview={(status) => review.mutate({ id: application.id, status, reviewerNotes: notes[application.id] ?? application.reviewerNotes ?? undefined })} busy={review.isPending} />)}</section>}
    <section className="booking-disclosure"><Lock size={18} /><p><strong>Verification boundary.</strong> Review stream profiles and public-facing creator information only. Do not request payment details, wallet balances, gift codes, or private account credentials.</p></section>
  </main>;
}

function ApplicationCard({ application, notes, onNotes, onReview, busy }: { application: Application; notes: string; onNotes: (value: string) => void; onReview: (status: "in_review" | "needs_changes" | "approved" | "rejected") => void; busy: boolean }) {
  const tags = safeJson<Array<{ platform: string; handle: string }>>(application.gamerTags, []);
  const links = safeJson<Array<{ platform: string; url: string }>>(application.streamLinks, []);
  const catalog = safeJson<Array<{ title: string; platform: string; genre?: string; note?: string }>>(application.catalogDraft, []);
  return <article className="application-review-card"><div className="application-review-card__header"><div><p className="eyebrow">APPLICATION #{application.id} · {application.status.replace("_", " ")}</p><h3>{application.displayName}</h3><p>/{application.requestedSlug} · {application.applicantName || "Unnamed account"} · {application.applicantEmail || "No email shown"}</p></div><span className={`application-status application-status--${application.status}`}>{application.status.replace("_", " ")}</span></div><div className="application-review-grid"><div><strong>Bio</strong><p>{application.bio || "No bio supplied."}</p><strong>Gamer tags</strong>{tags.map((tag) => <p key={`${tag.platform}-${tag.handle}`}><span className="platform-chip">{tag.platform}</span> {tag.handle}</p>)}</div><div><strong>Stream profiles to verify</strong>{links.map((link) => <p key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.platform} <ExternalLink size={13} /></a></p>)}<strong>Starter catalog</strong>{catalog.map((game) => <p key={`${game.platform}-${game.title}`}><span className="platform-chip">{game.platform}</span> {game.title}{game.genre ? ` · ${game.genre}` : ""}</p>)}</div></div><label className="admin-onboarding-wide">Reviewer notes<textarea value={notes} onChange={(event) => onNotes(event.target.value)} rows={3} placeholder="Record what was verified or what needs correction." /></label><div className="application-review-actions"><button type="button" onClick={() => onReview("in_review")} disabled={busy}>Mark in review</button><button type="button" onClick={() => onReview("needs_changes")} disabled={busy}>Request changes</button><button type="button" onClick={() => onReview("rejected")} disabled={busy}>Reject</button><button type="button" className="signal-button signal-button--primary" onClick={() => onReview("approved")} disabled={busy}>Approve portfolio <Check size={15} /></button></div></article>;
}
