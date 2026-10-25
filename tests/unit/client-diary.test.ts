import { it, expect, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { diaryInput } from "../../src/server/diary/validation"
import { clientDiaryCategories } from "../../src/modules/diary/categories"
const input = () => ({
  requestId: "23000000-0000-4000-8000-000000000001",
  title: "Fictional observation",
  categoryKey: "progress-notes",
  content: "Fictional observation only.",
  coveredAt: "2026-10-25T10:00",
  offShiftReason: "After handover",
})
it("uses the four approved UI labels with stable category identifiers", () => {
  expect(clientDiaryCategories.map((c) => c.name)).toEqual([
    "Progress Notes",
    "GP / OT / Health Appointments",
    "Incident Reports",
    "General Update",
  ])
})
it("normalises plain text and converts a New Zealand covered time independently of submission time", () => {
  const p = diaryInput({ ...input(), title: "  Fictional observation  " })
  expect(p.title).toBe("Fictional observation")
  expect(p.coveredAt).toBe("2026-10-24T21:00:00.000Z")
  expect(p.category).toBe("Progress Notes")
})
it.each([
  { title: " " },
  { title: "x".repeat(161) },
  { content: "short" },
  { content: "x".repeat(10001) },
  { content: "invalid\u0000text" },
  { offShiftReason: "x".repeat(1001) },
  { categoryKey: "Maintenance" },
  { categoryKey: "cat1" },
  { requestId: "bad" },
  { coveredAt: "2026-02-30T10:00" },
  { coveredAt: "2026-09-27T02:30" },
  { coveredAt: "2026-04-05T02:30" },
  { coveredAt: "2026-10-24T21:00:00Z" },
  { authorId: "forged" },
  { organisationId: "forged" },
  { isOnShift: true },
  { status: "DRAFT" },
  { submittedAt: "2026-01-01" },
  { attachments: ["fake"] },
])("rejects malformed/unsupported submission %j", (patch) =>
  expect(() => diaryInput({ ...input(), ...patch })).toThrow(),
)
it("keeps HTML as literal text for escaped React presentation, never executable markup", () => {
  expect(
    diaryInput({ ...input(), content: "<script>window.privateData=1</script>" })
      .content,
  ).toBe("<script>window.privateData=1</script>")
})
