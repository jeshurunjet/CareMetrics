"use client"
import { createContext, useContext } from "react"
import type { StaffSnapshot } from "./types"
const Context = createContext<StaffSnapshot | null>(null)
export default function StaffDataProvider({
  data,
  children,
}: {
  data: StaffSnapshot
  children: React.ReactNode
}) {
  return <Context.Provider value={data}>{children}</Context.Provider>
}
export function useStaffData() {
  const s = useContext(Context)
  if (!s) throw new Error("Staff preview provider missing")
  return s
}
