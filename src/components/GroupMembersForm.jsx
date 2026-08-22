import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateAssignmentPlan } from '../lib/gemini'

function GroupMembersForm({ user, assignment, onClose }) {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState({})
  const [generatingGuide, setGeneratingGuide] = useState(null)
  const [savedGuides, setSavedGuides] = useState({})

  useEffect(() => {
    fetchExistingMembers()
  }, [])

  const fetchExistingMembers = async () => {
    setFetching(true)

    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('*')
      .eq('assignment_id', assignment.id)

    const { data: taskData, error: taskError } = await supabase
      .from('group_tasks')
      .select('*')
      .eq('assignment_id', assignment.id)

    if (!memberError && memberData) {
      setMembers(memberData.map((m) => ({ email: m.email })))

      const existingTasks = {}
      const existingGuides = {}

      memberData.forEach((m) => {
        const task = taskData?.find((t) => t.member_email === m.email)
        existingTasks[m.email] = {
          description: task?.description || '',
          due_date: task?.due_date || ''
        }
        if (task?.ai_guide) {
          existingGuides[m.email] = task.ai_guide
        }
      })

      setTasks(existingTasks)
      setSavedGuides(existingGuides)
    }

    setFetching(false)
  }

  const handleAddMember = () => {
    if (!email) {
      setError('Please enter an email')
      return
    }
    if (members.find((m) => m.email === email)) {
      setError('Member already added')
      return
    }
    setMembers([...members, { email }])
    setTasks({ ...tasks, [email]: { description: '', due_date: '' } })
    setEmail('')
    setError('')
  }

  const handleRemoveMember = async (emailToRemove) => {
    await supabase
      .from('group_members')
      .delete()
      .eq('assignment_id', assignment.id)
      .eq('email', emailToRemove)

    await supabase
      .from('group_tasks')
      .delete()
      .eq('assignment_id', assignment.id)
      .eq('member_email', emailToRemove)

    setMembers(members.filter((m) => m.email !== emailToRemove))
    const updatedTasks = { ...tasks }
    delete updatedTasks[emailToRemove]
    setTasks(updatedTasks)
    const updatedGuides = { ...savedGuides }
    delete updatedGuides[emailToRemove]
    setSavedGuides(updatedGuides)
  }

  const handleTaskChange = (email, field, value) => {
    setTasks({
      ...tasks,
      [email]: { ...tasks[email], [field]: value }
    })
  }

  const handleGenerateMemberGuide = async (memberEmail) => {
    if (!tasks[memberEmail]?.description) {
      setError('Please add a task description first')
      return
    }

    setGeneratingGuide(memberEmail)
    setError('')

    try {
      const guide = await generateAssignmentPlan(
        `Assignment: ${assignment.title}\nMember task: ${tasks[memberEmail].description}`,
        assignment.title
      )
      setSavedGuides({ ...savedGuides, [memberEmail]: guide })
    } catch (error) {
      setError('Failed to generate guide')
    }

    setGeneratingGuide(null)
  }

  const handleSave = async () => {
    if (members.length === 0) {
      setError('Please add at least one member')
      return
    }

    setLoading(true)
    setError('')

    try {
      for (const member of members) {
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('assignment_id', assignment.id)
          .eq('email', member.email)
          .single()

        if (!existingMember) {
          await supabase
            .from('group_members')
            .insert([{
              assignment_id: assignment.id,
              email: member.email,
              role: 'member',
              status: 'pending'
            }])
        }

        if (tasks[member.email]?.description) {
          const { data: existingTask } = await supabase
            .from('group_tasks')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('member_email', member.email)
            .single()

          if (existingTask) {
            await supabase
              .from('group_tasks')
              .update({
                description: tasks[member.email].description,
                due_date: tasks[member.email].due_date || null,
                ai_guide: savedGuides[member.email] || null
              })
              .eq('assignment_id', assignment.id)
              .eq('member_email', member.email)
          } else {
            await supabase
              .from('group_tasks')
              .insert([{
                assignment_id: assignment.id,
                member_email: member.email,
                description: tasks[member.email].description,
                due_date: tasks[member.email].due_date || null,
                status: 'pending',
                ai_guide: savedGuides[member.email] || null
              }])
          }
        }
      }

      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg my-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Group Members</h2>
            <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        {fetching ? (
          <p className="text-center text-gray-400 py-8">Loading members...</p>
        ) : (
          <>
            {/* Add member input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add member by email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleAddMember}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Member list with tasks */}
            {members.length > 0 ? (
              <div className="space-y-4 mb-6">
                <p className="text-sm font-medium text-gray-700">
                  Members ({members.length})
                </p>
                {members.map((member) => (
                  <div
                    key={member.email}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-indigo-600">
                        {member.email}
                      </p>
                      <button
                        onClick={() => handleRemoveMember(member.email)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Task description
                      </label>
                      <textarea
                        placeholder="What is this member responsible for?"
                        value={tasks[member.email]?.description || ''}
                        onChange={(e) =>
                          handleTaskChange(member.email, 'description', e.target.value)
                        }
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Sub-deadline
                      </label>
                      <input
                        type="date"
                        value={tasks[member.email]?.due_date || ''}
                        onChange={(e) =>
                          handleTaskChange(member.email, 'due_date', e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <button
                      onClick={() => handleGenerateMemberGuide(member.email)}
                      disabled={generatingGuide === member.email}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium py-2 rounded-lg transition"
                    >
                      {generatingGuide === member.email
                        ? 'Generating...'
                        : '✨ Generate AI Guide for this member'}
                    </button>

                    {savedGuides[member.email] && (
                      <div className="mt-3 bg-white rounded-lg p-3 border border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-600 mb-1">
                          AI Guide generated ✓
                        </p>
                        <p className="text-xs text-gray-500">
                          {savedGuides[member.email].slice(0, 150)}...
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center mb-6">
                <p className="text-gray-400 text-sm">No members yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Add members using the field above
                </p>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
              >
                {loading ? 'Saving...' : 'Save Group'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default GroupMembersForm