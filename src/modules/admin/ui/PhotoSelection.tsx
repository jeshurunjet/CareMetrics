"use client"
import Image from "next/image"
import { useState } from "react"
import { Avatar, Btn } from "@/modules/staff/ui"
import ProfilePhotoPicker from "@/modules/staff/files/ProfilePhotoPicker"
export default function PhotoSelection({
  name,
  photo,
  onSelect,
  house = false,
  disabled = false,
}: {
  name: string
  house?: boolean
  disabled?: boolean
  photo?: string
  onSelect: (file: File) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="ad-photo-row">
      {house && photo ? (
        <Image
          unoptimized
          width={1080}
          height={720}
          className="ad-photo-lg"
          src={photo}
          alt={name || "Fictional house"}
        />
      ) : (
        <Avatar name={name.trim() || "?"} size={64} photo={photo} />
      )}
      <Btn
        variant="secondary"
        size="sm"
        icon="image"
        disabled={disabled}
        title={disabled ? "Future Development" : undefined}
        onClick={() => setOpen(true)}
      >
        {disabled ? "Photo upload unavailable" : "Select demonstration photo"}
      </Btn>
      <span className="ad-faint">
        {disabled
          ? "Future Development · photos are not persisted"
          : "Temporary preview only · no upload"}
      </span>
      {open && (
        <ProfilePhotoPicker
          name={name.trim() || "New record"}
          onClose={() => setOpen(false)}
          onApply={(file) => {
            onSelect(file)
            setOpen(false)
          }}
          lifetime="session"
        />
      )}
    </div>
  )
}
