"use client"
import { useState } from "react"
import type { ConfigurableFormVersion, FormValues } from "../../forms/types"
import { initialFormValues, validateForm } from "../../forms/engine"
import { validateTemplate } from "./validation"
import DynamicFormRenderer from "../../forms/DynamicFormRenderer"
import { Btn } from "../../staff/ui"
export default function StaffFormPreview({
  version,
  name,
}: {
  version: ConfigurableFormVersion
  name: string
}) {
  const [device, setDevice] = useState("mobile"),
    [values, setValues] = useState<FormValues>(() =>
      initialFormValues(version),
    ),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [tested, setTested] = useState(false)
  const unsafe = validateTemplate({
    name: name || "Preview",
    description: "",
    summary: "",
    form: { ...version, published: false },
  }).filter(
    (i) => i.target !== "template" || /structure|unique/.test(i.message),
  )
  return (
    <div className="ad-builder-preview">
      <div className="ad-preview-tools">
        <div className="ad-seg">
          <button
            type="button"
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
          >
            Mobile preview
          </button>
          <button
            type="button"
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
          >
            Desktop preview
          </button>
        </div>
        <Btn
          variant="ghost"
          size="sm"
          onClick={() => {
            setValues(initialFormValues(version))
            setErrors({})
            setTested(false)
          }}
        >
          Reset preview
        </Btn>
      </div>
      <div className={`ad-preview ad-preview--${device}`}>
        <div className="ad-preview-frame cm-app">
          <header className="ad-preview-head">
            <h3>{name || "Untitled template"}</h3>
            <small>
              Staff form · interactive preview · no record is created
            </small>
          </header>
          {unsafe.length ? (
            <p role="status">
              Fix template configuration to preview these questions:{" "}
              {unsafe.map((i) => i.message).join(" ")}
            </p>
          ) : (
            <DynamicFormRenderer
              version={version}
              values={values}
              onChange={(v) => {
                setValues(v)
                setErrors({})
                setTested(false)
              }}
              errors={errors}
            />
          )}
          <Btn
            variant="secondary"
            onClick={() => {
              setErrors(
                unsafe.length
                  ? {
                      template:
                        "Fix template configuration before testing answers.",
                    }
                  : validateForm(version, values),
              )
              setTested(true)
            }}
          >
            Test validation
          </Btn>
          {tested && (
            <p role="status">
              {Object.keys(errors).length
                ? `${Object.keys(errors).length} answer errors. Complete the highlighted questions.`
                : "Preview answers are valid. No record was submitted."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
