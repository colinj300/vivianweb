import { preorder } from "@/lib/config";

// The exact instant a pre-order window closes: end of the deadline day (UTC).
export function deadlineInstant(deadline = preorder.deadline) {
  return new Date(`${deadline}T23:59:59Z`);
}

// Work out where a pre-order campaign stands.
//   phase: "open"   — still taking orders (goal may or may not be met yet)
//          "funded" — closed, goal reached → fulfilling
//          "failed" — closed, goal missed → refunds owed
export function preorderState({ count, goal = preorder.goal, deadline = preorder.deadline, now = new Date() }) {
  const ends = deadlineInstant(deadline);
  const past = now.getTime() > ends.getTime();
  const met = count >= goal;
  const phase = !past ? "open" : met ? "funded" : "failed";
  return {
    phase,
    open: phase === "open",
    met,
    count,
    goal,
    remaining: Math.max(0, goal - count),
    deadlineISO: ends.toISOString(),
    msLeft: Math.max(0, ends.getTime() - now.getTime()),
  };
}
