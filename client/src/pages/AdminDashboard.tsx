import { useMemo } from "react";
import { ArrowRight, Check, FileCheck2, Lock, Plus, ShieldAlert, Users } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

export default function AdminDashboard() {
  const auth = trpc.auth.me.useQuery();
  const creators = trpc.admin.creators.useQuery(undefined, { enabled: auth.data?.role === "admin", retry: false });
  const applications = trpc.admin.applications.useQuery(undefined, { enabled: auth.data?.role === "admin", retry: false });
  const pendingApplications = useMemo(() => applications.data?.filter((application) => ["pending", "in_review", "needs_changes"].includes(application.status)).length ?? 0, [applications.data]);
  const approvedCreators = useMemo(() => creators.data?.filter((creator) => creator.approvalStatus === "approved").length ?? 0, [creators.data]);
  const unauthorized = !auth.isLoading && auth.data?.role !== "admin";

  return <main className="booking-page admin-dashboard-page">
    <header className="booking-header">
      <div><Link href="/" className="booking-back-link">← Request board</Link><p className="eyebrow"><ShieldAlert size={14} /> ADMIN CONTROL / PRIVATE</p><h1>Operate the <em>creator network.</em></h1><p className="booking-lede">Review applications, maintain approved profiles, and keep creator publishing behind a manual approval boundary.</p></div>
      <div className="booking-creator-card"><div className="booking-avatar">AD</div><div><strong>Verification desk</strong><span><span className="live-dot" /> Admin only</span></div></div>
    </header>

    {auth.isLoading ? <section className="creator-auth-gate"><Lock size={30} /><h2>Checking authorization…</h2></section> : unauthorized ? <section className="creator-auth-gate"><ShieldAlert size={30} /><p className="eyebrow">ADMIN AUTHORIZATION REQUIRED</p><h2>Sign in as an administrator.</h2><p>This control surface is not available to viewers or creators.</p><button className="signal-button signal-button--primary" type="button" onClick={() => startLogin()}>Admin sign-in <Lock size={15} /></button></section> : <>
      <section className="admin-dashboard-stats" aria-label="Admin overview statistics">
        <article className="creator-catalog-card"><FileCheck2 size={22} /><span className="eyebrow">APPLICATIONS TO REVIEW</span><strong>{pendingApplications}</strong><p>Pending, in-review, or returned for changes.</p></article>
        <article className="creator-catalog-card"><Users size={22} /><span className="eyebrow">APPROVED CREATORS</span><strong>{approvedCreators}</strong><p>Profiles currently eligible for public discovery.</p></article>
        <article className="creator-catalog-card"><Check size={22} /><span className="eyebrow">NO-FUNDS CONTROL</span><strong>ON</strong><p>Payments, codes, wallet balances, and fees remain outside the site.</p></article>
      </section>
      <section className="admin-dashboard-actions" aria-label="Admin actions">
        <Link href="/admin/applications" className="signal-button signal-button--primary"><FileCheck2 size={16} /> Review creator applications <ArrowRight size={16} /></Link>
        <Link href="/admin/onboard" className="signal-button signal-button--ghost"><Plus size={16} /> Onboard a creator <ArrowRight size={16} /></Link>
      </section>
      <section className="creator-request-workspace" aria-labelledby="admin-creators-heading"><div className="booking-section-heading"><div><p className="eyebrow">CREATOR DIRECTORY</p><h2 id="admin-creators-heading">Approved and pending profiles.</h2></div><span className="booking-count">{creators.data?.length ?? 0} profiles</span></div>{creators.isLoading ? <p className="booking-empty-state">Loading creator directory…</p> : creators.data?.length ? <div className="creator-request-table">{creators.data.map((creator) => <article className="creator-request-row" key={creator.id}><div><strong>{creator.displayName}</strong><span>/{creator.slug} · owner #{creator.ownerUserId}</span></div><div className="creator-request-row__status"><span>{creator.approvalStatus}</span><Link href={`/booking/${creator.slug}`} className="booking-card-action booking-card-action--muted">View public board <ArrowRight size={14} /></Link></div></article>)}</div> : <p className="booking-empty-state">No creator profiles have been onboarded yet.</p>}</section>
    </>}
    <section className="booking-disclosure"><Lock size={18} /><p><strong>Admin boundary.</strong> Approval and profile actions are restricted to administrators. This dashboard does not collect or process money, codes, wallet funds, fees, or platform transactions.</p></section>
  </main>;
}
