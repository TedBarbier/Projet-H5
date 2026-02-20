'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/feed')
    }
  }, [session, router])

  if (status === "loading") return <p>Loading...</p>

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">
          Bienvenue sur <span className="text-red-700">INSA Sports</span>
        </h1>

        {session ? (
          <div className="bg-green-100 p-8 rounded-xl shadow-md">
            <p className="text-2xl mb-4">You are logged in as {session.user?.email}</p>
            <p className="text-gray-600 mb-6">User ID: {session.user?.id}</p>
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="bg-gray-100 p-8 rounded-xl shadow-md">
            <p className="text-2xl mb-6">Please sign in to access the event.</p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 italic">Example valid: pierre.dupont@insa-lyon.fr</p>
              <p className="text-sm text-gray-500 italic">Example invalid: gmail.com</p>
              <button
                onClick={() => signIn(undefined, { callbackUrl: '/' })}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Sign In with Email
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
