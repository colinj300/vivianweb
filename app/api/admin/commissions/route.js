import { NextResponse } from "next/server";
import { maxActiveCommissions, site } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { listCommissions, updateCommission, countActive, getByOrderNumber, deleteCommission, getCommission } from "@/lib/store";
import { STATUSES, STAGES, genOrderNumber } from "@/lib/commissions";
import { sendEmail, sendSMSTo } from "@/lib/notify";

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
  const {
    id,
    status,
    stage,
    finalPrice,
    proofImage,
    addProgressImage,
    removeProgressImage,
    hideTestimonial,
    removeTestimonial,
  } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const patch = {};
  let warning;

  // Hide (or un-hide) / remove the customer's public review.
  if (removeTestimonial) {
    patch.testimonial = null;
  } else if (typeof hideTestimonial === "boolean") {
    const cur = await getCommission(id);
    if (cur?.testimonial) {
      patch.testimonial = { ...cur.testimonial, hidden: hideTestimonial };
    }
  }

  // Add or remove a progress photo (the customer sees these on /track).
  if (addProgressImage || removeProgressImage) {
    const cur = await getCommission(id);
    const arr = Array.isArray(cur?.progressImages) ? cur.progressImages : [];
    if (addProgressImage) {
      patch.progressImages = [...arr, { url: addProgressImage, at: new Date().toISOString() }];
    } else {
      patch.progressImages = arr.filter((p) => p.url !== removeProgressImage);
    }
  }

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
  if (proofImage !== undefined && proofImage !== null && proofImage !== "") {
    patch.proofImage = proofImage;
  }

  if (finalPrice !== undefined && finalPrice !== null && finalPrice !== "") {
    patch.finalPrice = Math.round(Number(finalPrice));
  }

  const updated = await updateCommission(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // On a progress change (in progress / ready for review), notify the
  // customer. We text them if that's their preferred method (and we have a
  // number), and we ALWAYS email a copy when we have their address. If they
  // chose a platform we can't auto-send to (e.g. Instagram), we flag it back
  // so the admin can DM them the link by hand.
  const sent = { email: false, text: false };
  let manual = null;
  let trackUrl = "";
  if ((stage === "in_progress" || stage === "ready_for_review") && updated.orderNumber) {
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    trackUrl = `${origin}/track?order=${encodeURIComponent(updated.orderNumber)}`;
    const photo = updated.proofImage || "";
    const pref = updated.contactMethod || "email";
    const ready = stage === "ready_for_review";

    // Text them if that's their preference and we have a number.
    if (pref === "text" && updated.phone) {
      const body = ready
        ? `Hi ${updated.name}! Your commission from ${site.brand} is ready to review. ` +
          `See it and confirm (or request changes): ${trackUrl}`
        : `Good news ${updated.name}! Vivian has started your commission from ${site.brand}. ` +
          `Follow along: ${trackUrl}`;
      const r = await sendSMSTo(updated.phone, body, ready ? photo || undefined : undefined);
      sent.text = r.ok && !r.skipped;
    }

    // Always email a copy when we have an address (a written record + backup).
    if (updated.email) {
      const r = ready
        ? await sendEmail({
            to: updated.email,
            subject: `Your commission is ready to review! (Order ${updated.orderNumber})`,
            text:
              `Hi ${updated.name},\n\nYour commission is finished and ready for your review!\n` +
              (photo ? `Preview: ${photo}\n\n` : "\n") +
              `Review it here (confirm you love it, or send notes for changes):\n${trackUrl}\n\n` +
              `Thank you! — ${site.artistName}`,
            html:
              `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
              `<h2 style="color:#3e5fae">Your commission is ready! 🎨</h2>` +
              `<p>Hi ${updated.name}, your piece is finished and ready for your review.</p>` +
              (photo
                ? `<p><img src="${photo}" alt="Your commission" style="max-width:100%;border-radius:14px;border:3px solid #ddd6f2"/></p>`
                : "") +
              `<p>Tap below to let ${site.artistName} know what you think — confirm you love it, or send notes for any changes:</p>` +
              `<p><a href="${trackUrl}" style="display:inline-block;background:#8c64bd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">Review my commission</a></p>` +
              `<p style="color:#5d4f7c;font-size:13px">Order ${updated.orderNumber}</p>` +
              `</div>`,
          })
        : await sendEmail({
            to: updated.email,
            subject: `Your commission is now in progress! (Order ${updated.orderNumber})`,
            text:
              `Hi ${updated.name},\n\nGreat news — Vivian has started working on your commission! ` +
              `Follow along here:\n${trackUrl}\n\n— ${site.artistName}`,
            html:
              `<div style="font-family:sans-serif;color:#2e3263;max-width:520px;margin:auto">` +
              `<h2 style="color:#3e5fae">Your commission is underway! 🎨</h2>` +
              `<p>Hi ${updated.name}, Vivian has started working on your piece.</p>` +
              `<p><a href="${trackUrl}" style="display:inline-block;background:#8c64bd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">Follow your commission</a></p>` +
              `<p style="color:#5d4f7c;font-size:13px">Order ${updated.orderNumber}</p>` +
              `</div>`,
          });
      sent.email = r.ok && !r.skipped;
    }

    // They picked a platform we can't auto-send to (Instagram), or texting
    // didn't go through — the owner should send the link manually.
    if (pref !== "email" && !(pref === "text" && sent.text)) {
      manual = {
        platform: pref,
        handle: pref === "instagram" ? updated.instagram || "" : updated.phone || "",
        url: trackUrl,
      };
    }
  }

  return NextResponse.json({
    ok: true,
    commission: updated,
    warning,
    sent,
    preferred: updated.contactMethod || "email",
    manual,
    trackUrl,
  });
}

// Delete (decline & remove) a commission.
export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteCommission(id);
  return NextResponse.json({ ok: true });
}
