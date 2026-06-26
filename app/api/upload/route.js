import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

// Issues short-lived tokens so the browser can upload images straight to
// Vercel Blob (bypassing the ~4.5 MB serverless body limit). Requires
// BLOB_READ_WRITE_TOKEN (auto-set when a Blob store is connected in Vercel).
export async function POST(req) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo uploads aren't set up yet." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/heic",
          "image/heif",
          "image/avif",
        ],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      // We get the URL from the client; nothing to do on completion.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Could not upload image." },
      { status: 400 }
    );
  }
}
