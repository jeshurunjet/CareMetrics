"use client"
import Image from "next/image"
import type { House } from "../data/types"
import { Card, Status, useNav } from "./index"
export default function HouseCard({
  h,
  currentHouseId,
}: {
  h: House
  currentHouseId?: string
}) {
  const nav = useNav()
  return (
    <Card
      className="cm-house-mini"
      onClick={() => nav.go({ page: "house", id: h.id })}
    >
      <Image
        src={h.photo}
        alt=""
        width={320}
        height={160}
        loading="eager"
        unoptimized
      />
      <div>
        <strong>
          {h.name}
          {h.id === currentHouseId && (
            <Status tone="brand" dot={false}>
              Today
            </Status>
          )}
        </strong>
        <span>{h.address}</span>
      </div>
    </Card>
  )
}
