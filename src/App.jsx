import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import JoinGroup from './components/JoinGroup'

function AuthRedirectHandler({ user }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const savedPath = localStorage.getItem('redirectAfterLogin')
      if (savedPath && savedPath !== '/') {
        localStorage.removeItem('redirectAfterLogin')
        navigate(savedPath)
      }
    }
  }, [user])

  return null
}

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

  return (
    <BrowserRouter>
      <AuthRedirectHandler user={user} />
      <Routes>
        <Route
          path="/"
          element={user ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/join/:inviteCode"
          element={user ? <JoinGroup user={user} /> : <Login />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App