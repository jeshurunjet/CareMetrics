"use client"
export default function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="cm-skeleton">
      {Array.from({ length: rows }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  )
}
