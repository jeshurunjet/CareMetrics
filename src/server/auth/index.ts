import "server-only"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { backendEnvironment } from "../config/backend"
import { authenticateCredentials } from "./credentials"
import { database } from "../db"
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const config = backendEnvironment()
  return {
    secret: config.secret,
    trustHost: true, // Every public Auth.js handler validates the request origin against AUTH_URL first.
    useSecureCookies: config.origin.startsWith("https:"),
    pages: { signIn: "/login", error: "/login" },
    session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
    providers: [
      Credentials({
        credentials: { email: {}, password: {} },
        authorize: authenticateCredentials,
      }),
    ],
    logger: {
      error() {
        console.error("Authentication operation unavailable")
      },
      warn() {},
      debug() {},
    },
    events: {
      async signOut(message) {
        if (
          "token" in message &&
          message.token?.sub &&
          typeof message.token.sessionVersion === "number"
        ) {
          await database().user.updateMany({
            where: {
              id: message.token.sub,
              sessionVersion: message.token.sessionVersion,
            },
            data: { sessionVersion: { increment: 1 } },
          })
        }
      },
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id
          token.sessionVersion = user.sessionVersion
        }
        if (!token.sub || typeof token.sessionVersion !== "number") return null
        return token
      },
      async session({ session, token }) {
        // No role, hash or provider token is trusted/exposed through the browser session.
        return {
          expires: session.expires,
          user: {
            id: token.sub!,
            sessionVersion: token.sessionVersion as number,
          },
        }
      },
    },
  }
})
