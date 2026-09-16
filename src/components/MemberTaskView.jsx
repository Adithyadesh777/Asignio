import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function MemberTaskView({ assignmentId, userEmail }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTask()
  }, [])

  const fetchTask = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('group_tasks')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('member_email', userEmail)
      .maybeSingle()

    if (!error) setTask(data)
    setLoading(false)
  }

  if (loading) return (
    <p className="text-xs text-gray-400 mt-3">Loading your task...</p>
  )

  if (!task) return (
    <div className="mt-3 bg-yellow-50 rounded-lg p-3">
      <p className="text-xs text-yellow-600 font-medium">
        No task assigned yet
      </p>
      <p className="text-xs text-yellow-500 mt-1">
        The group owner will assign your task soon
      </p>
    </div>
  )

  return (
    <div className="mt-3 space-y-2">
      <div className="bg-purple-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-purple-600 mb-1">
          Your Task
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          {task.description}
        </p>
        {task.due_date && (
          <p className="text-xs text-gray-500 mt-1">
            Sub-deadline: {task.due_date}
          </p>
        )}
      </div>

      {task.ai_guide && (
        <div className="bg-indigo-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-indigo-600 mb-1">
            Your AI Guide
          </p>
          <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
            {task.ai_guide}
          </p>
        </div>
      )}
    </div>
  )
}

export default MemberTaskView