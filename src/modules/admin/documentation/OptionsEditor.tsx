"use client"
import type { FormOption } from "../../forms/types"
import { Btn } from "../../staff/ui"
import { Field } from "../ui/Form"
import { move, key } from "./builder-model"
export default function OptionsEditor({
  options,
  onChange,
}: {
  options: readonly FormOption[]
  onChange: (options: FormOption[]) => void
}) {
  return (
    <div className="ad-prop-options">
      <h4>Options</h4>
      {options.map((o, i) => (
        <div
          key={i}
          className="ad-option-editor"
          role="group"
          aria-label={`Option ${i + 1}`}
        >
          <Field
            label={`Option ${i + 1} label`}
            value={o.label}
            onChange={(label) =>
              onChange(options.map((x, n) => (n === i ? { ...x, label } : x)))
            }
          />
          <Field
            label={`Option ${i + 1} stable value`}
            value={o.value}
            onChange={(value) =>
              onChange(options.map((x, n) => (n === i ? { ...x, value } : x)))
            }
          />
          <div className="ad-inline">
            <Btn
              size="sm"
              variant="ghost"
              disabled={!i}
              onClick={() => onChange(move(options, i, -1))}
            >
              Move option {i + 1} up
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              disabled={i === options.length - 1}
              onClick={() => onChange(move(options, i, 1))}
            >
              Move option {i + 1} down
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => onChange(options.filter((_, n) => n !== i))}
            >
              Remove option {i + 1}
            </Btn>
          </div>
        </div>
      ))}
      <Btn
        size="sm"
        variant="secondary"
        icon="plus"
        onClick={() =>
          onChange([...options, { value: key("option"), label: "New option" }])
        }
      >
        Add option
      </Btn>
      <p className="ad-faint">
        Stable values identify answers. Changes apply only to this draft.
      </p>
    </div>
  )
}
