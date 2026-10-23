"use client"
import { PageHeader, Empty, Btn, useNav } from "../ui"
export default function Settings() {
  const nav = useNav()
  return (
    <>
      <PageHeader
        title="Settings"
        back
        crumbs={[
          { label: "Dashboard", route: { page: "home" } },
          { label: "Settings" },
        ]}
      />
      <Empty
        icon="settings"
        title="Settings — Coming soon"
        text="Account and application preferences will be available in a future release."
        action={
          <Btn variant="secondary" onClick={() => nav.go({ page: "home" })}>
            Back to Dashboard
          </Btn>
        }
      />
    </>
  )
}
