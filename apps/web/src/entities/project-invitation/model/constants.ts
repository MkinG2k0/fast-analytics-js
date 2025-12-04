import type { ProjectInvitationStatus } from "@repo/types";

export const INVITATION_STATUSES: ProjectInvitationStatus[] = [
  "pending",
  "accepted",
  "expired",
  "cancelled",
];

export const INVITATION_STATUS_LABELS: Record<ProjectInvitationStatus, string> = {
  pending: "Ожидает",
  accepted: "Принято",
  expired: "Истекло",
  cancelled: "Отменено",
};

