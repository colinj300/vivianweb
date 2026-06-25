// Shared vocabulary for the commission lifecycle. Imported by the admin
// page (client) and the API routes (server), so keep it plain data + pure
// functions only.

// High-level lifecycle / slot status.
export const STATUSES = ["pending", "approved", "completed", "waitlist", "declined"];
export const STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  completed: "Completed",
  waitlist: "Waitlist",
  declined: "Declined",
};

// Customer-facing progress stage (only once approved).
export const STAGES = ["not_started", "in_progress", "ready_for_review"];
export const STAGE_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  ready_for_review: "Finished & ready for review",
};

// Human-friendly, hard-to-guess order number, e.g. "VBV-7K3QX".
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
export function genOrderNumber() {
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `VBV-${s}`;
}
