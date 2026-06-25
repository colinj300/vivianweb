// Simple password gate for the owner's admin pages.
// Set ADMIN_PASSWORD in your environment. The admin page sends it in the
// "x-admin-password" header on every request.
export function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    // If no password is set, lock everything down rather than leave it open.
    return false;
  }
  const provided = req.headers.get("x-admin-password");
  return provided === expected;
}
