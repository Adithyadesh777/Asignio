import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NewAssignmentForm from './NewAssignmentForm'
import EditAssignmentForm from './EditAssignmentForm'
import ManageGroup from './ManageGroup'
import MemberTaskView from './MemberTaskView'
import { generateAssignmentPlan } from '../lib/gemini'
import { extractTextFromPDF } from '../lib/pdfExtractor'
import { initGoogleCalendar, createCalendarEvent } from '../lib/calendar'

function StatusBadge({ status }) {
  const styles = {
    pending: { background: '#fef3c7', color: '#d97706' },
    done: { background: '#dcfce7', color: '#16a34a' },
  }
  const s = styles[status] || styles.pending
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={s}>
      {status}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
      style={{
        background: type === 'group' ? '#dbeafe' : '#f3f0ff',
        color: type === 'group' ? '#41658A' : '#414073'
      }}
    >
      {type === 'group' ? '👥 Group' : '👤 Individual'}
    </span>
  )
}

function AssignmentsPage({ user }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [managingGroup, setManagingGroup] = useState(null)
  const [expandedPlans, setExpandedPlans] = useState(new Set())
  const [syncingCalendar, setSyncingCalendar] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAssignments()
    initGoogleCalendar()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)

    const { data: ownedData, error: ownedError } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('assignment_id')
      .eq('email', user.email)

    if (ownedError) console.log(ownedError)
    if (memberError) console.log(memberError)

    let joinedAssignments = []
    if (memberData && memberData.length > 0) {
      const assignmentIds = memberData.map((m) => m.assignment_id)
      const { data: groupData } = await supabase
        .from('assignments')
        .select('*')
        .in('id', assignmentIds)
        .order('due_date', { ascending: true })
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

  const handleDeleteAssignment = async (id) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) console.log(error)
    else setAssignments(assignments.filter((a) => a.id !== id))
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'done' : 'pending'
    const { error } = await supabase
      .from('assignments').update({ status: newStatus }).eq('id', id)
    if (error) console.log(error)
    else setAssignments(assignments.map((a) =>
      a.id === id ? { ...a, status: newStatus } : a
    ))
  }

  const handleGeneratePlan = async (assignment) => {
    if (!assignment.file_url) {
      alert('Please attach a guideline PDF first')
      return
    }
    setGeneratingPlan(assignment.id)
    try {
      const { data, error } = await supabase.storage
        .from('guidelines').download(assignment.file_url)
      if (error) throw error
      const blob = await data
      const file = new File([blob], 'guideline.pdf', { type: 'application/pdf' })
      const text = await extractTextFromPDF(file)
      const plan = await generateAssignmentPlan(text, assignment.title)
      const { error: updateError } = await supabase
        .from('assignments').update({ ai_plan: plan }).eq('id', assignment.id)
      if (updateError) throw updateError
      setAssignments(assignments.map((a) =>
        a.id === assignment.id ? { ...a, ai_plan: plan } : a
      ))
      setExpandedPlans((prev) => new Set(prev).add(assignment.id))
    } catch (error) {
      console.log(error)
      alert('Failed to generate plan. Please try again.')
    }
    setGeneratingPlan(null)
  }

  const handleAssignmentUpdated = (updatedAssignment) => {
    setAssignments(assignments.map((a) =>
      a.id === updatedAssignment.id ? updatedAssignment : a
    ))
  }

  const handleSyncToCalendar = async (assignment) => {
    setSyncingCalendar(assignment.id)
    try {
      const eventId = await createCalendarEvent(assignment)
      const { error } = await supabase
        .from('assignments').update({ calendar_event_id: eventId }).eq('id', assignment.id)
      if (error) throw error
      setAssignments(assignments.map((a) =>
        a.id === assignment.id ? { ...a, calendar_event_id: eventId } : a
      ))
      alert('✅ Added to Google Calendar!')
    } catch (error) {
      console.log(error)
      alert('Failed to sync. Please try again.')
    }
    setSyncingCalendar(null)
  }

  const togglePlan = (id) => {
    setExpandedPlans((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getDaysLeft = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Overdue'
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Tomorrow'
    return `${diff} days left`
  }

  const getDaysColor = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return '#dc2626'
    if (diff <= 2) return '#ea580c'
    if (diff <= 5) return '#ca8a04'
    return '#16a34a'
  }

  const filteredAssignments = assignments
    .filter(a => {
      if (filter === 'pending') return a.status === 'pending'
      if (filter === 'done') return a.status === 'done'
      if (filter === 'group') return a.type === 'group'
      if (filter === 'individual') return a.type === 'individual'
      return true
    })
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#414073' }}>
            My Assignments
          </h2>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: '#989788' }}>
            {assignments.length} total · {assignments.filter(a => a.status === 'pending').length} pending
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #414073, #4C3957)', color: '#E7EBC5' }}
        >
          <span>+</span>
          <span className="hidden sm:inline">New Assignment</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#989788' }}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: '#ffffff',
              border: '1px solid #f0ede8',
              color: '#414073'
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'done', 'group', 'individual'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? '#414073' : '#ffffff',
                color: filter === f ? '#E7EBC5' : '#989788',
                border: `1px solid ${filter === f ? '#414073' : '#f0ede8'}`
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{ background: '#ffffff', height: 100 }}
            />
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div
          className="rounded-2xl p-12 md:p-16 text-center"
          style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-sm" style={{ color: '#414073' }}>No assignments found</p>
          <p className="text-xs mt-1" style={{ color: '#989788' }}>
            {search ? 'Try a different search term' : 'Click "+ New Assignment" to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl p-4 md:p-6 transition-all"
              style={{
                background: '#ffffff',
                border: '1px solid #f0ede8',
                borderLeft: `3px solid ${getDaysColor(assignment.due_date)}`
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base truncate" style={{ color: '#414073' }}>
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <TypeBadge type={assignment.type} />
                    <StatusBadge status={assignment.status} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: getDaysColor(assignment.due_date) }}
                    >
                      {getDaysLeft(assignment.due_date)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: '#989788' }}>Due</p>
                  <p className="text-xs md:text-sm font-semibold mt-0.5" style={{ color: '#414073' }}>
                    {new Date(assignment.due_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Invite link */}
              {assignment.type === 'group' &&
                assignment.invite_code &&
                assignment.user_id === user.id && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                  style={{ background: '#f3f0ff' }}
                >
                  <svg width="12" height="12" fill="none" stroke="#414073" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  <p className="text-xs font-mono flex-1 truncate" style={{ color: '#414073' }}>
                    {window.location.origin}/join/{assignment.invite_code}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/join/${assignment.invite_code}`
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

              {/* Member task */}
              {assignment.type === 'group' && assignment.user_id !== user.id && (
                <MemberTaskView assignmentId={assignment.id} userEmail={user.email} />
              )}

              {/* Action buttons */}
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3"
                style={{ borderTop: '1px solid #f8f7f4' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {assignment.file_url && assignment.user_id === user.id && (
                    <button
                      onClick={() => handleGeneratePlan(assignment)}
                      disabled={generatingPlan === assignment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{ background: '#f3f0ff', color: '#414073' }}
                    >
                      <span>✨</span>
                      <span>
                        {generatingPlan === assignment.id
                          ? 'Generating...'
                          : assignment.ai_plan ? 'Regenerate' : 'AI Plan'}
                      </span>
                    </button>
                  )}

                  {assignment.ai_plan && (
                    <button
                      onClick={() => togglePlan(assignment.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{
                        background: expandedPlans.has(assignment.id) ? '#414073' : '#f8f7f4',
                        color: expandedPlans.has(assignment.id) ? '#E7EBC5' : '#414073'
                      }}
                    >
                      <span>{expandedPlans.has(assignment.id) ? '▲' : '▼'}</span>
                      <span>{expandedPlans.has(assignment.id) ? 'Hide' : 'View Plan'}</span>
                    </button>
                  )}

                  {assignment.user_id === user.id && (
                    <button
                      onClick={() => handleSyncToCalendar(assignment)}
                      disabled={syncingCalendar === assignment.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{
                        background: assignment.calendar_event_id ? '#dcfce7' : '#f8f7f4',
                        color: assignment.calendar_event_id ? '#16a34a' : '#414073'
                      }}
                    >
                      <span>{assignment.calendar_event_id ? '✅' : '📅'}</span>
                      <span>
                        {syncingCalendar === assignment.id
                          ? 'Syncing...'
                          : assignment.calendar_event_id ? 'Synced' : 'Calendar'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: assignment.status === 'done' ? '#fef3c7' : '#dcfce7',
                      color: assignment.status === 'done' ? '#d97706' : '#16a34a'
                    }}
                  >
                    {assignment.status === 'done' ? '↩ Reopen' : '✓ Done'}
                  </button>

                  {assignment.type === 'group' && assignment.user_id === user.id && (
                    <button
                      onClick={() => setManagingGroup(assignment)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95"
                      style={{ background: '#dbeafe', color: '#41658A' }}
                    >
                      👥 Manage
                    </button>
                  )}

                  {assignment.user_id === user.id && (
                    <>
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95"
                        style={{ background: '#f3f0ff', color: '#414073' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95"
                        style={{ background: '#fee2e2', color: '#dc2626' }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Plan */}
              {assignment.ai_plan && expandedPlans.has(assignment.id) && (
                <div
                  className="mt-3 p-4 rounded-xl"
                  style={{ background: '#f8f7f4', border: '1px solid #f0ede8' }}
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: '#414073' }}>
                    ✨ AI Study Plan
                  </p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: '#6F5060' }}>
                    {assignment.ai_plan}
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <NewAssignmentForm
          user={user}
          onAssignmentAdded={(a) => setAssignments([...assignments, a])}
          onClose={() => setShowForm(false)}
        />
      )}
      {editingAssignment && (
        <EditAssignmentForm
          user={user}
          assignment={editingAssignment}
          onAssignmentUpdated={handleAssignmentUpdated}
          onClose={() => setEditingAssignment(null)}
        />
      )}
      {managingGroup && (
        <ManageGroup
          assignment={managingGroup}
          onClose={() => setManagingGroup(null)}
        />
      )}

    </div>
  )
}

export default AssignmentsPage