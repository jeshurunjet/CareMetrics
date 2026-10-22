"use client"
import { PageHeader, Empty, Btn, useNav } from "@/modules/staff/ui"
export default function NotFound() {
  const nav = useNav()
  return (
    <>
      <PageHeader title="Record could not be found" back />
      <Empty
        icon="shield"
        title="Record unavailable"
        text="This record may not exist or may not be assigned to you. Contact management if you need assistance."
        action={
          <Btn variant="secondary" onClick={() => nav.go({ page: "houses" })}>
            My houses
          </Btn>
        }
      />
    </>
  )
}
