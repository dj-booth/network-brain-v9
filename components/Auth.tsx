'use client'

import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

export default function AuthForm() {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  if (!session) {
    return (
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']} // Only Google provider
        redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`} // Ensure this callback URL is set up in Supabase
      />
    )
  } else {
    // You can redirect the user or show authenticated content here
    // Example: router.push('/dashboard') or return <Dashboard />
    return (
      <div>
        Logged in! User ID: {session.user.id}
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    )
  }
} 