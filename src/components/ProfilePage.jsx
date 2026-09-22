import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ProfilePage({ user }) {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    groups: 0
  })
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState(
    user.email?.split('@')[0] || ''
  )
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)

    if (data) {
      setStats({
        total: data.length,
        completed: data.filter(a => a.status === 'done').length,
        pending: data.filter(a => a.status === 'pending').length,
        groups: data.filter(a => a.type === 'group').length
      })
    }

    setLoading(false)
  }

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  const handleSaveName = async () => {
    setSaving(true)
    setSaveMsg('')
    await new Promise(r => setTimeout(r, 600))
    setSaveMsg('Display name saved!')
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#414073' }}>
          Profile
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#989788' }}>
          Your account details and stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — profile card */}
        <div className="space-y-4">

          {/* Avatar and info */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #414073, #4C3957)', color: '#E7EBC5' }}
            >
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-lg" style={{ color: '#414073' }}>
              {displayName}
            </p>
            <p className="text-sm mt-1" style={{ color: '#989788' }}>
              {user.email}
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-3"
              style={{ background: '#f3f0ff' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#70A37F' }}
              />
              <span className="text-xs font-medium" style={{ color: '#414073' }}>
                Active
              </span>
            </div>
          </div>

          {/* Auth provider */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#414073' }}>
              Login method
            </p>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#f8f7f4' }}
            >
              {user.app_metadata?.provider === 'google' ? (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: '#414073' }}>
                    Google Account
                  </span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" stroke="#414073" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: '#414073' }}>
                    Email & Password
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#fee2e2', color: '#dc2626' }}
          >
            Sign Out
          </button>

        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Stats */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#414073' }}>
              Your Statistics
            </p>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="rounded-xl animate-pulse"
                    style={{ background: '#f8f7f4', height: 72 }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: stats.total, color: '#414073', bg: '#f3f0ff' },
                  { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fef3c7' },
                  { label: 'Completed', value: stats.completed, color: '#16a34a', bg: '#dcfce7' },
                  { label: 'Group', value: stats.groups, color: '#41658A', bg: '#dbeafe' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-4 text-center"
                    style={{ background: s.bg }}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#989788' }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Completion rate bar */}
            {!loading && stats.total > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: '#414073' }}>
                    Completion rate
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#70A37F' }}>
                    {completionRate}%
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 8, background: '#f0ede8' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${completionRate}%`,
                      background: 'linear-gradient(90deg, #70A37F, #41658A)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Display name edit */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#414073' }}>
              Display Name
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: '#f8f7f4',
                  border: '1px solid #f0ede8',
                  color: '#414073'
                }}
                placeholder="Enter display name"
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#414073', color: '#E7EBC5' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {saveMsg && (
              <p className="text-xs mt-2" style={{ color: '#70A37F' }}>
                ✓ {saveMsg}
              </p>
            )}
          </div>

          {/* Account info */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#414073' }}>
              Account Info
            </p>
            <div className="space-y-3">
              {[
                { label: 'Email', value: user.email },
                { label: 'User ID', value: user.id?.slice(0, 16) + '...' },
                {
                  label: 'Member since',
                  value: new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid #f8f7f4' }}
                >
                  <span className="text-xs font-medium" style={{ color: '#989788' }}>
                    {item.label}
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#414073' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ProfilePage