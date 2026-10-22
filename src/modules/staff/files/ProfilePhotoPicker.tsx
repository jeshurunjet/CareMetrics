"use client"
/** Photo resources belong to the mounted profile, never to the shared metadata adapter. */
import { useEffect, useRef, useState } from "react"
import { Modal, Banner, Btn } from "../ui"
import {
  acceptedFiles,
  validateFileSelection,
  formatBytes,
  developmentFilePolicy,
} from "./policy"
import FileImage from "./FileImage"
export function useTemporaryProfilePhoto() {
  const [url, setUrl] = useState<string | undefined>(undefined)
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return { url, apply: (file: File) => setUrl(URL.createObjectURL(file)) }
}
export default function ProfilePhotoPicker({
  name,
  onClose,
  onApply,
}: {
  name: string
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
        changed. This photo preview ends when you leave or reload the profile.
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
