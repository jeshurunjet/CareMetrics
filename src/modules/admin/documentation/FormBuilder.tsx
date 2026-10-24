"use client"
import { useState } from "react"
import type { TemplateDraft } from "../../staff/care/types"
import type {
  FormFieldDefinition,
  FormSectionDefinition,
} from "../../forms/types"
import { allFields } from "../../forms/engine"
import { Btn, Banner, Icon } from "../../staff/ui"
import { Field, useAdminFormGuard } from "../ui/Form"
import { useAdmin } from "../ui/core"
import ConfirmDialog from "../workforce/ConfirmDialog"
import { saveDraft, publishTemplate } from "./adapter"
import { fieldTypes, validateTemplate } from "./validation"
import { makeField, move, duplicateField, newSection } from "./builder-model"
import PropertiesEditor, { typeLabels, typeIcons } from "./PropertiesEditor"
import StaffFormPreview from "./StaffFormPreview"
export default function FormBuilder({
  id,
  initial,
  kind,
}: {
  id: string
  kind: "care" | "chart"
  initial: TemplateDraft
}) {
  const { data, update, role } = useAdmin(),
    [draft, setDraft] = useState(() => structuredClone(initial)),
    [saved, setSaved] = useState(JSON.stringify(initial)),
    [selected, setSelected] = useState(""),
    [validating, setValidating] = useState(false),
    [publishing, setPublishing] = useState(false),
    [message, setMessage] = useState("")
  const dirty = JSON.stringify(draft) !== saved,
    discard = useAdminFormGuard(dirty),
    issues = validateTemplate(draft),
    sections = draft.form.sections,
    fields = allFields(draft.form),
    section = sections.find(
      (s) => s.id === selected || s.fields.some((f) => f.id === selected),
    ),
    field = fields.find((f) => f.id === selected)
  const setSections = (sections: readonly FormSectionDefinition[]) =>
    setDraft((d) => ({ ...d, form: { ...d.form, sections } }))
  const setField = (f: FormFieldDefinition) =>
    setSections(
      sections.map((s) => ({
        ...s,
        fields: s.fields.map((x) => (x.id === f.id ? f : x)),
      })),
    )
  const setSection = (s: FormSectionDefinition) =>
    setSections(sections.map((x) => (x.id === s.id ? s : x)))
  const addSection = () => {
    const s = newSection()
    setSections([...sections, s])
    setSelected(s.id)
  }
  const addField = (type: FormFieldDefinition["type"]) => {
    const f = makeField(type),
      target = section ?? sections[0] ?? newSection()
    setSections(
      sections.length
        ? sections.map((s) =>
            s.id === target.id ? { ...s, fields: [...s.fields, f] } : s,
          )
        : [{ ...target, fields: [f] }],
    )
    setSelected(f.id)
  }
  const save = () => {
    try {
      update(saveDraft(data, role, id, draft))
      setSaved(JSON.stringify(draft))
      setMessage("Draft saved in this development session.")
    } catch (e) {
      setMessage((e as Error).message)
    }
  }
  const navigateIssue = (target: string) => {
    setSelected(target)
    requestAnimationFrame(() => {
      const el =
        document.getElementById(`outline-${target}`) ??
        document.getElementById("template-details")
      el?.focus()
      el?.scrollIntoView({ block: "nearest" })
    })
  }
  return (
    <div data-diary-editor className="ad-document-builder">
      <div className="ad-builder-bar">
        <span role="status">
          {dirty ? "Unsaved changes" : "Draft saved · session only"}
        </span>
        <div className="ad-inline">
          <Btn variant="secondary" onClick={save}>
            Save Draft
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => {
              setValidating(true)
              if (issues.length) navigateIssue(issues[0].target)
            }}
          >
            Validate{issues.length ? ` (${issues.length})` : ""}
          </Btn>
          <Btn
            variant="ghost"
            onClick={() =>
              document
                .querySelector(".ad-builder-preview")
                ?.scrollIntoView({ block: "start" })
            }
          >
            Preview
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => {
              if (discard()) {
                setDraft(structuredClone(initial))
                setSaved(JSON.stringify(initial))
                setMessage("Unsaved edits discarded.")
              }
            }}
          >
            Discard edits
          </Btn>
          <Btn
            icon="check"
            disabled={issues.length > 0}
            onClick={() => setPublishing(true)}
          >
            Publish v{draft.form.version}
          </Btn>
        </div>
      </div>
      {message && <p role="status">{message}</p>}
      {validating && (
        <div
          className={`cm-banner cm-banner--${
            issues.length ? "danger" : "success"
          }`}
          role={issues.length ? "alert" : "status"}
        >
          <div>
            <strong>
              {issues.length
                ? `${issues.length} blocking template errors`
                : "Template is valid for publication"}
            </strong>
            {issues.map((e, i) => (
              <p key={`${e.target}-${i}`}>
                <button
                  type="button"
                  className="ad-link"
                  onClick={() => navigateIssue(e.target)}
                >
                  {e.target}: {e.message}
                </button>
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="ad-builder">
        <aside className="ad-palette" aria-label="Form structure">
          <h3>Form structure</h3>
          <Btn variant="secondary" size="sm" icon="plus" onClick={addSection}>
            Add section
          </Btn>
          {sections.map((s, si) => (
            <div className="ad-outline-section" key={s.id}>
              <button
                type="button"
                id={`outline-${s.id}`}
                className={`ad-outline-select ${
                  selected === s.id ? "active" : ""
                }`}
                onClick={() => setSelected(s.id)}
              >
                {s.title || "Untitled section"}
              </button>
              <div className="ad-inline">
                <button
                  aria-label={`Move section ${s.title} up`}
                  disabled={!si}
                  onClick={() => setSections(move(sections, si, -1))}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move section ${s.title} down`}
                  disabled={si === sections.length - 1}
                  onClick={() => setSections(move(sections, si, 1))}
                >
                  ↓
                </button>
                <button
                  aria-label={`Remove section ${s.title}`}
                  onClick={() => {
                    if (
                      !s.fields.length ||
                      window.confirm(
                        "Remove this draft section and its questions? Dependent conditions must be repaired before publishing.",
                      )
                    ) {
                      setSections(sections.filter((x) => x.id !== s.id))
                      setSelected("")
                    }
                  }}
                >
                  ×
                </button>
              </div>
              {s.fields.map((f, fi) => (
                <div
                  className={`ad-field-card ${
                    selected === f.id ? "selected" : ""
                  }`}
                  key={f.id}
                >
                  <button
                    id={`outline-${f.id}`}
                    className="ad-outline-select"
                    onClick={() => setSelected(f.id)}
                  >
                    {f.label || "Untitled question"}
                    <small>
                      {typeLabels[f.type]}
                      {f.required ? " · required" : ""}
                    </small>
                  </button>
                  <div className="ad-field-tools">
                    <button
                      aria-label={`Move ${f.label} up`}
                      disabled={!fi}
                      onClick={() =>
                        setSection({ ...s, fields: move(s.fields, fi, -1) })
                      }
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Move ${f.label} down`}
                      disabled={fi === s.fields.length - 1}
                      onClick={() =>
                        setSection({ ...s, fields: move(s.fields, fi, 1) })
                      }
                    >
                      ↓
                    </button>
                    <button
                      aria-label={`Duplicate ${f.label}`}
                      onClick={() => {
                        const copy = duplicateField(f)
                        setSection({
                          ...s,
                          fields: [
                            ...s.fields.slice(0, fi + 1),
                            copy,
                            ...s.fields.slice(fi + 1),
                          ],
                        })
                        setSelected(copy.id)
                      }}
                    >
                      ⧉
                    </button>
                    <button
                      aria-label={`Remove ${f.label}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remove this draft question? Historical published versions are unchanged. Repair dependent conditions before publishing.",
                          )
                        ) {
                          setSection({
                            ...s,
                            fields: s.fields.filter((x) => x.id !== f.id),
                          })
                          setSelected(s.id)
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <h4>Add field</h4>
          {fieldTypes.map((t) => (
            <button
              key={t}
              className="ad-palette-type"
              type="button"
              onClick={() => addField(t)}
            >
              <Icon name={typeIcons[t]} size={14} />
              {typeLabels[t]}
            </button>
          ))}
          {(["photo", "file"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled
              title="Secure uploads are unavailable"
            >
              <Icon name={typeIcons[t]} size={14} />
              {typeLabels[t]}
            </button>
          ))}
        </aside>
        <div className="ad-canvas">
          <div className="ad-canvas-head" id="template-details" tabIndex={-1}>
            <label className="sr-only" htmlFor="builder-template-name">
              Template name
            </label>
            <input
              id="builder-template-name"
              className="ad-title-input"
              value={draft.name}
              aria-required="true"
              placeholder="Template name"
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
            <label className="sr-only" htmlFor="builder-template-description">
              Template description
            </label>
            <input
              id="builder-template-description"
              className="ad-desc-input"
              value={draft.description}
              placeholder="Short description shown to staff"
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          {!fields.length && (
            <Banner tone="info">
              Add a section and questions from the left panel. This draft is not
              published or assigned.
            </Banner>
          )}
          <StaffFormPreview
            key={JSON.stringify(draft.form)}
            version={draft.form}
            name={draft.name}
          />
          <Field
            label="Version notes"
            value={draft.summary}
            type="textarea"
            onChange={(summary) => setDraft((d) => ({ ...d, summary }))}
          />
          <details>
            <summary>Chart history presentation (optional)</summary>
            <p className="ad-faint">
              Select history columns; numeric charts require an explicit unit.
            </p>
            {fields.map((f) => (
              <label key={f.id} className="ad-check">
                <input
                  type="checkbox"
                  checked={draft.history?.columns.includes(f.id) ?? false}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      history: {
                        ...d.history,
                        columns: e.target.checked
                          ? [...(d.history?.columns ?? []), f.id]
                          : (d.history?.columns ?? []).filter(
                              (id) => id !== f.id,
                            ),
                      },
                    }))
                  }
                />
                {f.label}
              </label>
            ))}
            <label className="ad-check">
              <input
                type="checkbox"
                checked={!!draft.history?.chart}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    history: {
                      columns: d.history?.columns ?? [],
                      chart: e.target.checked
                        ? {
                            fieldId:
                              fields.find((f) =>
                                ["number", "scale"].includes(f.type),
                              )?.id ?? "",
                            unit: "",
                          }
                        : undefined,
                    },
                  }))
                }
              />
              Simple numeric history chart
            </label>
            {draft.history?.chart && (
              <>
                <label>
                  Numeric field
                  <select
                    className="cm-input"
                    value={draft.history.chart.fieldId}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        history: {
                          columns: d.history?.columns ?? [],
                          chart: {
                            unit: d.history?.chart?.unit ?? "",
                            fieldId: e.target.value,
                          },
                        },
                      }))
                    }
                  >
                    <option value="">Choose numeric field</option>
                    {fields
                      .filter((f) => ["number", "scale"].includes(f.type))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </label>
                <Field
                  label="Chart unit"
                  value={draft.history.chart.unit}
                  onChange={(unit) =>
                    setDraft((d) => ({
                      ...d,
                      history: {
                        columns: d.history?.columns ?? [],
                        chart: { fieldId: d.history!.chart!.fieldId, unit },
                      },
                    }))
                  }
                />
              </>
            )}
          </details>
        </div>
        <PropertiesEditor
          field={field}
          section={section}
          fields={fields}
          sections={sections}
          onField={setField}
          onSection={setSection}
          moveToSection={(id) => {
            if (field)
              setSections(
                sections.map((s) => ({
                  ...s,
                  fields:
                    s.id === id
                      ? [...s.fields.filter((f) => f.id !== field.id), field]
                      : s.fields.filter((f) => f.id !== field.id),
                })),
              )
          }}
        />
      </div>
      {publishing && (
        <ConfirmDialog
          title="Publish template version?"
          confirm="Confirm Publish"
          onClose={() => setPublishing(false)}
          text={
            <>
              <p>
                {draft.name} · {kind === "care" ? "Care Plan" : "Charting"} · v
                {draft.form.version} · {sections.length} sections ·{" "}
                {fields.length} fields
              </p>
              <p>
                Published versions are immutable and retained for historical
                records. This saves your current draft and publishes a
                session-only version. Client assignments will not change
                automatically.
              </p>
            </>
          }
          onConfirm={() => {
            try {
              update(
                publishTemplate(
                  saveDraft(data, role, id, draft),
                  role,
                  id,
                  true,
                ),
              )
              setSaved(JSON.stringify(draft))
              setPublishing(false)
            } catch (e) {
              setMessage((e as Error).message)
              setPublishing(false)
            }
          }}
        />
      )}
    </div>
  )
}
