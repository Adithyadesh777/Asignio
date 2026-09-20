import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    )
  },
  {
    id: 'assignments',
    label: 'Assignments',
    path: '/assignments',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4"/>
      </svg>
    )
  },
  {
    id: 'groups',
    label: 'Groups',
    path: '/groups',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    )
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    )
  }
]

function Layout({ user, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="flex h-screen bg-gray-50 overflow-hidden">

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── SIDEBAR ── */}
      <aside
        className="flex flex-col transition-all duration-300 ease-in-out flex-shrink-0"
        style={{
          width: collapsed ? '72px' : '240px',
          background: 'linear-gradient(180deg, #414073 0%, #4C3957 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Logo area */}
        <div className="flex items-center px-4 py-5 border-b border-white border-opacity-10">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: '#41658A' }}
          >
            <span style={{ color: '#E7EBC5', fontSize: 16, fontWeight: 700 }}>A</span>
          </div>
          {!collapsed && (
            <span
              className="ml-3 font-semibold tracking-tight truncate"
              style={{ color: '#E7EBC5', fontSize: 17 }}
            >
              Asignio
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white hover:bg-opacity-10"
            style={{ color: '#D4C5C0' }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              }
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center rounded-xl transition-all duration-150"
                style={{
                  padding: collapsed ? '10px 12px' : '10px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive
                    ? 'rgba(65, 101, 138, 0.5)'
                    : 'transparent',
                  color: isActive ? '#E7EBC5' : '#D4C5C0',
                  border: isActive
                    ? '1px solid rgba(65,101,138,0.4)'
                    : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#E7EBC5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#D4C5C0'
                  }
                }}
                title={collapsed ? item.label : ''}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User info + sign out */}
        <div className="px-3 py-4 border-t border-white border-opacity-10">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                style={{ background: '#41658A', color: '#E7EBC5' }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#E7EBC5' }}>
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs truncate" style={{ color: '#D4C5C0' }}>
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center rounded-xl transition-all duration-150 text-sm font-medium"
            style={{
              padding: collapsed ? '10px 12px' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: '#D4C5C0',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231,67,67,0.15)'
              e.currentTarget.style.color = '#f87171'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#D4C5C0'
            }}
            title={collapsed ? 'Sign Out' : ''}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top header bar */}
        <header
          className="flex items-center justify-between px-8 py-4 flex-shrink-0"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #f0ede8'
          }}
        >
          <div>
            <h1 className="font-semibold text-lg" style={{ color: '#414073' }}>
              {NAV_ITEMS.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#989788' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: '#414073', color: '#E7EBC5' }}
            >
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ background: '#f8f7f4' }}>
          {children}
        </div>

      </main>

    </div>
  )
}

export default Layout