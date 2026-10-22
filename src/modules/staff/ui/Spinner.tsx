"use client"
export default function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="cm-spinner" role="status" aria-label={label} />
}
