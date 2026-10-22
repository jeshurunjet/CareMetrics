"use client"
import { useRef } from "react"
import type { FormOption, FormValue } from "./types"
import Icon from "@/components/Icon"
export default function ChoiceField({
  id,
  label,
  value,
  options,
  onChange,
  multiple = false,
  scale = false,
  required,
  error,
  describedBy,
  "aria-describedby": ariaDescription,
}: {
  id: string
  label: string
  value: FormValue | undefined
  options: readonly FormOption[]
  onChange: (value: FormValue) => void
  multiple?: boolean
  scale?: boolean
  required?: boolean
  error?: boolean
  describedBy?: string
  "aria-describedby"?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.findIndex((o) => String(value) === o.value)
  return (
    <div
      id={id}
      ref={ref}
      className={
        scale
          ? "cm-scale"
          : `cm-choice-row ${multiple ? "cm-choice-row--wrap" : ""}`
      }
      role={multiple ? "group" : "radiogroup"}
      aria-label={label}
      aria-required={!multiple && required ? true : undefined}
      aria-invalid={error}
      aria-describedby={describedBy ?? ariaDescription}
    >
      {options.map((o, i) => {
        const active = multiple
          ? Array.isArray(value) && value.some((v) => v === o.value)
          : String(value) === o.value
        return (
          <button
            type="button"
            key={o.value}
            role={multiple ? undefined : "radio"}
            aria-checked={multiple ? undefined : active}
            aria-pressed={multiple ? active : undefined}
            className={active ? "active" : ""}
            tabIndex={multiple || i === (selected >= 0 ? selected : 0) ? 0 : -1}
            onKeyDown={(e) => {
              if (multiple) return
              const delta =
                e.key === "ArrowRight" || e.key === "ArrowDown"
                  ? 1
                  : e.key === "ArrowLeft" || e.key === "ArrowUp"
                    ? -1
                    : 0
              if (!delta && e.key !== "Home" && e.key !== "End") return
              e.preventDefault()
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? options.length - 1
                    : (i + delta + options.length) % options.length
              onChange(
                scale ? Number(options[next].value) : options[next].value,
              )
              ref.current
                ?.querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus()
            }}
            onClick={() =>
              onChange(
                multiple
                  ? Array.isArray(value) && value.some((v) => v === o.value)
                    ? value.filter(
                        (v): v is string =>
                          typeof v === "string" && v !== o.value,
                      )
                    : [
                        ...(Array.isArray(value)
                          ? value.filter(
                              (v): v is string => typeof v === "string",
                            )
                          : []),
                        o.value,
                      ]
                  : scale
                    ? Number(o.value)
                    : o.value,
              )
            }
          >
            {multiple && active && <Icon name="check" size={14} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
