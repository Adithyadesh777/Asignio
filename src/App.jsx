import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-indigo-600 font-medium text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-2">Welcome to Asignio</h1>
      <p className="text-gray-500 mb-6">Logged in as: {user.email}</p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-lg transition"
      >
        Sign Out
      </button>
    </div>
  )
}

export default App