import { NextResponse } from "next/server";
import { maxActiveCommissions } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { listCommissions, updateCommission, countActive, getByOrderNumber } from "@/lib/store";
import { STATUSES, STAGES, genOrderNumber } from "@/lib/commissions";

// List all requests + slot usage.
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await listCommissions();
  const active = all.filter((c) => c.status === "approved").length;
  return NextResponse.json({
    commissions: all,
    active,
    capacity: maxActiveCommissions,
    openSlots: Math.max(0, maxActiveCommissions - active),
  });
}

// Update a commission's status, progress stage, and/or final price.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status, stage, finalPrice } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch = {};
  let warning;

  if (status) {
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = status;

    if (status === "approved") {
      const current = await updateCommission(id, {}); // fetch current
      // Assign an order number + start the progress at "not started" on approval.
      if (current && !current.orderNumber) {
        let orderNumber = genOrderNumber();
        // avoid the (very rare) collision
        for (let i = 0; i < 5 && (await getByOrderNumber(orderNumber)); i++) {
          orderNumber = genOrderNumber();
        }
        patch.orderNumber = orderNumber;
        patch.stage = current.stage || "not_started";
      }
      const active = await countActive();
      if (active >= maxActiveCommissions) {
        warning = `Note: you're already at ${active}/${maxActiveCommissions} active commissions.`;
      }
    }
  }

  if (stage) {
    if (!STAGES.includes(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    patch.stage = stage;
  }

  if (finalPrice !== undefined && finalPrice !== null && finalPrice !== "") {
    patch.finalPrice = Math.round(Number(finalPrice));
  }

  const updated = await updateCommission(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, commission: updated, warning });
}
