"use client"
import Image from "next/image"
import { useState } from "react"
import { illustratedAvatar } from "@/lib/demo-media"
export default function Avatar({
  name,
  tone = "var(--color-brand)",
  size = 40,
  photo,
  recordId,
}: {
  name: string
  tone?: string
  size?: number
  photo?: string
  recordId?: string
}) {
  const [failed, setFailed] = useState<string | null>(null)
  const source = photo ?? (recordId ? illustratedAvatar(recordId) : undefined)
  const available = source && source !== failed
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
  return (
    <span
      className="cm-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: available
          ? undefined
          : `color-mix(in srgb, ${tone} 16%, white)`,
        color: tone,
      }}
    >
      {available ? (
        <Image
          src={source}
          alt={`Illustrated avatar for ${name}`}
          width={size}
          height={size}
          unoptimized
          loading={size >= 64 ? "eager" : "lazy"}
          onError={() => setFailed(source)}
        />
      ) : (
        initials
      )}
    </span>
  )
}
