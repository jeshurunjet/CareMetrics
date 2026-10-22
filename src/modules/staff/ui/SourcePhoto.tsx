"use client"
import { useState } from "react"
import Image from "next/image"
import Icon from "@/components/Icon"
export default function SourcePhoto({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <div
      className={`cm-photo-unavailable ${className ?? ""}`}
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
      onError={() => setFailed(true)}
    />
  )
}
