import { db } from "@/drizzle/db"
import { stripe } from "@better-auth/stripe"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, captcha, oneTap } from "better-auth/plugins"
import Stripe from "stripe"

import { sendEmail } from "@/lib/email"

const hasStripe =
  process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("placeholder")

const stripeClient = hasStripe ? new Stripe(process.env.STRIPE_SECRET_KEY!) : null

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const html = `
        <p>Hello ${user.name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${url}" style="padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${url}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const html = `
        <p>Hello ${user.name},</p>
        <p>Click the link below to verify your email address:</p>
        <a href="${url}" style="padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `

      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html,
      })
    },
    expiresIn: 86400,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  ],
  plugins: [
    ...(hasStripe && stripeClient
      ? [
          stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
          }),
        ]
      : []),
    ...(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SECRET_KEY !== "placeholder"
      ? [
          captcha({
            provider: "cloudflare-turnstile" as const,
            secretKey: process.env.TURNSTILE_SECRET_KEY,
            endpoints: ["/sign-up/email", "/sign-in/email", "/forget-password"],
          }),
        ]
      : []),
    ...(process.env.NEXT_PUBLIC_ONE_TAP_CLIENT_ID &&
    process.env.NEXT_PUBLIC_ONE_TAP_CLIENT_ID !== "placeholder"
      ? [
          oneTap({
            clientId: process.env.NEXT_PUBLIC_ONE_TAP_CLIENT_ID,
          }),
        ]
      : []),
    admin({}),
  ],
})
