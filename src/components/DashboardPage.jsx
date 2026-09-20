import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div
      className="rounded-2xl p-6 flex items-center gap-4"
      style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <span style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#414073' }}>{value}</p>
        <p className="text-sm" style={{ color: '#989788' }}>{label}</p>
      </div>
    </div>
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
  const upcoming = assignments
    .filter(a => a.status === 'pending' && new Date(a.due_date) >= today)
    .slice(0, 5)

  const getDaysLeft = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - today) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    if (diff < 0) return 'Overdue'
    return `${diff} days left`
  }

  const getDaysColor = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return '#ef4444'
    if (diff <= 2) return '#f97316'
    if (diff <= 5) return '#eab308'
    return '#70A37F'
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: '#414073' }}>
          Welcome back, {user.email?.split('@')[0]} 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: '#989788' }}>
          Here's what's happening with your assignments today.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: '#ffffff', height: 96 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Assignments" value={total} color="#414073" bg="#eeedf8" icon="📋" />
          <StatCard label="Pending" value={pending} color="#d97706" bg="#fef3c7" icon="⏳" />
          <StatCard label="Completed" value={done} color="#70A37F" bg="#dcfce7" icon="✅" />
          <StatCard label="Group Work" value={groups} color="#41658A" bg="#dbeafe" icon="👥" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming deadlines */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-base" style={{ color: '#414073' }}>
              Upcoming Deadlines
            </h3>
            <button
              onClick={() => navigate('/assignments')}
              className="text-xs font-medium hover:underline"
              style={{ color: '#41658A' }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#f8f7f4' }} />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm font-medium" style={{ color: '#414073' }}>All caught up!</p>
              <p className="text-xs mt-1" style={{ color: '#989788' }}>No pending assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: '#f8f7f4' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#414073' }}>
                      {a.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#989788' }}>
                      {new Date(a.due_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full ml-3 flex-shrink-0"
                    style={{
                      color: getDaysColor(a.due_date),
                      background: `${getDaysColor(a.due_date)}18`
                    }}
                  >
                    {getDaysLeft(a.due_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
        >
          <h3 className="font-semibold text-base mb-5" style={{ color: '#414073' }}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/assignments')}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #414073, #4C3957)', color: '#E7EBC5' }}
            >
              <span className="text-2xl">📝</span>
              <div className="text-left">
                <p className="text-sm font-semibold">New Assignment</p>
                <p className="text-xs opacity-70">Create and plan a new task</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #41658A, #414073)', color: '#E7EBC5' }}
            >
              <span className="text-2xl">👥</span>
              <div className="text-left">
                <p className="text-sm font-semibold">Group Assignment</p>
                <p className="text-xs opacity-70">Collaborate with your team</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #70A37F, #41658A)', color: '#E7EBC5' }}
            >
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <p className="text-sm font-semibold">View Calendar</p>
                <p className="text-xs opacity-70">See all your deadlines</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardPage