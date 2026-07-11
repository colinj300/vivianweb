// Normalize a Stripe Checkout Session into the buyer + shipping details we
// store on an order (ACEO sale, pre-order, etc.).
export function orderFromSession(session) {
  const buyerName = session.customer_details?.name || "";
  const buyerEmail = session.customer_details?.email || "";
  const buyerPhone = session.customer_details?.phone || "";
  // Physical items collect a shipping address; fall back to the billing
  // address on customer_details if shipping wasn't collected.
  const ship = session.shipping_details || session.customer_details;
  const a = ship?.address || null;
  const shipping = a
    ? {
        name: ship.name || buyerName,
        line1: a.line1 || "",
        line2: a.line2 || "",
        city: a.city || "",
        state: a.state || "",
        zip: a.postal_code || "",
        country: a.country || "",
      }
    : null;

  return {
    sessionId: session.id,
    buyer: { name: buyerName, email: buyerEmail, phone: buyerPhone },
    shipping,
    amount: (session.amount_total || 0) / 100,
  };
}

// A printable multi-line address block (or a friendly fallback).
export function formatAddress(shipping) {
  if (!shipping) return "(no address on file)";
  const s = shipping;
  return (
    `${s.name}\n${s.line1}${s.line2 ? ", " + s.line2 : ""}\n` +
    `${s.city}, ${s.state} ${s.zip}\n${s.country}`
  );
}
