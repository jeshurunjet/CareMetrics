"use client"
import { createContext, useContext, useState } from "react"
import type { StaffSnapshot } from "./types"
import { useTemporaryProfilePhoto } from "../files/ProfilePhotoPicker"
import { validateFileSelection } from "../files/policy"
import { getMyProfile } from "../profile/adapter"
const PhotoContext = createContext<((file: File) => void) | null>(null)
const Context = createContext<StaffSnapshot | null>(null)
const UpdateContext =
  createContext<React.Dispatch<React.SetStateAction<StaffSnapshot>> | null>(
    null,
  )
export default function StaffDataProvider({
  data,
  children,
}: {
  data: StaffSnapshot
  children: React.ReactNode
}) {
  const [snapshot, setSnapshot] = useState(data)
  const temporaryPhoto = useTemporaryProfilePhoto()
  const applyPhoto = (file: File) => {
    if (!getMyProfile(snapshot) || validateFileSelection(file, true))
      throw new Error("Photo selection unavailable")
    const url = temporaryPhoto.apply(file)
    setSnapshot((current) => ({
      ...current,
      staff: current.staff.map((e) =>
        e.id === current.meId ? { ...e, photo: url } : e,
      ),
    }))
  }
  return (
    <Context.Provider value={snapshot}>
      <UpdateContext.Provider value={setSnapshot}>
        <PhotoContext.Provider value={applyPhoto}>
          {children}
        </PhotoContext.Provider>
      </UpdateContext.Provider>
    </Context.Provider>
  )
}
export function useStaffData() {
  const s = useContext(Context)
  if (!s) throw new Error("Staff preview provider missing")
  return s
}
export function useUpdateStaffData() {
  const update = useContext(UpdateContext)
  if (!update) throw new Error("Staff preview provider missing")
  return update
}

export function useApplyStaffPhoto() {
  const apply = useContext(PhotoContext)
  if (!apply) throw new Error("Staff preview provider missing")
  return apply
}
