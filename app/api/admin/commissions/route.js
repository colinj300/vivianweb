import { NextResponse } from "next/server";
import { maxActiveCommissions } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { listCommissions, updateCommission, countActive } from "@/lib/store";

const VALID_STATUSES = ["pending", "in_progress", "completed", "waitlist", "declined"];

// List all requests + slot usage.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await listCommissions();
  const active = all.filter((c) => c.status === "in_progress").length;
  return NextResponse.json({
    commissions: all,
    active,
    capacity: maxActiveCommissions,
    openSlots: Math.max(0, maxActiveCommissions - active),
  });
}

// Update a request's status and/or final price.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status, finalPrice } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch = {};
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    // Warn (but allow) if moving to in_progress would exceed capacity.
    if (status === "in_progress") {
      const active = await countActive();
      patch._warning =
        active >= maxActiveCommissions
          ? `Note: you're already at ${active}/${maxActiveCommissions} in progress.`
          : undefined;
    }
    patch.status = status;
  }
  if (finalPrice !== undefined && finalPrice !== null && finalPrice !== "") {
    patch.finalPrice = Math.round(Number(finalPrice));
  }

  const updated = await updateCommission(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, commission: updated, warning: patch._warning });
}
