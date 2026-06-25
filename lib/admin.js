// Secure password gate for the owner's admin panel.
//
// How it works:
//  - You set ADMIN_PASSWORD in the server environment (never shipped to the
//    browser).
//  - On login the password is checked in constant time, and a signed session
//    token (an HMAC of the password — NOT the password itself) is stored in an
//    httpOnly, Secure cookie. Scripts can't read it and it only travels over
//    HTTPS, so it's safe to stay logged in from any device.
//  - Every admin API call verifies that cookie.
import crypto from "crypto";

export const ADMIN_COOKIE = "vw_admin";

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// The session token derived from the admin password. Knowing the token does
// not reveal the password, and it can't be forged without it.
export function sessionToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHmac("sha256", pw).update("vw-admin-session-v1").digest("hex");
}

// Constant-time check of a submitted password against ADMIN_PASSWORD.
export function passwordMatches(password) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return timingSafeEqual(String(password || ""), pw);
}

// Is this request carrying a valid admin session cookie?
export function isAuthorized(req) {
  const token = sessionToken();
  if (!token) return false; // no password configured → locked down
  const cookie = req.cookies?.get(ADMIN_COOKIE)?.value;
  return timingSafeEqual(cookie || "", token);
}
