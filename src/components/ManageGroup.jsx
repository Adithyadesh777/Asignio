import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateAssignmentPlan } from '../lib/gemini'

function ManageGroup({ assignment, onClose }) {
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingGuide, setGeneratingGuide] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)

    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('*')
      .eq('assignment_id', assignment.id)

    if (memberError) {
      setError('Failed to load members')
      setLoading(false)
      return
    }

    const { data: taskData } = await supabase
      .from('group_tasks')
      .select('*')
      .eq('assignment_id', assignment.id)

    setMembers(memberData || [])

    const existingTasks = {}
    memberData?.forEach((m) => {
      const task = taskData?.find((t) => t.member_email === m.email)
      existingTasks[m.email] = {
        description: task?.description || '',
        due_date: task?.due_date || '',
        ai_guide: task?.ai_guide || '',
        task_id: task?.id || null
      }
    })

    setTasks(existingTasks)
    setLoading(false)
  }

  const handleTaskChange = (email, field, value) => {
    setTasks({
      ...tasks,
      [email]: { ...tasks[email], [field]: value }
    })
  }

  const handleGenerateGuide = async (memberEmail) => {
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
      setTasks({
        ...tasks,
        [memberEmail]: { ...tasks[memberEmail], ai_guide: guide }
      })
    } catch (err) {
      setError('Failed to generate guide. Please try again.')
    }

    setGeneratingGuide(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      for (const email of Object.keys(tasks)) {
        const task = tasks[email]
        if (!task.description) continue

        if (task.task_id) {
          await supabase
            .from('group_tasks')
            .update({
              description: task.description,
              due_date: task.due_date || null,
              ai_guide: task.ai_guide || null
            })
            .eq('id', task.task_id)
        } else {
          const { data } = await supabase
            .from('group_tasks')
            .insert([{
              assignment_id: assignment.id,
              member_email: email,
              description: task.description,
              due_date: task.due_date || null,
              status: 'pending',
              ai_guide: task.ai_guide || null
            }])
            .select()
            .single()

          if (data) {
            setTasks((prev) => ({
              ...prev,
              [email]: { ...prev[email], task_id: data.id }
            }))
          }
        }
      }
      setSuccess('Tasks saved successfully!')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }

    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg my-8">

        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manage Group</h2>
            <p className="text-sm text-gray-500 mt-1">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-12">Loading members...</p>
        ) : members.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center my-6">
            <p className="text-gray-400 font-medium mb-1">No members yet</p>
            <p className="text-gray-400 text-sm">
              Share the invite link on the assignment card so members can join
            </p>
          </div>
        ) : (
          <div className="space-y-4 my-6">
            <p className="text-sm font-medium text-gray-700">
              {members.length} member{members.length > 1 ? 's' : ''} joined
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
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    Joined
                  </span>
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
                  onClick={() => handleGenerateGuide(member.email)}
                  disabled={generatingGuide === member.email}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium py-2 rounded-lg transition mb-2"
                >
                  {generatingGuide === member.email
                    ? 'Generating...'
                    : '✨ Generate AI Guide for this member'}
                </button>

                {tasks[member.email]?.ai_guide && (
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600 mb-1">
                      AI Guide ✓
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {tasks[member.email].ai_guide.slice(0, 200)}...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        {success && (
          <p className="text-green-500 text-sm mb-4 text-center">{success}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
          {members.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Tasks'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default ManageGroup