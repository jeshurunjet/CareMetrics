"use client"
import Image from "next/image"
import SourcePhoto from "./SourcePhoto"
import type { House } from "../data/types"
import { Card, Status, useNav } from "./index"
export default function HouseCard({
  h,
  currentHouseId,
}: {
  h: Pick<House, "id" | "name" | "address"> & Partial<Pick<House, "photo">>
  currentHouseId?: string
}) {
  const nav = useNav()
  return (
    <Card
      className="cm-house-mini"
      onClick={() => nav.go({ page: "house", id: h.id })}
    >
      {h.photo ? (
        <Image
          src={h.photo}
          alt=""
          width={320}
          height={160}
          loading="eager"
          unoptimized
        />
      ) : (
        <SourcePhoto
          alt="House photo not recorded"
          style={{ height: "7rem" }}
        />
      )}
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
