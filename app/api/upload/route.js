import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Receives a (browser-compressed) image and stores it in Vercel Blob.
// Requires BLOB_READ_WRITE_TOKEN (auto-set when a Blob store is connected).
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo uploads aren't set up yet." },
      { status: 503 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload an image." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image is too large." }, { status: 400 });
    }

    const safeName = (file.name || "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`uploads/${Date.now()}-${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Could not upload image." },
      { status: 500 }
    );
  }
}
