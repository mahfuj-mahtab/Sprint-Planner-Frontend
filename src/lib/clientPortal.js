export const PORTAL_ROLE = "client";

export function isClientPortalAccess(access) {
  return access?.role === PORTAL_ROLE || access?.isClientPortal;
}
