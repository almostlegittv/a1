import { useEffect, useState } from "react";
import { ArrowLeft, Check, Lightbulb, Lock, Radio, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, string> = {
  requested: "Requested",
  reviewing: "Reviewing",
  owned: "Already owned",
  support_pending: "Off-platform support pending",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function CreatorManagement() {
  const [notice, setNotice] = useState("");
  const auth = trpc.auth.me.useQuery();
  const profile = trpc.booking.myProfile.useQuery(undefined, { enabled: Boolean(auth.data), retry: false });
  const profileId = profile.data?.id ?? 0;
  const requests = trpc.booking.creatorRequests.useQuery({ streamerProfileId: profileId }, { enabled: Boolean(profileId), retry: false });
  const catalog = trpc.booking.catalog.useQuery({ streamerProfileId: profileId }, { enabled: Boolean(profileId), retry: false });
  const suggestions = trpc.booking.creatorSuggestions.useQuery({ streamerProfileId: profileId }, { enabled: Boolean(profileId), retry: false });
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gamerTags, setGamerTags] = useState("");
  const [streamLinks, setStreamLinks] = useState("");
  const classify = trpc.booking.classifyRequest.useMutation({
    onSuccess: () => {
      setNotice("Request status updated on the public board.");
      void requests.refetch();
    },
    onError: (error) => setNotice(error.message),
  });
  const setOwnership = trpc.booking.setOwnership.useMutation({
    onSuccess: () => {
      setNotice("Catalog ownership updated.");
      void catalog.refetch();
    },
    onError: (error) => setNotice(error.message),
  });

  useEffect(() => {
    if (!profile.data) return;
    setDisplayName(profile.data.displayName);
    setBio(profile.data.bio ?? "");
    setGamerTags(profile.data.gamerTags ?? "[]");
    setStreamLinks(profile.data.streamLinks ?? "[]");
  }, [profile.data]);

  const updateProfile = trpc.booking.updateProfile.useMutation({
    onSuccess: (updated) => { setNotice("Public creator profile updated."); void profile.refetch(); if (updated) { setDisplayName(updated.displayName); setBio(updated.bio ?? ""); } },
    onError: (error) => setNotice(error.message),
  });

  const updateSuggestion = trpc.booking.updateSuggestion.useMutation({
    onSuccess: () => { setNotice("Game suggestion status updated."); void suggestions.refetch(); },
    onError: (error) => setNotice(error.message),
  });

  const isUnauthorized = auth.error?.data?.code === "UNAUTHORIZED" || requests.error?.data?.code === "UNAUTHORIZED" || requests.error?.data?.code === "FORBIDDEN" || (!auth.isLoading && !auth.data);
  const saveProfile = () => { if (!profileId || displayName.trim().length < 2) return; updateProfile.mutate({ id: profileId, displayName, bio, gamerTags, streamLinks }); };

  return (
    <main className="booking-page creator-management-page">
      <header className="booking-header">
        <div>
          <Link href="/booking" className="booking-back-link"><ArrowLeft size={15} /> Back to booking board</Link>
          <p className="eyebrow"><span /> CREATOR CONTROL / PRIVATE</p>
          <h1>Review the <em>next run.</em></h1>
          <p className="booking-lede">Confirm ownership after a request arrives, keep private viewer identities private, and move coordination back to the mutual streaming platform.</p>
        </div>
        <div className="booking-creator-card"><div className="booking-avatar">AL</div><div><strong>{profile.data?.displayName ?? "Creator workspace"}</strong><span><span className="live-dot" /> Creator workspace</span></div></div>
      </header>

      {notice && <div className="booking-notice" role="status"><Check size={17} /><span>{notice}</span></div>}

      {isUnauthorized ? (
        <section className="creator-auth-gate" aria-labelledby="creator-auth-heading">
          <ShieldAlert size={30} />
          <p className="eyebrow">AUTHORIZATION REQUIRED</p>
          <h2 id="creator-auth-heading">Sign in as an approved creator.</h2>
          <p>This workspace is protected. Viewer handles and request controls are never exposed to the public board.</p>
          <button type="button" className="signal-button signal-button--primary" onClick={() => startLogin()}>Creator sign-in <Lock size={15} /></button>
        </section>
      ) : (
        <>
          <section className="creator-profile-workspace" aria-labelledby="creator-profile-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Radio size={14} /> PUBLIC PROFILE</p><h2 id="creator-profile-heading">Your creator profile.</h2></div><span className="booking-count">/{profile.data?.slug ?? "creator"}</span></div>
            <p className="booking-privacy"><Lock size={14} /> These fields are visible on the approved public portfolio. Do not enter passwords or platform credentials.</p>
            <div className="admin-onboarding-grid"><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={160} /></label><label className="admin-onboarding-wide">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} maxLength={2000} /></label><label>Gamer tags JSON<textarea value={gamerTags} onChange={(event) => setGamerTags(event.target.value)} rows={3} placeholder='[{"platform":"xbox","handle":"..."}]' /></label><label>Public stream links JSON<textarea value={streamLinks} onChange={(event) => setStreamLinks(event.target.value)} rows={3} placeholder='[{"platform":"TikTok","url":"https://..."}]' /></label></div>
            <button type="button" className="signal-button signal-button--primary" onClick={saveProfile} disabled={updateProfile.isPending || displayName.trim().length < 2}>Save public profile</button>
          </section>

          <section className="creator-catalog-workspace" aria-labelledby="creator-catalog-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Radio size={14} /> CATALOG OWNERSHIP</p><h2 id="creator-catalog-heading">Already Owned register.</h2></div><span className="booking-count">{catalog.data?.length ?? 0} titles</span></div>
            <p className="booking-privacy"><Lock size={14} /> Ownership is creator-confirmed after a viewer request. The public board shows only safe status.</p>
            {catalog.isLoading ? <p className="booking-empty-state">Loading catalog…</p> : catalog.data?.length ? <div className="creator-catalog-grid">{catalog.data.map((game) => <article className={`creator-catalog-card ${game.ownershipStatus === "owned" ? "creator-catalog-card--owned" : ""}`} key={game.id}><div><span className="platform-chip">{game.platform === "xbox" ? "XBOX" : "PLAYSTATION"}</span><h3>{game.title}</h3><p>{game.genre ?? "Catalog title"}</p></div><button type="button" onClick={() => setOwnership.mutate({ id: game.catalogEntryId, streamerProfileId: profileId, ownershipStatus: game.ownershipStatus === "owned" ? "unconfirmed" : "owned" })}>{game.ownershipStatus === "owned" ? "Already owned" : "Confirm ownership"}</button></article>)}</div> : <p className="booking-empty-state">No approved catalog entries are available for this creator yet.</p>}
          </section>

          <section className="creator-suggestion-workspace" aria-labelledby="creator-suggestions-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Lightbulb size={14} /> VIEWER IDEAS</p><h2 id="creator-suggestions-heading">Suggested games.</h2></div><span className="booking-count">{suggestions.data?.length ?? 0} total</span></div>
            <p className="booking-privacy"><Lock size={14} /> Suggestions are private to the creator and authorized administrators until you choose to act on them. No purchase or payment is created.</p>
            {suggestions.isLoading ? <p className="booking-empty-state">Loading game suggestions…</p> : suggestions.data?.length ? <div className="creator-request-table">{suggestions.data.map((suggestion) => <article className="creator-request-row" key={suggestion.id}><div><strong>{suggestion.title}</strong><span>{suggestion.platform === "xbox" ? "XBOX" : "PLAYSTATION"}{suggestion.note ? ` · ${suggestion.note}` : ""}</span></div><div className="creator-request-row__status"><span>{suggestion.status}</span><select aria-label={`Update suggestion ${suggestion.id}`} value={suggestion.status} onChange={(event) => updateSuggestion.mutate({ id: suggestion.id, status: event.target.value as "pending" | "reviewed" | "accepted" | "declined" })}><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div></article>)}</div> : <p className="booking-empty-state">No viewer game suggestions have arrived yet.</p>}
          </section>

          <section className="creator-request-workspace" aria-labelledby="creator-requests-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Radio size={14} /> REQUEST REVIEW</p><h2 id="creator-requests-heading">Incoming booking requests.</h2></div><span className="booking-count">{requests.data?.length ?? 0} total</span></div>
            {requests.isLoading ? <p className="booking-empty-state">Loading private requests…</p> : requests.data?.length ? <div className="creator-request-table">{requests.data.map((request) => <article className="creator-request-row" key={request.id}><div><strong>{request.viewerHandle}</strong><span>{request.viewerPlatform} · Game #{request.gameId}</span></div><div className="creator-request-row__status"><span>{statusLabels[request.status] ?? request.status}</span><select aria-label={`Update request ${request.id}`} value={request.status} onChange={(event) => classify.mutate({ id: request.id, streamerProfileId: profileId, status: event.target.value as never })}><option value="requested">Requested</option><option value="reviewing">Reviewing</option><option value="owned">Already owned</option><option value="support_pending">Off-platform support pending</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></article>)}</div> : <p className="booking-empty-state">No private requests are available for this creator yet.</p>}
          </section>
        </>
      )}

      <section className="booking-disclosure"><Lock size={18} /><p><strong>Private creator boundary.</strong> This page is for approved creators and administrators. It does not collect payment, wallet funds, gift codes, service fees, or platform transaction details.</p></section>
    </main>
  );
}
