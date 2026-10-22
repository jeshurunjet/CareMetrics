"use client"
import { createContext, useContext, useState } from "react"
import type { StaffSnapshot } from "./types"
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
  return (
    <Context.Provider value={snapshot}>
      <UpdateContext.Provider value={setSnapshot}>
        {children}
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
