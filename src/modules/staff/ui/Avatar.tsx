"use client"
import Image from "next/image"
export default function Avatar({
  name,
  tone = "var(--color-brand)",
  size = 40,
  photo,
}: {
  name: string
  tone?: string
  size?: number
  photo?: string
}) {
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
        background: photo
          ? undefined
          : `color-mix(in srgb, ${tone} 16%, white)`,
        color: tone,
      }}
    >
      {photo ? (
        <Image src={photo} alt="" width={size} height={size} unoptimized />
      ) : (
        initials
      )}
    </span>
  )
}
