"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import Link from "next/link"

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const supabase = createClient()

  useEffect(() => {
    const verifyEmail = async () => {
      if (type === 'signup' && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          })

          if (error) throw error
          
          setIsVerified(true)
          setIsLoading(false)
        } catch (error: any) {
          setError(error.error_description || error.message)
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [token, type, supabase.auth])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Icons.logo className="h-12 w-12 animate-spin" />
        <p className="mt-4 text-lg font-medium">Verifying your email...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-muted-foreground">
              {error || 'An error occurred while verifying your email.'}
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 shadow-lg">
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Icons.logo className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold">Email Verified</h1>
            <p className="text-muted-foreground">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  )
}
