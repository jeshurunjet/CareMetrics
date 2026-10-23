"use client"
import { createContext, useContext } from "react"
import type { StaffSnapshot } from "../staff/data/types"
export type PreviewRole = "Administrator" | "Manager" | "Staff" | "Senior Staff"
export interface PreviewSession {
  data: StaffSnapshot
  update: React.Dispatch<React.SetStateAction<StaffSnapshot>>
  role: PreviewRole
  setRole: (role: PreviewRole) => void
  loaded: boolean
  load: (data: StaffSnapshot) => void
  reset: () => void
  selectEmployee: (id: string) => void
  photo: (kind: "employee" | "house" | "client", id: string, file: File) => void
}
export const PreviewContext = createContext<PreviewSession | null>(null)
export function usePreviewSession() {
  const value = useContext(PreviewContext)
  if (!value) throw new Error("Development preview unavailable")
  return value
}
export function useOptionalPreviewSession() {
  return useContext(PreviewContext)
}
