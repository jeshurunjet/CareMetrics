"use client"
import { useState, type CSSProperties } from "react"
import Image from "next/image"
import Icon from "@/components/Icon"
export default function SourcePhoto({
  src,
  alt,
  className,
  style,
}: {
  src?: string
  alt: string
  className?: string
  style?: CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  return failed || !src ? (
    <div
      className={`cm-photo-unavailable ${className ?? ""}`}
      style={style}
      role="img"
      aria-label={alt}
    >
      <Icon name="image" />
      <span>Photo unavailable</span>
    </div>
  ) : (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={400}
      unoptimized
      loading="eager"
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
