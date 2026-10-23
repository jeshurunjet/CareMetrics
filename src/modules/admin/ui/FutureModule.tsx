"use client"
import { Empty } from "@/modules/staff/ui"
import { PageHead } from "./core"
export default function FutureModule({ title }: { title: string }) {
  return (
    <>
      <PageHead title={title} sub="Future Admin module" />
      <Empty
        title="Management workflow coming in a later phase"
        text="This destination is a bounded preview. No approvals, roster edits, publication, file removal, delivery or audit service is connected."
      />
    </>
  )
}
