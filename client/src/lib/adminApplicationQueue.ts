export type AdminApplicationStatus = "pending" | "in_review" | "needs_changes" | "approved" | "rejected";
export type AdminApplicationListItem = { displayName: string; requestedSlug: string; applicantName?: string | null; applicantEmail?: string | null; status: AdminApplicationStatus; createdAt: string | Date };
export type AdminApplicationStatusFilter = "all" | AdminApplicationStatus;

export function filterAndSortApplications<T extends AdminApplicationListItem>(applications: T[], query: string, status: AdminApplicationStatusFilter, sortMode: "newest" | "name") {
  const normalized = query.trim().toLowerCase();
  return [...applications].filter((application) => {
    const matchesStatus = status === "all" || application.status === status;
    const haystack = `${application.displayName} ${application.requestedSlug} ${application.applicantName ?? ""} ${application.applicantEmail ?? ""}`.toLowerCase();
    return matchesStatus && (!normalized || haystack.includes(normalized));
  }).sort((left, right) => sortMode === "name" ? left.displayName.localeCompare(right.displayName) : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
