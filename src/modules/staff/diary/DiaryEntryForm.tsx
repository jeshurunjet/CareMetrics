"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStaffData, useUpdateStaffData } from "../data/context"
import {
  getDiaryEntry,
  getCategories,
  isDemoOnShift,
  saveDiary,
  validateDiary,
  canAccessDiary,
} from "../data/diary-adapter"
import type { DiaryInput, DiarySubject } from "../data/types"
import { PageHeader, Avatar, Banner, Btn, Modal } from "../ui"
import FormField from "../ui/FormField"
import { toNZDateTimeInput, fromNZDateTimeInput } from "@/lib/time"
import { DiaryPreviewNotice, subjectName, UnavailableDiary } from "./shared"
import { diaryHistoryHref } from "./navigation"
import useUnsavedChanges from "./use-unsaved-changes"
export default function DiaryEntryForm({
  subject,
  draftId,
}: {
  subject: DiarySubject
  draftId?: string
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    router = useRouter()
  const existing = draftId ? getDiaryEntry(s, subject, draftId) : undefined
  const [title, setTitle] = useState(existing?.title ?? ""),
    [categoryId, setCategory] = useState(existing?.categoryId ?? ""),
    [body, setBody] = useState(existing?.body ?? ""),
    [covered, setCovered] = useState(
      toNZDateTimeInput(existing?.coveredAt ?? s.now),
    ),
    [reason, setReason] = useState(existing?.offShiftReason ?? "")
  const [errors, setErrors] =
      useState<Partial<Record<keyof DiaryInput, string>>>({}),
    [error, setError] = useState(""),
    [cancel, setCancel] = useState(false),
    [saved, setSaved] = useState(false)
  const initial = JSON.stringify([
    existing?.title ?? "",
    existing?.categoryId ?? "",
    existing?.body ?? "",
    toNZDateTimeInput(existing?.coveredAt ?? s.now),
    existing?.offShiftReason ?? "",
  ])
  const dirty =
    !saved &&
    JSON.stringify([title, categoryId, body, covered, reason]) !== initial
  useUnsavedChanges(dirty)
  const name = subjectName(s, subject),
    offShift = !isDemoOnShift(s),
    author = s.staff.find((e) => e.id === s.meId)
  if (
    !name ||
    !canAccessDiary(s, subject) ||
    (draftId &&
      (!existing ||
        existing.status !== "draft" ||
        existing.authorId !== s.meId))
  )
    return <UnavailableDiary subject={subject} />
  const leave = () => {
    setSaved(true)
    router.replace(diaryHistoryHref(subject))
  }
  function save(status: "draft" | "submitted") {
    const now = new Date().toISOString()
    const input = {
      title,
      categoryId,
      body,
      coveredAt: fromNZDateTimeInput(covered),
      offShiftReason: reason,
    }
    const errs = validateDiary({ ...s, now }, subject, input, status)
    if (covered && !input.coveredAt)
      errs.coveredAt = "Choose a valid, unambiguous New Zealand date and time."
    setErrors(errs)
    if (Object.keys(errs).length) {
      document
        .querySelector<HTMLElement>("[data-diary-editor]")
        ?.scrollIntoView({ block: "start" })
      return
    }
    try {
      const next = saveDiary(
        s,
        subject,
        input,
        status,
        crypto.randomUUID(),
        now,
        draftId,
      )
      setSaved(true)
      update(next)
      router.replace(diaryHistoryHref(subject))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Entry unavailable")
    }
  }
  return (
    <>
      <PageHeader
        back
        title={existing ? "Continue draft" : "New diary entry"}
        eyebrow={subject.scope === "client" ? "Client diary" : "House diary"}
        crumbs={[
          { label: name, route: { page: subject.scope, id: subject.targetId } },
          {
            label: "Diary",
            route: { page: subject.scope, id: subject.targetId, tab: "diary" },
          },
          { label: existing ? "Continue draft" : "New entry" },
        ]}
      />
      <div data-diary-editor>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            save("submitted")
          }}
        >
          <div className="cm-form-page">
            <div className="cm-context">
              <Avatar name={name} size={38} />
              <div>
                <strong>{name}</strong>
                <span>Author: {author?.name} · recorded automatically</span>
              </div>
            </div>
            <DiaryPreviewNotice />
            {offShift ? (
              <div className="cm-offshift">
                <Banner
                  tone="warning"
                  title="Off-Shift Entry · You're not clocked in"
                >
                  Documentation outside an active shift is allowed, but a reason
                  must be recorded.
                </Banner>
                <FormField
                  label="Reason for off-shift documentation"
                  required
                  htmlFor="offshift"
                  error={errors.offShiftReason}
                >
                  <input
                    id="offshift"
                    className="cm-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Completing notes after shift handover"
                  />
                </FormField>
              </div>
            ) : (
              <Banner tone="info">
                Demo active attendance · UI only, no verified GPS or real
                attendance. An off-shift reason is optional.
              </Banner>
            )}
            <div className="cm-form">
              <FormField
                label="Entry title"
                required
                htmlFor="d-title"
                error={errors.title}
              >
                <input
                  id="d-title"
                  className="cm-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Morning routine"
                />
              </FormField>
              <FormField
                label="Category"
                required
                htmlFor="d-cat"
                error={errors.categoryId}
              >
                <select
                  id="d-cat"
                  className="cm-input"
                  value={categoryId}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category…</option>
                  {getCategories(s, subject.scope).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Date and time covered"
                required
                htmlFor="d-covered"
                error={errors.coveredAt}
                help="Pacific/Auckland time, when the events happened. Creation and submission times are recorded separately."
              >
                <input
                  id="d-covered"
                  type="datetime-local"
                  className="cm-input"
                  value={covered}
                  onChange={(e) => setCovered(e.target.value)}
                />
              </FormField>
              <FormField
                label="Diary entry"
                required
                htmlFor="d-body"
                error={errors.body}
              >
                <textarea
                  id="d-body"
                  rows={8}
                  className="cm-input"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe what happened, using objective, respectful language."
                />
              </FormField>
              <small className="cm-count">{body.length} characters</small>
              {s.diaryCategories.find((c) => c.id === categoryId)?.name ===
                "Incident Reports" && (
                <Banner tone="warning" title="Incident reports">
                  Also notify your manager by phone for any injury or safety
                  incident.
                </Banner>
              )}
              {!offShift && (
                <FormField
                  label="Off-shift reason (optional)"
                  htmlFor="optional-reason"
                >
                  <input
                    id="optional-reason"
                    className="cm-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </FormField>
              )}
              {error && <p role="alert">{error}</p>}
            </div>
          </div>
          <div className="cm-form-actions">
            <Btn
              variant="ghost"
              onClick={() => (dirty ? setCancel(true) : leave())}
            >
              Cancel
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => save("draft")}
              disabled={saved}
            >
              Save draft
            </Btn>
            <Btn type="submit" icon="check" disabled={saved}>
              Submit entry
            </Btn>
          </div>
        </form>
      </div>
      {cancel && (
        <Modal
          title="Discard changes?"
          onClose={() => setCancel(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setCancel(false)}>
                Keep editing
              </Btn>
              <Btn variant="danger" onClick={leave}>
                Discard
              </Btn>
            </>
          }
        >
          <p className="cm-muted">
            Unsaved changes to this entry will be lost.
          </p>
        </Modal>
      )}
    </>
  )
}
