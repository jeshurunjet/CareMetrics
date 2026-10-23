"use client"
/** Temporary URL ownership belongs to this hook’s caller; no uploaded-file metadata is created. */
/** One resource registry for the shared session; keys distinguish employee/house/client photos. */
import { useEffect, useRef, useState } from "react"
import { Modal, Banner, Btn } from "../ui"
import {
  acceptedFiles,
  validateFileSelection,
  formatBytes,
  developmentFilePolicy,
} from "./policy"
import FileImage from "./FileImage"
export function useTemporaryEntityPhotos() {
  const urls = useRef(new Map<string, string>())
  useEffect(() => {
    const owned = urls.current
    return () => {
      owned.forEach((url) => URL.revokeObjectURL(url))
      owned.clear()
    }
  }, [])
  const clear = () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url))
    urls.current.clear()
  }
  return {
    clear,
    apply: (key: string, file: File) => {
      const previous = urls.current.get(key)
      if (previous) URL.revokeObjectURL(previous)
      const url = URL.createObjectURL(file)
      urls.current.set(key, url)
      return url
    },
  }
}
export function useTemporaryProfilePhoto() {
  const photos = useTemporaryEntityPhotos()
  const [url, setUrl] = useState<string | undefined>()
  return {
    url,
    clear: () => {
      photos.clear()
      setUrl(undefined)
    },
    apply: (file: File) => {
      const next = photos.apply("profile", file)
      setUrl(next)
      return next
    },
  }
}
export default function ProfilePhotoPicker({
  name,
  onClose,
  onApply,
  lifetime = "profile",
}: {
  name: string
  lifetime?: "profile" | "session"
  onClose: () => void
  onApply: (file: File) => void
}) {
  const [file, setFile] = useState<File | undefined>(undefined),
    [url, setUrl] = useState<string | undefined>(undefined),
    [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null)
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return (
    <Modal
      title={`Photo preview · ${name}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel photo selection
          </Btn>
          <Btn
            disabled={!file || !!error}
            onClick={() => {
              if (file) onApply(file)
            }}
          >
            Use temporary photo
          </Btn>
        </>
      }
    >
      <Banner tone="info">
        Development preview only. No file or record is uploaded or permanently
        changed.{" "}
        {lifetime === "session"
          ? "This temporary staff photo is shared until the development session reloads or ends."
          : "This photo preview ends when you leave or reload the profile."}
      </Banner>
      <p className="cm-hint">
        JPEG, PNG or WebP · provisional development limit{" "}
        {formatBytes(developmentFilePolicy.maxBytes)}. Use fictional images
        only.
      </p>
      <Btn
        variant="secondary"
        icon="image"
        onClick={() => input.current?.click()}
      >
        Select photo
      </Btn>
      <input
        ref={input}
        type="file"
        hidden
        aria-label="Select profile demonstration photo"
        accept={acceptedFiles(true)}
        onChange={(e) => {
          const selected = e.target.files?.[0]
          e.target.value = ""
          if (!selected) return
          const issue = validateFileSelection(selected, true)
          setError(issue ?? "")
          setFile(issue ? undefined : selected)
          setUrl(issue ? undefined : URL.createObjectURL(selected))
        }}
      />
      {file && (
        <p>
          {file.name} · {file.type} · {formatBytes(file.size)}
        </p>
      )}
      {url && (
        <FileImage
          src={url}
          name={`Selected profile photo for ${name}`}
          className="cm-preview-img"
        />
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
