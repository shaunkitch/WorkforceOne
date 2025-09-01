'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TokenRegistrationForm } from '@/components/registration/TokenRegistrationForm'
import { Loader2 } from 'lucide-react'

function RegisterContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return <TokenRegistrationForm initialToken={token} />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}