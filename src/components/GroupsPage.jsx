import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ManageGroup from './ManageGroup'
import NewAssignmentForm from './NewAssignmentForm'

function GroupsPage({ user }) {
  const [groups, setGroups] = useState([])
  const [memberCounts, setMemberCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [managingGroup, setManagingGroup] = useState(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)

    const { data: ownedData } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'group')
      .order('due_date', { ascending: true })

    const { data: memberData } = await supabase
      .from('group_members')
      .select('assignment_id')
      .eq('email', user.email)

    let joinedGroups = []
    if (memberData && memberData.length > 0) {
      const assignmentIds = memberData.map((m) => m.assignment_id)
      const { data: groupData } = await supabase
        .from('assignments')
        .select('*')
        .in('id', assignmentIds)
        .eq('type', 'group')
      if (groupData) joinedGroups = groupData
    }

    const owned = ownedData || []
    const merged = [
      ...owned,
      ...joinedGroups.filter(
        (ja) => !owned.find((oa) => oa.id === ja.id)
      )
    ]

    setGroups(merged)

    // Fetch member counts for each group
    const counts = {}
    for (const group of merged) {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', group.id)
      counts[group.id] = count || 0
    }
    setMemberCounts(counts)
    setLoading(false)
  }

  const getDaysLeft = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Overdue'
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    return `${diff} days left`
  }

  const getDaysColor = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return '#ef4444'
    if (diff <= 2) return '#f97316'
    if (diff <= 5) return '#eab308'
    return '#70A37F'
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#414073' }}>
            Group Assignments
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#989788' }}>
            {groups.length} group{groups.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #414073, #4C3957)', color: '#E7EBC5' }}
        >
          <span>+</span>
          <span>New Group</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className="rounded-2xl p-6 animate-pulse"
              style={{ background: '#ffffff', height: 180 }}
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
        >
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold" style={{ color: '#414073' }}>
            No group assignments yet
          </p>
          <p className="text-sm mt-1 mb-6" style={{ color: '#989788' }}>
            Create a group assignment and invite your team
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#414073', color: '#E7EBC5' }}
          >
            + New Group Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl p-6"
              style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-base truncate"
                    style={{ color: '#414073' }}
                  >
                    {group.title}
                  </h3>
                  <span
                    className="text-xs font-medium mt-1 inline-block"
                    style={{ color: getDaysColor(group.due_date) }}
                  >
                    {getDaysLeft(group.due_date)}
                  </span>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full ml-3 flex-shrink-0"
                  style={{
                    background: group.status === 'done' ? '#dcfce7' : '#fef3c7',
                    color: group.status === 'done' ? '#16a34a' : '#d97706'
                  }}
                >
                  {group.status}
                </span>
              </div>

              {/* Stats row */}
              <div
                className="flex items-center gap-4 py-3 px-4 rounded-xl mb-4"
                style={{ background: '#f8f7f4' }}
              >
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#414073' }}>
                    {memberCounts[group.id] || 0}
                  </p>
                  <p className="text-xs" style={{ color: '#989788' }}>Members</p>
                </div>
                <div style={{ width: 1, height: 32, background: '#f0ede8' }} />
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#414073' }}>
                    {new Date(group.due_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs" style={{ color: '#989788' }}>Due date</p>
                </div>
                <div style={{ width: 1, height: 32, background: '#f0ede8' }} />
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#414073' }}>
                    {group.user_id === user.id ? '👑' : '👤'}
                  </p>
                  <p className="text-xs" style={{ color: '#989788' }}>
                    {group.user_id === user.id ? 'Owner' : 'Member'}
                  </p>
                </div>
              </div>

              {/* Invite link — owner only */}
              {group.invite_code && group.user_id === user.id && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
                  style={{ background: '#f3f0ff' }}
                >
                  <svg width="14" height="14" fill="none" stroke="#414073" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  <p className="text-xs font-mono flex-1 truncate" style={{ color: '#414073' }}>
                    {window.location.origin}/join/{group.invite_code}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/join/${group.invite_code}`
                      )
                      alert('Link copied!')
                    }}
                    className="text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: '#414073', color: '#E7EBC5' }}
                  >
                    Copy
                  </button>
                </div>
              )}

              {/* Action buttons */}
              {group.user_id === user.id && (
                <button
                  onClick={() => setManagingGroup(group)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #41658A, #414073)', color: '#E7EBC5' }}
                >
                  👥 Manage Group Members
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <NewAssignmentForm
          user={user}
          onAssignmentAdded={(a) => {
            if (a.type === 'group') setGroups([...groups, a])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
          defaultType="group"
        />
      )}

      {managingGroup && (
        <ManageGroup
          assignment={managingGroup}
          onClose={() => {
            setManagingGroup(null)
            fetchGroups()
          }}
        />
      )}

    </div>
  )
}

export default GroupsPage