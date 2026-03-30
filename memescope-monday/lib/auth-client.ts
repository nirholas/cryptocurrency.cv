import { stripeClient } from "@better-auth/stripe/client"
import { adminClient, oneTapClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  ],
  plugins: [
    stripeClient({
      subscription: true, //if you want to enable subscription management
    }),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_ONE_TAP_CLIENT_ID!,
      promptOptions: {
        maxAttempts: 1,
      },
    }),
    adminClient(),
  ],
})

export const {
  signIn,
  signUp,
  useSession,
  signOut,
  getSession,
  updateUser,
  changePassword,
  resetPassword,
  oneTap,
  admin,
} = authClient

// forgetPassword exists at runtime but isn't in the generated types for this version
export const forgetPassword = (
  authClient as unknown as Record<
    string,
    (options: {
      email: string
      redirectTo: string
      fetchOptions?: { headers?: Record<string, string> }
    }) => Promise<unknown>
  >
).forgetPassword
