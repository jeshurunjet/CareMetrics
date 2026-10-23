import type { StaffSnapshot } from "../staff/data/types"
/** Merge a scoped Staff update without dropping records outside that projection. */
export function mergeSnapshot(
  base: StaffSnapshot,
  patch: StaffSnapshot,
): StaffSnapshot {
  const next = { ...base, demoAttendance: patch.demoAttendance }
  for (const key of Object.keys(patch) as Array<keyof StaffSnapshot>) {
    const a = base[key],
      b = patch[key]
    if (!Array.isArray(a) || !Array.isArray(b)) continue
    const identity = (v: unknown) => {
      const r = v as Record<string, unknown>
      return String(
        r.id ??
          (r.templateId
            ? `${r.clientId}:${r.templateId}`
            : r.notificationId
              ? `${r.notificationId}:${r.employeeId}`
              : r.houseId
                ? `${r.employeeId}:${r.houseId}`
                : `${r.employeeId}:${r.typeId}`),
      )
    }
    const map = new Map(a.map((v) => [identity(v), v]))
    for (const v of b) {
      const before = map.get(identity(v))
      map.set(identity(v), { ...before as object, ...v })
    }
    Object.assign(next, { [key]: [...map.values()] })
  }
  return next
}
