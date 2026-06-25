import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { aceoPrice } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { listAceos, saveAceo, updateAceo, deleteAceo } from "@/lib/store";

// List all ACEO listings (owner view).
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ aceos: await listAceos() });
}

// Create a new listing.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, imageUrl, price } = await req.json();
  if (!imageUrl || !String(imageUrl).startsWith("http")) {
    return NextResponse.json({ error: "Please upload an image first." }, { status: 400 });
  }
  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    title: (title || "Untitled ACEO").trim().slice(0, 120),
    imageUrl,
    price: Math.max(1, Math.round(Number(price) || aceoPrice)),
    status: "available", // available | sold
  };
  await saveAceo(record);
  return NextResponse.json({ ok: true, aceo: record });
}

// Update a listing (status / price / title).
export async function PATCH(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, status, price, title } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const patch = {};
  if (status && ["available", "sold"].includes(status)) patch.status = status;
  if (price !== undefined && price !== "") patch.price = Math.max(1, Math.round(Number(price)));
  if (title !== undefined) patch.title = String(title).trim().slice(0, 120);
  const updated = await updateAceo(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, aceo: updated });
}

// Delete a listing.
export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteAceo(id);
  return NextResponse.json({ ok: true });
}
