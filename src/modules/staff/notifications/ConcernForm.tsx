"use client"
import { useId, useState } from "react"
import { useStaffData, useUpdateStaffData } from "../data/context"
import { me, myClients, myHouses } from "../data/selectors"
import { Modal, Btn, Banner, Icon } from "../ui"
import FormField from "../ui/FormField"
import {
  acceptedFiles,
  validateFileSelection,
  formatBytes,
} from "../files/policy"
import { contextName, submitConcern, validateConcern } from "./adapter"
import type { ConcernInput } from "./types"
import useUnsavedChanges from "../diary/use-unsaved-changes"
export default function ConcernForm({
  context,
  targetId,
  onClose,
  onCreated,
}: {
  context?: string
  targetId?: string
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    formId = useId()
  const [form, setForm] = useState<ConcernInput>({
      context: context ?? "",
      targetId: targetId ?? "",
      title: "",
      description: "",
      priority: "Medium",
    }),
    [tried, setTried] = useState(false),
    [fileError, setFileError] = useState(""),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const dirty =
    !saved &&
    !!(
      form.title ||
      form.description ||
      form.attachment ||
      form.context !== (context ?? "") ||
      form.targetId !== (targetId ?? "") ||
      form.priority !== "Medium"
    )
  useUnsavedChanges(dirty)
  const errors = validateConcern(s, form),
    targets =
      form.context === "client"
        ? myClients(s)
        : form.context === "house"
          ? myHouses(s)
          : []
  const cancel = () => {
    if (saved) return
    if (
      !dirty ||
      window.confirm("Discard changes? Unsaved concern will be lost.")
    ) {
      setSaved(true)
      onClose()
    }
  }
  return (
    <Modal
      title="Submit a concern"
      subtitle="Concerns are reviewed by management before any official notice is published."
      onClose={cancel}
      footer={
        <>
          <Btn variant="secondary" disabled={saved} onClick={cancel}>
            Cancel
          </Btn>
          <Btn type="submit" form={formId} icon="flag" disabled={saved}>
            {saved ? "Opening details…" : "Submit concern"}
          </Btn>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="cm-form"
        data-diary-editor
        onSubmit={(e) => {
          e.preventDefault()
          if (saved) return
          setTried(true)
          if (Object.keys(errors).length || fileError) return
          try {
            const id = crypto.randomUUID()
            const next = submitConcern(s, form, id, new Date().toISOString())
            setSaved(true)
            update(next)
            onCreated(id)
          } catch {
            setError("Concern unavailable")
          }
        }}
      >
        <Banner tone="info">
          Development only · fictional submission, not delivered to management
          or saved permanently. Do not enter real personal or health
          information.
        </Banner>
        <FormField label="Submitting employee" htmlFor="co-employee">
          <input
            id="co-employee"
            className="cm-input"
            readOnly
            value={me(s).name}
          />
        </FormField>
        <FormField
          label="Concern context"
          required
          htmlFor="co-context"
          error={tried ? errors.context : undefined}
        >
          <select
            id="co-context"
            className="cm-input"
            value={form.context}
            onChange={(e) =>
              setForm({ ...form, context: e.target.value, targetId: "" })
            }
          >
            <option value="">Select…</option>
            <option value="client">Client</option>
            <option value="house">House</option>
          </select>
        </FormField>
        <FormField
          label="Related client or house"
          required
          htmlFor="co-target"
          error={tried ? errors.targetId : undefined}
        >
          <select
            id="co-target"
            className="cm-input"
            value={form.targetId}
            onChange={(e) => setForm({ ...form, targetId: e.target.value })}
          >
            <option value="">Select…</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </FormField>
        {form.context === "client" &&
          contextName(s, "client", form.targetId) && (
            <p className="cm-hint">
              House:{" "}
              {
                myHouses(s).find(
                  (h) =>
                    h.id ===
                    myClients(s).find((c) => c.id === form.targetId)?.houseId,
                )?.name
              }
            </p>
          )}
        <FormField
          label="Concern title"
          required
          htmlFor="co-title"
          error={tried ? errors.title : undefined}
        >
          <input
            id="co-title"
            className="cm-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </FormField>
        <FormField
          label="Description"
          required
          htmlFor="co-desc"
          error={tried ? errors.description : undefined}
        >
          <textarea
            id="co-desc"
            className="cm-input"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
        <fieldset className="cm-concern-priority">
          <legend>Priority</legend>
          <div className="cm-choice-row">
            {["Low", "Medium", "High"].map((p) => (
              <button
                type="button"
                key={p}
                className={form.priority === p ? "active" : ""}
                aria-pressed={form.priority === p}
                onClick={() => setForm({ ...form, priority: p })}
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>
        {form.priority === "High" && (
          <Banner tone="warning">
            Submitting a concern does not replace your organisation&apos;s
            urgent incident or emergency procedures. Follow the appropriate
            escalation process when immediate action is required.
          </Banner>
        )}
        <FormField
          label="Supporting file (optional)"
          htmlFor="co-file"
          error={fileError || errors.attachment}
          help="Selection metadata only. File contents are not retained or uploaded; preview/download after submission is unavailable."
        >
          <input
            id="co-file"
            className="cm-input"
            type="file"
            accept={acceptedFiles()}
            onChange={(e) => {
              const file = e.target.files?.[0]
              const error = file ? validateFileSelection(file) : undefined
              setFileError(error ?? "")
              setForm({
                ...form,
                attachment:
                  file && !error
                    ? { name: file.name, type: file.type, size: file.size }
                    : undefined,
              })
              e.target.value = ""
            }}
          />
        </FormField>
        {form.attachment && (
          <div className="cm-notice-card">
            <Icon name="file" size={16} />
            <span>
              {form.attachment.name} · {formatBytes(form.attachment.size)} ·
              selected metadata
            </span>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => {
                setForm({ ...form, attachment: undefined })
                setFileError("")
              }}
            >
              Remove selection
            </Btn>
          </div>
        )}
        {error && (
          <p className="cm-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
