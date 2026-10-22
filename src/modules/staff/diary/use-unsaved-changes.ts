"use client"
/** Protect explicit navigation and browser history while an editor is dirty. */
// Shared app navigation is rendered as buttons; drawer controls are harmless but also guarded.
// A same-URL guard entry lets a cancelled Back keep the editor mounted.
import { useEffect } from "react"
export default function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const url = window.location.href,
      state = window.history.state
    window.history.pushState(state, "", url)
    let leaving = false
    const confirm = () =>
      window.confirm(
        "Discard changes? Unsaved changes to this entry will be lost.",
      )
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    const click = (event: MouseEvent) => {
      const el =
        event.target instanceof Element
          ? event.target.closest("a,button")
          : null
      if (!el || el.closest("[data-diary-editor],.cm-modal-layer")) return
      if (!confirm()) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const pop = (event: PopStateEvent) => {
      if (leaving) return
      event.stopImmediatePropagation()
      if (confirm()) {
        leaving = true
        window.history.back()
      } else window.history.pushState(state, "", url)
    }
    window.addEventListener("beforeunload", unload)
    document.addEventListener("click", click, true)
    window.addEventListener("popstate", pop, true)
    return () => {
      window.removeEventListener("beforeunload", unload)
      document.removeEventListener("click", click, true)
      window.removeEventListener("popstate", pop, true)
    }
  }, [dirty])
}
