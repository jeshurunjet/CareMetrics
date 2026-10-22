import type {
  DiaryEntry,
  DiarySubject,
  DiaryInput,
  StaffSnapshot,
} from "./types"
import { getClient, getHouse } from "./queries"
export function canAccessDiary(
  s: StaffSnapshot,
  subject: DiarySubject,
): boolean {
  return !!(subject.scope === "client"
    ? getClient(s, subject.targetId)
    : getHouse(s, subject.targetId))
}
export function getHistory(
  s: StaffSnapshot,
  subject?: DiarySubject,
): DiaryEntry[] {
  return s.diary
    .filter(
      (d) =>
        canAccessDiary(s, d) &&
        (d.status !== "draft" || d.authorId === s.meId) &&
        (!subject ||
          (d.scope === subject.scope && d.targetId === subject.targetId)),
    )
    .sort((a, b) =>
      (b.submittedAt ?? b.createdAt).localeCompare(
        a.submittedAt ?? a.createdAt,
      ),
    )
}
export function getDiaryEntry(
  s: StaffSnapshot,
  subject: DiarySubject,
  id: string,
) {
  return getHistory(s, subject).find((d) => d.id === id)
}
export function getCategories(s: StaffSnapshot, scope: DiarySubject["scope"]) {
  return s.diaryCategories.filter((c) => c.active && c.scope === scope)
}
export function isDemoOnShift(s: StaffSnapshot) {
  return (
    !!s.demoAttendance &&
    s.demoAttendance.employeeId === s.meId &&
    s.shifts.some(
      (sh) =>
        sh.id === s.demoAttendance?.shiftId &&
        sh.staffId === s.meId &&
        !!getHouse(s, sh.houseId) &&
        sh.start <= s.now &&
        sh.end > s.now,
    )
  )
}
export function validateDiary(
  s: StaffSnapshot,
  subject: DiarySubject,
  input: DiaryInput,
  status: "draft" | "submitted",
) {
  const errors: Partial<Record<keyof DiaryInput, string>> = {}
  if (!input.title.trim()) errors.title = "Enter a title."
  if (status === "submitted") {
    if (!getCategories(s, subject.scope).some((c) => c.id === input.categoryId))
      errors.categoryId = "Choose a category."
    if (input.body.trim().length < 10)
      errors.body = "Write at least a short note (10+ characters)."
    if (
      !Number.isFinite(Date.parse(input.coveredAt)) ||
      Date.parse(input.coveredAt) > Date.parse(s.now)
    )
      errors.coveredAt = "Choose a valid covered time, no later than now."
    if (!isDemoOnShift(s) && !input.offShiftReason.trim())
      errors.offShiftReason =
        "A reason is required when you are not clocked in."
  } else if (input.coveredAt && !Number.isFinite(Date.parse(input.coveredAt)))
    errors.coveredAt = "Choose a valid covered time."
  return errors
}
export function saveDiary(
  s: StaffSnapshot,
  subject: DiarySubject,
  input: DiaryInput,
  status: "draft" | "submitted",
  id: string,
  now: string,
  existingId?: string,
): StaffSnapshot {
  if (!canAccessDiary(s, subject)) throw new Error("Diary unavailable")
  const existing = existingId
    ? getDiaryEntry(s, subject, existingId)
    : undefined
  if (
    existingId &&
    (!existing || existing.status !== "draft" || existing.authorId !== s.meId)
  )
    throw new Error("Only your own drafts may be edited")
  const errors = validateDiary({ ...s, now }, subject, input, status)
  if (Object.keys(errors).length)
    throw new Error(Object.values(errors).join(" "))
  const entry: DiaryEntry = {
    ...subject,
    ...input,
    id: existing?.id ?? id,
    authorId: s.meId,
    title: input.title.trim(),
    body: input.body.trim(),
    coveredAt: input.coveredAt || now,
    createdAt: existing?.createdAt ?? now,
    submittedAt: status === "submitted" ? now : undefined,
    status,
    offShiftReason: input.offShiftReason.trim() || undefined,
  }
  if (!existing && s.diary.some((d) => d.id === id))
    throw new Error("Duplicate diary ID")
  return { ...s, diary: [entry, ...s.diary.filter((d) => d.id !== entry.id)] }
}
export function canRequestCorrection(s: StaffSnapshot, entry: DiaryEntry) {
  return (
    canAccessDiary(s, entry) &&
    entry.status !== "draft" &&
    entry.authorId === s.meId &&
    !s.corrections.some(
      (c) => c.recordId === entry.id && c.status === "pending",
    )
  )
}
export function requestCorrection(
  s: StaffSnapshot,
  subject: DiarySubject,
  recordId: string,
  reason: string,
  proposed: string,
  id: string,
  now: string,
): StaffSnapshot {
  const entry = getDiaryEntry(s, subject, recordId)
  if (!entry || !canRequestCorrection(s, entry))
    throw new Error("Correction unavailable")
  if (!reason.trim() || !proposed.trim())
    throw new Error("Reason and proposed correction are required.")
  if (s.corrections.some((c) => c.id === id))
    throw new Error("Duplicate correction ID")
  return {
    ...s,
    corrections: [
      {
        id,
        recordId,
        requestingEmployeeId: s.meId,
        reason: reason.trim(),
        proposed: proposed.trim(),
        requestedAt: now,
        status: "pending",
      },
      ...s.corrections,
    ],
  }
}
/** No staff approval or submitted-record editing operation is exposed. */
export const diaryQueries = {
  getHistory,
  getDiaryEntry,
  getCategories,
  saveDiary,
  requestCorrection,
}
export function queryDiaryHistory(
  s: StaffSnapshot,
  subject: DiarySubject,
  filters: {
    query?: string
    categoryId?: string
    days?: number
    page?: number
  } = {},
) {
  const query = filters.query?.trim().toLowerCase()
  const list = getHistory(s, subject)
    .filter((d) => !filters.categoryId || d.categoryId === filters.categoryId)
    .filter(
      (d) =>
        !query ||
        `${d.title} ${d.body} ${s.staff.find((e) => e.id === d.authorId)?.name ?? ""}`
          .toLowerCase()
          .includes(query),
    )
    .filter(
      (d) =>
        filters.days === undefined ||
        (Date.parse(s.now) - Date.parse(d.coveredAt) >= 0 &&
          Date.parse(s.now) - Date.parse(d.coveredAt) <=
            filters.days * 86400000),
    )
  const per = 6,
    page = Math.max(
      1,
      Math.min(filters.page ?? 1, Math.max(1, Math.ceil(list.length / per))),
    )
  return {
    items: list.slice((page - 1) * per, page * per),
    total: list.length,
    page,
    per,
  }
}
