"use client"
import { useState } from "react"
import Image from "next/image"
import { Btn } from "../ui"
export default function FileImage({
  src,
  name,
  className,
  retry = true,
}: {
  src: string
  name: string
  className?: string
  retry?: boolean
}) {
  const [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0),
    [loaded, setLoaded] = useState(false)
  return failed ? (
    <div className="cm-file-image-error" role="status">
      <p>Image preview unavailable.</p>
      {retry && (
        <Btn
          size="sm"
          variant="secondary"
          onClick={() => {
            setAttempt((v) => v + 1)
            setFailed(false)
          }}
        >
          Retry image preview
        </Btn>
      )}
    </div>
  ) : (
    <div className="cm-file-image">
      {!loaded && (
        <span className="cm-image-loading" role="status">
          Loading image…
        </span>
      )}
      <Image
        key={attempt}
        src={
          attempt && src.startsWith("/demo-assets/")
            ? `${src}?previewRetry=${attempt}`
            : src
        }
        alt={name}
        width={960}
        height={640}
        unoptimized
        loading="eager"
        className={className}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
