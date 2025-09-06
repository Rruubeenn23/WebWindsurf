import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const firstName = String(formData.get('first_name'))
  const lastName = String(formData.get('last_name'))
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Create the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (authError) {
    return NextResponse.redirect(
      `${requestUrl.origin}/signup?error=Could not create user`,
      { status: 301 }
    )
  }

  // If email confirmation is required
  if (authData.user?.identities?.length === 0) {
    return NextResponse.redirect(
      `${requestUrl.origin}/signup?message=Check your email to confirm your account`,
      { status: 301 }
    )
  }

  return NextResponse.redirect(requestUrl.origin + '/onboarding', {
    status: 301,
  })
}
