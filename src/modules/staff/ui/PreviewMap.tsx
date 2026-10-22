"use client"
import dynamic from "next/dynamic"
import type { House } from "../data/types"
import { Spinner } from "./index"
const Map = dynamic(() => import("./HouseMap"), {
  ssr: false,
  loading: () => (
    <div className="cm-map-loading">
      <Spinner label="Loading demonstration map" />
    </div>
  ),
})
export default function PreviewMap({ house }: { house: House }) {
  return <Map house={house} />
}
