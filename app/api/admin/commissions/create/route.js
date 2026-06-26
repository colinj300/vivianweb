import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mediums, backgrounds } from "@/lib/config";
import { isAuthorized } from "@/lib/admin";
import { saveCommission, getByOrderNumber } from "@/lib/store";
import { genOrderNumber } from "@/lib/commissions";

// Manually add a commission that came from off the website (Instagram, in
// person, etc.). It's created already approved + in progress, with an order
// number, so it shows up like any other active commission.
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, email, mediumId, sizeName, additionalSubjects, backgroundId, price, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  }

  const medium = mediums.find((m) => m.id === mediumId) || mediums[0];
  const background = backgrounds.find((b) => b.id === backgroundId) || backgrounds[0];

  let orderNumber = genOrderNumber();
  for (let i = 0; i < 5 && (await getByOrderNumber(orderNumber)); i++) {
    orderNumber = genOrderNumber();
  }

  const priceNum =
    price !== "" && price !== undefined && price !== null ? Math.round(Number(price)) : null;

  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: name.trim().slice(0, 200),
    email: (email || "").trim().slice(0, 200),
    mediumId: medium.id,
    mediumName: medium.name,
    sizeId: null,
    isCustom: false,
    customSize: "",
    sizeName: (sizeName || "").trim().slice(0, 80) || "—",
    additionalSubjects: Math.max(0, Math.round(Number(additionalSubjects) || 0)),
    backgroundId: background.id,
    backgroundName: background.name,
    images: [],
    request: (notes || "").trim().slice(0, 4000),
    estimate: priceNum,
    finalPrice: priceNum,
    paymentLink: null,
    status: "approved",
    stage: "in_progress",
    orderNumber,
    manual: true,
  };

  await saveCommission(record);
  return NextResponse.json({ ok: true, commission: record });
}
