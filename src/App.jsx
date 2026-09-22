import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Layout from './components/Layout'
import DashboardPage from './components/DashboardPage'
import AssignmentsPage from './components/AssignmentsPage'
import JoinGroup from './components/JoinGroup'
import GroupsPage from './components/GroupsPage'
import CalendarPage from './components/CalendarPage'
import ProfilePage from './components/ProfilePage'

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f7f4' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#414073' }}>
            <span style={{ color: '#E7EBC5', fontSize: 18, fontWeight: 700 }}>A</span>
          </div>
          <p className="text-sm font-medium" style={{ color: '#414073' }}>Loading Asignio...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AuthRedirectHandler user={user} />
      <Routes>
        <Route
          path="/"
          element={
            user
              ? <Layout user={user}><DashboardPage user={user} /></Layout>
              : <Login />
          }
        />
        <Route
          path="/assignments"
          element={
            user
              ? <Layout user={user}><AssignmentsPage user={user} /></Layout>
              : <Login />
          }
        />
        <Route
          path="/groups"
          element={
            user
              ? <Layout user={user}><GroupsPage user={user} /></Layout>
              : <Login />
          }
        />
        <Route
          path="/calendar"
          element={
            user
              ? <Layout user={user}><CalendarPage user={user} /></Layout>
              : <Login />
          }
        />
        <Route
          path="/profile"
          element={
            user
              ? <Layout user={user}><ProfilePage user={user} /></Layout>
              : <Login />
          }
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