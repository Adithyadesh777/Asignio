import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md"
      style={{
        background: '#ffffff',
        border: '1px solid #f0ede8',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#414073' }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: '#989788' }}>{label}</p>
      </div>
    </div>
  )
}

const icons = {
  total: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"/>
    </svg>
  ),
  pending: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/>
    </svg>
  ),
  completed: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  group: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  )
}

function DashboardPage({ user }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)

    const { data: ownedData } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    const { data: memberData } = await supabase
      .from('group_members')
      .select('assignment_id')
      .eq('email', user.email)

    let joinedAssignments = []
    if (memberData && memberData.length > 0) {
      const assignmentIds = memberData.map((m) => m.assignment_id)
      const { data: groupData } = await supabase
        .from('assignments')
        .select('*')
        .in('id', assignmentIds)
      if (groupData) joinedAssignments = groupData
    }

    const owned = ownedData || []
    const merged = [
      ...owned,
      ...joinedAssignments.filter(
        (ja) => !owned.find((oa) => oa.id === ja.id)
      )
    ]
    merged.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    setAssignments(merged)
    setLoading(false)
  }

  const total = assignments.length
  const pending = assignments.filter(a => a.status === 'pending').length
  const done = assignments.filter(a => a.status === 'done').length
  const groups = assignments.filter(a => a.type === 'group').length
  const today = new Date()
  const upcoming = assignments.filter(a => a.status === 'pending').slice(0, 5)
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  const getDaysLeft = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)}d overdue`
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Tomorrow'
    return `${diff} days left`
  }

  const getDaysColor = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { color: '#dc2626', bg: '#fee2e2' }
    if (diff <= 2) return { color: '#ea580c', bg: '#ffedd5' }
    if (diff <= 5) return { color: '#ca8a04', bg: '#fef9c3' }
    return { color: '#16a34a', bg: '#dcfce7' }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-5 md:p-6 mb-6 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #414073 0%, #4C3957 100%)',
          boxShadow: '0 4px 20px rgba(65,64,115,0.2)'
        }}
      >
        <div>
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#E7EBC5' }}>
            Welcome back, {user.email?.split('@')[0]} 👋
          </h2>
          <p className="text-xs md:text-sm mt-1" style={{ color: '#A78682' }}>
            You have{' '}
            <span style={{ color: '#E7EBC5', fontWeight: 600 }}>{pending} pending</span>{' '}
            assignments to complete
          </p>
        </div>
        <div
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-col items-center justify-center flex-shrink-0 hidden sm:flex"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <p className="text-xl md:text-2xl font-bold" style={{ color: '#E7EBC5' }}>
            {completionRate}%
          </p>
          <p className="text-xs" style={{ color: '#A78682' }}>done</p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{ background: '#ffffff', height: 88 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard label="Total" value={total} color="#414073" bg="#eeedf8" icon={icons.total} />
          <StatCard label="Pending" value={pending} color="#d97706" bg="#fef3c7" icon={icons.pending} />
          <StatCard label="Completed" value={done} color="#16a34a" bg="#dcfce7" icon={icons.completed} />
          <StatCard label="Group Work" value={groups} color="#41658A" bg="#dbeafe" icon={icons.group} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Upcoming deadlines */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 md:p-6"
          style={{
            background: '#ffffff',
            border: '1px solid #f0ede8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h3 className="font-semibold text-sm md:text-base" style={{ color: '#414073' }}>
                Upcoming Deadlines
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#989788' }}>
                {upcoming.length} pending assignments
              </p>
            </div>
            <button
              onClick={() => navigate('/assignments')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: '#f3f0ff', color: '#414073' }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#f8f7f4' }} />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: '#dcfce7' }}
              >
                <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="font-semibold text-sm" style={{ color: '#414073' }}>All caught up!</p>
              <p className="text-xs mt-1" style={{ color: '#989788' }}>No pending assignments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => {
                const dayStyle = getDaysColor(a.due_date)
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-xl"
                    style={{
                      background: '#f8f7f4',
                      borderLeft: `3px solid ${dayStyle.color}`
                    }}
                  >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: a.type === 'group' ? '#dbeafe' : '#f3f0ff' }}
                      >
                        <svg width="13" height="13" fill="none" stroke={a.type === 'group' ? '#41658A' : '#414073'} strokeWidth="2" viewBox="0 0 24 24">
                          {a.type === 'group'
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          }
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-semibold truncate" style={{ color: '#414073' }}>
                          {a.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#989788' }}>
                          {new Date(a.due_date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full ml-2 flex-shrink-0"
                      style={{ color: dayStyle.color, background: dayStyle.bg }}
                    >
                      {getDaysLeft(a.due_date)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Progress ring */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: '#ffffff',
              border: '1px solid #f0ede8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#414073' }}>Progress</p>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0ede8" strokeWidth="3"/>
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#70A37F"
                    strokeWidth="3"
                    strokeDasharray={`${completionRate} ${100 - completionRate}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: '#414073' }}>
                    {completionRate}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#70A37F' }}/>
                  <span className="text-xs" style={{ color: '#989788' }}>{done} completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f0ede8' }}/>
                  <span className="text-xs" style={{ color: '#989788' }}>{pending} remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: '#ffffff',
              border: '1px solid #f0ede8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: '#414073' }}>Quick Actions</p>
            <div className="space-y-2">
              {[
                {
                  label: 'New Assignment',
                  desc: 'Create and plan a task',
                  path: '/assignments',
                  bg: 'linear-gradient(135deg, #414073, #4C3957)',
                  icon: (
                    <svg width="18" height="18" fill="none" stroke="#E7EBC5" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                  )
                },
                {
                  label: 'Group Work',
                  desc: 'Collaborate with team',
                  path: '/groups',
                  bg: 'linear-gradient(135deg, #41658A, #414073)',
                  icon: (
                    <svg width="18" height="18" fill="none" stroke="#E7EBC5" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  )
                },
                {
                  label: 'View Calendar',
                  desc: 'See all deadlines',
                  path: '/calendar',
                  bg: 'linear-gradient(135deg, #70A37F, #41658A)',
                  icon: (
                    <svg width="18" height="18" fill="none" stroke="#E7EBC5" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  )
                }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: item.bg }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: '#E7EBC5' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(231,235,197,0.7)' }}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default DashboardPage