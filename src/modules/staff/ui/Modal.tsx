"use client"
import { useEffect, useId, useRef } from "react"
import Icon from "@/components/Icon"
export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const el = ref.current
    el?.querySelector<HTMLButtonElement>("button")?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],select,input,[tabindex="0"]',
          ),
        )
        const first = items[0],
          last = items.at(-1)
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("keydown", key)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div className="cm-modal-layer">
      <button
        className="cm-modal-backdrop"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        ref={ref}
        className="cm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="cm-modal-head">
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="cm-modal-body">{children}</div>
        {footer && <div className="cm-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
