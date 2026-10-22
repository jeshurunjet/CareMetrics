"use client"
import { PageHeader, Empty } from "./index"
export default function StaffPlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader
        title={title}
        subtitle="UI ONLY · detailed screen migration pending"
        back
      />
      <Empty
        icon="layers"
        title="Screen migration pending"
        text="The approved detail interface will be migrated in the next phase."
      />
    </>
  )
}
