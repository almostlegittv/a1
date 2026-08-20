import { useState } from "react";
import { ArrowLeft, Check, Lock, Radio, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const profileId = 1;

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
  const requests = trpc.booking.creatorRequests.useQuery({ streamerProfileId: profileId }, { retry: false });
  const catalog = trpc.booking.catalog.useQuery({ streamerProfileId: profileId }, { retry: false });
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

  const isUnauthorized = requests.error?.data?.code === "UNAUTHORIZED" || requests.error?.data?.code === "FORBIDDEN";

  return (
    <main className="booking-page creator-management-page">
      <header className="booking-header">
        <div>
          <Link href="/booking" className="booking-back-link"><ArrowLeft size={15} /> Back to booking board</Link>
          <p className="eyebrow"><span /> CREATOR CONTROL / PRIVATE</p>
          <h1>Review the <em>next run.</em></h1>
          <p className="booking-lede">Confirm ownership after a request arrives, keep private viewer identities private, and move coordination back to the mutual streaming platform.</p>
        </div>
        <div className="booking-creator-card"><div className="booking-avatar">AL</div><div><strong>AlmostLegitTV</strong><span><span className="live-dot" /> Creator workspace</span></div></div>
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
          <section className="creator-catalog-workspace" aria-labelledby="creator-catalog-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Radio size={14} /> CATALOG OWNERSHIP</p><h2 id="creator-catalog-heading">Already Owned register.</h2></div><span className="booking-count">{catalog.data?.length ?? 0} titles</span></div>
            <p className="booking-privacy"><Lock size={14} /> Ownership is creator-confirmed after a viewer request. The public board shows only safe status.</p>
            {catalog.isLoading ? <p className="booking-empty-state">Loading catalog…</p> : catalog.data?.length ? <div className="creator-catalog-grid">{catalog.data.map((game) => <article className={`creator-catalog-card ${game.ownershipStatus === "owned" ? "creator-catalog-card--owned" : ""}`} key={game.id}><div><span className="platform-chip">{game.platform === "xbox" ? "XBOX" : "PLAYSTATION"}</span><h3>{game.title}</h3><p>{game.genre ?? "Catalog title"}</p></div><button type="button" onClick={() => setOwnership.mutate({ id: game.id, ownershipStatus: game.ownershipStatus === "owned" ? "unconfirmed" : "owned" })}>{game.ownershipStatus === "owned" ? "Already owned" : "Confirm ownership"}</button></article>)}</div> : <p className="booking-empty-state">No approved catalog entries are available for this creator yet.</p>}
          </section>

          <section className="creator-request-workspace" aria-labelledby="creator-requests-heading">
            <div className="booking-section-heading"><div><p className="eyebrow"><Radio size={14} /> REQUEST REVIEW</p><h2 id="creator-requests-heading">Incoming booking requests.</h2></div><span className="booking-count">{requests.data?.length ?? 0} total</span></div>
            {requests.isLoading ? <p className="booking-empty-state">Loading private requests…</p> : requests.data?.length ? <div className="creator-request-table">{requests.data.map((request) => <article className="creator-request-row" key={request.id}><div><strong>{request.viewerHandle}</strong><span>{request.viewerPlatform} · Game #{request.gameId}</span></div><div className="creator-request-row__status"><span>{statusLabels[request.status] ?? request.status}</span><select aria-label={`Update request ${request.id}`} value={request.status} onChange={(event) => classify.mutate({ id: request.id, status: event.target.value as never })}><option value="requested">Requested</option><option value="reviewing">Reviewing</option><option value="owned">Already owned</option><option value="support_pending">Off-platform support pending</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></article>)}</div> : <p className="booking-empty-state">No private requests are available for this creator yet.</p>}
          </section>
        </>
      )}

      <section className="booking-disclosure"><Lock size={18} /><p><strong>Private creator boundary.</strong> This page is for approved creators and administrators. It does not collect payment, wallet funds, gift codes, service fees, or platform transaction details.</p></section>
    </main>
  );
}
