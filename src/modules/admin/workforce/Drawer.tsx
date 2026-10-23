"use client"
/** Source Admin Drawer geometry with shared modal keyboard/focus conventions. */
import { useEffect, useId, useRef, type ReactNode } from "react"
import { Icon } from "../../staff/ui"
interface DrawerProps {
  title: string
  sub?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}
export default function Drawer({
  title,
  sub,
  onClose,
  children,
  footer,
  wide,
}: DrawerProps) {
  const ref = useRef<HTMLElement>(null),
    close = useRef(onClose),
    id = useId()
  useEffect(() => {
    close.current = onClose
  }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus()
    const key = (e: KeyboardEvent) => {
      if (document.querySelector(".cm-modal-layer")) return
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopImmediatePropagation()
        close.current()
      }
      if (e.key === "Tab") {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],select,input,textarea,[tabindex="0"]',
          ) || [],
        )
        const first = items[0],
          last = items.at(-1)
        if (!ref.current?.contains(document.activeElement)) {
          e.preventDefault()
          first?.focus()
        } else if (e.shiftKey && document.activeElement === first) {
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
      if (previous?.isConnected) previous.focus()
      else
        document
          .querySelector<HTMLElement>('.ad-tabs [aria-selected="true"]')
          ?.focus()
    }
  }, [])
  return (
    <div className="ad-drawer-layer">
      <button
        className="ad-drawer-backdrop"
        aria-label="Close panel"
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        data-diary-editor
        ref={ref}
        className={`ad-drawer ${wide ? "ad-drawer--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="ad-drawer-head">
          <div>
            <h2 id={id}>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="ad-drawer-body">{children}</div>
        {footer && <div className="ad-drawer-foot">{footer}</div>}
      </aside>
    </div>
  )
}
