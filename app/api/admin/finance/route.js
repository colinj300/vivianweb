import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthorized } from "@/lib/admin";
import { preorder } from "@/lib/config";
import {
  listCommissions,
  listAceos,
  listPreorders,
  listFinanceEntries,
  saveFinanceEntry,
  deleteFinanceEntry,
} from "@/lib/store";

// Build the full ledger: auto income from commissions + ACEO sales, plus
// the manual entries Vivian adds herself.
async function buildLedger() {
  const [commissions, aceos, preorders, manual] = await Promise.all([
    listCommissions(),
    listAceos(),
    listPreorders(),
    listFinanceEntries(),
  ]);

  const auto = [];

  for (const c of commissions) {
    if (c.status !== "approved" && c.status !== "completed") continue;
    const amount = c.finalPrice ?? c.estimate;
    if (amount == null) continue;
    auto.push({
      id: `commission-${c.id}`,
      type: "income",
      label: `Commission — ${c.name}${c.orderNumber ? ` (${c.orderNumber})` : ""}`,
      amount: Number(amount),
      at: c.createdAt,
      source: "commission",
      estimated: c.finalPrice == null,
    });
  }

  for (const a of aceos) {
    if (a.status !== "sold") continue;
    auto.push({
      id: `aceo-${a.id}`,
      type: "income",
      label: `ACEO — ${a.title || "untitled"}`,
      amount: Number(a.price) || 0,
      at: a.soldAt || a.createdAt,
      source: "aceo",
      estimated: false,
    });
  }

  // Pre-order income (only sheets that are still paid — refunded ones drop off).
  for (const p of preorders) {
    if (p.status !== "paid" && p.status !== "fulfilled") continue;
    auto.push({
      id: `preorder-${p.id}`,
      type: "income",
      label: `Pre-order — ${preorder.title}${p.quantity > 1 ? ` ×${p.quantity}` : ""} (${p.name || "buyer"})`,
      amount: Number(p.amount) || 0,
      at: p.createdAt,
      source: "preorder",
      estimated: false,
    });
  }

  const manualEntries = manual.map((m) => ({ ...m, source: "manual" }));

  const entries = [...auto, ...manualEntries].sort(
    (a, b) => new Date(b.at) - new Date(a.at)
  );

  const sum = (list) => list.reduce((t, e) => t + (Number(e.amount) || 0), 0);
  const income = sum(entries.filter((e) => e.type === "income"));
  const expenses = sum(entries.filter((e) => e.type === "expense"));

  const now = new Date();
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthIncome = sum(thisMonth.filter((e) => e.type === "income"));
  const monthExpenses = sum(thisMonth.filter((e) => e.type === "expense"));

  return {
    entries,
    totals: {
      income,
      expenses,
      profit: income - expenses,
      monthIncome,
      monthExpenses,
      monthProfit: monthIncome - monthExpenses,
    },
  };
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await buildLedger());
}

// Add a manual entry. { type: "income"|"expense", label, amount, at? }
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { type, label, amount, at } = await req.json();

  if (!["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "Pick income or expense." }, { status: 400 });
  }
  if (!label?.trim()) {
    return NextResponse.json({ error: "Please add a label." }, { status: 400 });
  }
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Please enter an amount above 0." }, { status: 400 });
  }
  const when = at ? new Date(at) : new Date();
  if (isNaN(when.getTime())) {
    return NextResponse.json({ error: "That date doesn't look right." }, { status: 400 });
  }

  await saveFinanceEntry({
    id: randomUUID(),
    type,
    label: label.trim().slice(0, 200),
    amount: Math.round(value * 100) / 100,
    at: when.toISOString(),
  });

  return NextResponse.json(await buildLedger());
}

// Remove a manual entry. ?id=...
export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteFinanceEntry(id);
  return NextResponse.json(await buildLedger());
}
