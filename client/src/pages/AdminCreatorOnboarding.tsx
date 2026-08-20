import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, FileCheck2, Lock, Plus, ShieldAlert, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Platform = "xbox" | "playstation";

function parseCatalog(raw: string) {
  return raw.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title, platform = "xbox", genre = "", note = ""] = line.split("|").map((part) => part.trim());
    return { title, platform: platform.toLowerCase() as Platform, genre, note };
  });
}

export default function AdminCreatorOnboarding() {
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [bio, setBio] = useState("");
  const [publicTipUrl, setPublicTipUrl] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved">("pending");
  const [catalogText, setCatalogText] = useState("");
  const [notice, setNotice] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const auth = trpc.auth.me.useQuery();
  const users = trpc.admin.users.useQuery(undefined, { retry: false, enabled: auth.data?.role === "admin" });
  const creators = trpc.admin.creators.useQuery(undefined, { retry: false, enabled: auth.data?.role === "admin" });
  const approveCreator = trpc.admin.setApproval.useMutation({
    onSuccess: () => { setNotice("Creator approval updated."); void creators.refetch(); },
    onError: (error) => setNotice(error.message),
  });
  const createCreator = trpc.admin.createCreator.useMutation({
    onSuccess: (profile) => {
      setNotice(`Creator profile created for ${profile?.displayName ?? displayName}.`);
      setCreatedSlug(profile?.slug ?? slug);
      void creators.refetch();
      setDisplayName(""); setSlug(""); setOwnerUserId(""); setBio(""); setPublicTipUrl(""); setCatalogText(""); setApprovalStatus("pending");
    },
    onError: (error) => setNotice(error.message),
  });

  const catalog = useMemo(() => parseCatalog(catalogText), [catalogText]);
  const authLoading = auth.isLoading;
  const unauthorized = !authLoading && auth.data?.role !== "admin";
  const malformedCatalog = catalog.some((entry) => !entry.title || !["xbox", "playstation"].includes(entry.platform));
  const canSubmit = Boolean(displayName.trim() && slug.trim() && ownerUserId && catalog.length && !malformedCatalog && !createCreator.isPending);
  const publicLink = createdSlug ? `${window.location.origin}/booking/${createdSlug}` : "";

  async function copyLink() {
    if (!publicLink) return;
    await navigator.clipboard?.writeText(publicLink);
    setNotice("Public booking link copied.");
  }

  return (
    <main className="booking-page creator-management-page">
      <header className="booking-header">
        <div>
          <Link href="/creator" className="booking-back-link"><ArrowLeft size={15} /> Creator workspace</Link>
          <p className="eyebrow"><UserPlus size={14} /> ADMIN CONTROL / PRIVATE</p>
          <h1>Add a <em>creator.</em></h1>
          <p className="booking-lede">Create a profile, load its first catalog, and choose whether it is awaiting review or ready for the public booking board.</p>
        </div>
        <div className="booking-creator-card"><div className="booking-avatar">AD</div><div><strong>Admin onboarding</strong><span><span className="live-dot" /> Manual approval required</span></div></div>
      </header>

      {notice && <div className="booking-notice" role="status"><Check size={17} /><span>{notice}</span></div>}

      {authLoading ? (
        <section className="creator-auth-gate"><Lock size={30} /><p className="eyebrow">CHECKING ADMIN SESSION</p><h2>Loading protected workspace…</h2><p>Verifying the signed-in account before showing onboarding controls.</p></section>
      ) : unauthorized ? (
        <section className="creator-auth-gate" aria-labelledby="admin-auth-heading">
          <ShieldAlert size={30} />
          <p className="eyebrow">ADMIN AUTHORIZATION REQUIRED</p>
          <h2 id="admin-auth-heading">Sign in as the site administrator.</h2>
          <p>This area can create profiles and approve public catalogs. Viewer accounts and creators cannot access it.</p>
          <button type="button" className="signal-button signal-button--primary" onClick={() => startLogin()}>Admin sign-in <Lock size={15} /></button>
        </section>
      ) : (
        <>
          <section className="booking-notice admin-link-notice" aria-label="Application review shortcut"><FileCheck2 size={18} /><div><strong>Creator applications need review?</strong><span>Open the private verification queue before approving a public portfolio.</span></div><Link href="/admin/applications" className="signal-button signal-button--ghost">Review applications <ExternalLink size={15} /></Link></section>

          <section className="creator-catalog-workspace" aria-labelledby="onboarding-form-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Plus size={14} /> NEW CREATOR PROFILE</p><h2 id="onboarding-form-heading">Profile intake.</h2></div><span className="booking-count">Admin only</span></div>
            <div className="admin-onboarding-grid">
              <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Creator display name" /></label>
              <label>Public slug<input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="creator-slug" /><span className="field-hint">Lowercase letters, numbers, and hyphens.</span></label>
              <label>Creator account<select value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)}><option value="">Select the creator’s signed-in account</option>{users.data?.map((user) => <option value={user.id} key={user.id}>{user.name || user.email || `User #${user.id}`} {user.role === "admin" ? "· admin" : ""}</option>)}</select></label>
              <label>Approval<select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as "pending" | "approved")}><option value="pending">Pending manual review</option><option value="approved">Approved and public</option></select></label>
              <label className="admin-onboarding-wide">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} placeholder="Short creator bio shown on the booking board" /></label>
              <label className="admin-onboarding-wide">Public tip URL <span className="field-hint">Optional external link only; this site does not process tips.</span><input value={publicTipUrl} onChange={(event) => setPublicTipUrl(event.target.value)} placeholder="https://..." type="url" /></label>
              <label className="admin-onboarding-wide">Initial catalog <span className="field-hint">One game per line: Title | xbox or playstation | Genre | Creator note</span><textarea value={catalogText} onChange={(event) => setCatalogText(event.target.value)} rows={8} placeholder={'Red Dead Redemption 2 | xbox | Open-world western | Confirm ownership after onboarding\nReturnal | playstation | Roguelike shooter | Coordinate timing off-platform'} /></label>
            </div>
            {malformedCatalog && <p className="form-error" role="alert">Each catalog line needs a title and either xbox or playstation as its platform.</p>}
            <button type="button" className="signal-button signal-button--primary admin-submit-button" disabled={!canSubmit} onClick={() => createCreator.mutate({ ownerUserId: Number(ownerUserId), slug: slug.trim(), displayName: displayName.trim(), bio: bio.trim() || undefined, publicTipUrl: publicTipUrl.trim(), approvalStatus, catalog })}>{createCreator.isPending ? "Creating profile…" : "Create creator profile"}</button>
          </section>

          {createdSlug && <section className="booking-notice admin-link-notice" aria-label="Public creator link"><ExternalLink size={18} /><div><strong>Public booking link ready.</strong><span>{publicLink}</span></div><button type="button" className="signal-button signal-button--ghost" onClick={copyLink}><Copy size={15} /> Copy link</button></section>}

          <section className="creator-request-workspace" aria-labelledby="creator-list-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Lock size={14} /> APPROVAL REGISTER</p><h2 id="creator-list-heading">Creator profiles.</h2></div><span className="booking-count">{creators.data?.length ?? 0} profiles</span></div>
            {creators.isLoading ? <p className="booking-empty-state">Loading creator register…</p> : creators.data?.length ? <div className="creator-request-table">{creators.data.map((creator) => <article className="creator-request-row" key={creator.id}><div><strong>{creator.displayName}</strong><span>/{creator.slug} · owner #{creator.ownerUserId}</span></div><div className="creator-request-row__status"><span>{creator.approvalStatus}</span><select aria-label={`Update ${creator.displayName} approval`} value={creator.approvalStatus} disabled={approveCreator.isPending} onChange={(event) => approveCreator.mutate({ id: creator.id, approvalStatus: event.target.value as "pending" | "approved" | "suspended" | "archived" })}>{["pending", "approved", "suspended", "archived"].map((status) => <option value={status} key={status}>{status}</option>)}</select></div></article>)}</div> : <p className="booking-empty-state">No creator profiles have been onboarded yet.</p>}
          </section>
        </>
      )}

      <section className="booking-disclosure"><Lock size={18} /><p><strong>Admin boundary.</strong> Onboarding stores profile and catalog metadata only. It does not collect payment, wallet funds, gift codes, service fees, or platform transaction details.</p></section>
    </main>
  );
}
