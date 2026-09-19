import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NewAssignmentForm from './NewAssignmentForm'
import EditAssignmentForm from './EditAssignmentForm'
import ManageGroup from './ManageGroup'
import MemberTaskView from './MemberTaskView'
import { generateAssignmentPlan } from '../lib/gemini'
import { extractTextFromPDF } from '../lib/pdfExtractor'
import { initGoogleCalendar, createCalendarEvent } from '../lib/calendar'

function Dashboard({ user }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [managingGroup, setManagingGroup] = useState(null)
  const [expandedPlans, setExpandedPlans] = useState(new Set())
  const [syncingCalendar, setSyncingCalendar] = useState(null)

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleAssignmentAdded = (newAssignment) => {
    setAssignments([...assignments, newAssignment])
  }

  const handleDeleteAssignment = async (id) => {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.log(error)
    } else {
      setAssignments(assignments.filter((a) => a.id !== id))
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'done' : 'pending'

    const { error } = await supabase
      .from('assignments')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.log(error)
    } else {
      setAssignments(assignments.map((a) =>
        a.id === id ? { ...a, status: newStatus } : a
      ))
    }
  }

  const handleGeneratePlan = async (assignment) => {
    if (!assignment.file_url) {
      alert('Please attach a guideline PDF first')
      return
    }

    setGeneratingPlan(assignment.id)

    try {
      const { data, error } = await supabase.storage
        .from('guidelines')
        .download(assignment.file_url)

      if (error) throw error

      const blob = await data
      const file = new File([blob], 'guideline.pdf', { type: 'application/pdf' })
      const text = await extractTextFromPDF(file)

      const plan = await generateAssignmentPlan(text, assignment.title)

      const { error: updateError } = await supabase
        .from('assignments')
        .update({ ai_plan: plan })
        .eq('id', assignment.id)

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
        .from('assignments')
        .update({ calendar_event_id: eventId })
        .eq('id', assignment.id)

      if (error) throw error

      setAssignments(assignments.map((a) =>
        a.id === assignment.id
          ? { ...a, calendar_event_id: eventId }
          : a
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
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-700">Asignio</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 hidden sm:block">{user.email}</p>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">My Assignments</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + New Assignment
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No assignments yet</p>
            <p className="text-gray-400 text-sm">
              Click "+ New Assignment" to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm p-6">

                {/* Title and status badge */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    assignment.status === 'done'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {assignment.status}
                  </span>
                </div>

                {/* Due date and type */}
                <p className="text-sm text-gray-500">Due: {assignment.due_date}</p>
                <p className="text-xs text-indigo-400 mt-1">{assignment.type}</p>

                {/* Invite link — owner only */}
                {assignment.type === 'group' &&
                  assignment.invite_code &&
                  assignment.user_id === user.id && (
                  <div className="mt-3 bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-indigo-600 mb-1">
                      Invite Link
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 font-mono flex-1 truncate">
                        {window.location.origin}/join/{assignment.invite_code}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/join/${assignment.invite_code}`
                          )
                          alert('Link copied!')
                        }}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded font-medium hover:bg-indigo-700 transition flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Member task view — joined members only */}
                {assignment.type === 'group' &&
                  assignment.user_id !== user.id && (
                  <MemberTaskView
                    assignmentId={assignment.id}
                    userEmail={user.email}
                  />
                )}

                {/* Generate AI Plan — owner only */}
                {assignment.file_url &&
                  assignment.user_id === user.id && (
                  <button
                    onClick={() => handleGeneratePlan(assignment)}
                    disabled={generatingPlan === assignment.id}
                    className="mt-3 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium py-2 rounded-lg transition"
                  >
                    {generatingPlan === assignment.id
                      ? 'Generating plan...'
                      : assignment.ai_plan
                        ? '✨ Regenerate AI Plan'
                        : '✨ Generate AI Plan'}
                  </button>
                )}

                {/* View AI Plan toggle */}
                {assignment.ai_plan && (
                  <button
                    onClick={() => togglePlan(assignment.id)}
                    className="mt-2 w-full border border-indigo-200 text-indigo-600 text-xs font-medium py-2 rounded-lg hover:bg-indigo-50 transition flex items-center justify-center gap-1"
                  >
                    {expandedPlans.has(assignment.id)
                      ? '▲ Hide AI Plan'
                      : '▼ View AI Plan'}
                  </button>
                )}

                {/* AI Plan content */}
                {assignment.ai_plan && expandedPlans.has(assignment.id) && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-indigo-600 mb-2">
                      AI Study Plan
                    </p>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {assignment.ai_plan}
                    </p>
                  </div>
                )}

                {/* Sync to Calendar — owner only */}
                {assignment.user_id === user.id && (
                  <button
                    onClick={() => handleSyncToCalendar(assignment)}
                    disabled={syncingCalendar === assignment.id}
                    className={`mt-2 w-full text-xs font-medium py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                      assignment.calendar_event_id
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {syncingCalendar === assignment.id
                      ? 'Syncing...'
                      : assignment.calendar_event_id
                        ? '✅ Synced to Calendar'
                        : '📅 Sync to Calendar'}
                  </button>
                )}

                {/* Action buttons */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                    className={`text-xs font-medium transition ${
                      assignment.status === 'done'
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-green-500 hover:text-green-600'
                    }`}
                  >
                    {assignment.status === 'done'
                      ? 'Mark as Pending'
                      : 'Mark as Done'}
                  </button>

                  <div className="flex gap-3">
                    {assignment.type === 'group' &&
                      assignment.user_id === user.id && (
                      <button
                        onClick={() => setManagingGroup(assignment)}
                        className="text-xs text-purple-400 hover:text-purple-600 font-medium transition"
                      >
                        Manage Group
                      </button>
                    )}
                    {assignment.user_id === user.id && (
                      <>
                        <button
                          onClick={() => setEditingAssignment(assignment)}
                          className="text-xs text-indigo-400 hover:text-indigo-600 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* New Assignment Form modal */}
      {showForm && (
        <NewAssignmentForm
          user={user}
          onAssignmentAdded={handleAssignmentAdded}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Assignment Form modal */}
      {editingAssignment && (
        <EditAssignmentForm
          user={user}
          assignment={editingAssignment}
          onAssignmentUpdated={handleAssignmentUpdated}
          onClose={() => setEditingAssignment(null)}
        />
      )}

      {/* Manage Group modal */}
      {managingGroup && (
        <ManageGroup
          assignment={managingGroup}
          onClose={() => setManagingGroup(null)}
        />
      )}

    </div>
  )
}

export default Dashboard