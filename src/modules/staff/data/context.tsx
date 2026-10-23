"use client"
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react"
import type { StaffSnapshot } from "./types"
import { useTemporaryEntityPhotos } from "../files/ProfilePhotoPicker"
import { validateFileSelection } from "../files/policy"
import { getMyProfile } from "../profile/adapter"
import { projectStaffSnapshot } from "./projection"
import { mergeSnapshot } from "@/modules/preview/merge"
import { PreviewContext, type PreviewRole } from "@/modules/preview/context"
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
  const [role, setRole] = useState<PreviewRole>("Staff")
  const [loaded, setLoaded] = useState(false)
  const photos = useTemporaryEntityPhotos()
  const scoped = useMemo(() => projectStaffSnapshot(snapshot), [snapshot])
  const update =
    useCallback<React.Dispatch<React.SetStateAction<StaffSnapshot>>>(
      (action) =>
        setSnapshot((current) => {
          const view = projectStaffSnapshot(current)
          const patch = typeof action === "function" ? action(view) : action
          return patch === view ? current : mergeSnapshot(current, patch)
        }),
      [],
    )
  const applyPhoto = (file: File) => {
    if (!getMyProfile(snapshot) || validateFileSelection(file, true))
      throw new Error("Photo selection unavailable")
    const url = photos.apply(`employee:${snapshot.meId}`, file)
    setSnapshot((current) => ({
      ...current,
      staff: current.staff.map((e) =>
        e.id === current.meId ? { ...e, photo: url } : e,
      ),
    }))
  }
  const reset = () => {
    photos.clear()
    setSnapshot(data)
    setRole("Staff")
    setLoaded(false)
  }
  return (
    <PreviewContext.Provider
      value={{
        data: snapshot,
        update: setSnapshot,
        role,
        setRole,
        loaded,
        load: (full) => {
          if (!loaded) {
            setSnapshot((current) => mergeSnapshot(full, current))
            setLoaded(true)
          }
        },
        reset,
        selectEmployee: (id) => {
          if (!snapshot.staff.some((e) => e.id === id))
            throw new Error("Employee unavailable")
          setSnapshot((current) => ({ ...current, meId: id }))
        },
        photo: (kind, id, file) => {
          if (
            !["Administrator", "Manager"].includes(role) ||
            validateFileSelection(file, true)
          )
            throw new Error("Photo unavailable")
          if (
            kind === "employee" &&
            role !== "Administrator" &&
            snapshot.staff.find((e) => e.id === id)?.role === "Administrator"
          )
            throw new Error("Restricted account")
          const url = photos.apply(`${kind}:${id}`, file)
          const keyName =
            kind === "employee"
              ? "staff"
              : kind === "house"
                ? "houses"
                : "clients"
          setSnapshot((current) => ({
            ...current,
            [keyName]: current[keyName].map((e) =>
              e.id === id ? { ...e, photo: url } : e,
            ),
          }))
        },
      }}
    >
      <Context.Provider value={scoped}>
        <UpdateContext.Provider value={update}>
          <PhotoContext.Provider value={applyPhoto}>
            {children}
          </PhotoContext.Provider>
        </UpdateContext.Provider>
      </Context.Provider>
    </PreviewContext.Provider>
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
