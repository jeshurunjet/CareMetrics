/** Browser-only UI marker, never a trusted identity, role, token or access control. No credentials stored. */
const key = "caremetrics-development-mock-session"
export function beginMockSession() {
  try {
    sessionStorage.setItem(key, "fictional-staff-preview")
  } catch {
    /* Preview still works when storage is unavailable. */
  }
}
export function clearMockSession() {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* No real session exists. */
  }
}
