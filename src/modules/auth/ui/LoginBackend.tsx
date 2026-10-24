"use client"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import LoginView from "./LoginView"
export default function LoginBackend() {
  const router = useRouter()
  return (
    <LoginView
      previewEnabled={false}
      onLogin={() => {}}
      onAuthenticate={async (email, password) => {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          redirectTo: "/shift-check",
        })
        if (!result?.ok || result.error) throw new Error("Sign-in unsuccessful")
        router.push("/shift-check")
        router.refresh()
      }}
    />
  )
}
