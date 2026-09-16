import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function JoinGroup({ user }) {
  const { inviteCode } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAssignment()
  }, [])

  const fetchAssignment = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (error || !data) {
      setError('Invalid or expired invite link')
      setLoading(false)
      return
    }

    setAssignment(data)

    const { data: existingMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('assignment_id', data.id)
      .eq('email', user.email)
      .maybeSingle()

    if (existingMember) setJoined(true)

    setLoading(false)
  }

  const handleJoin = async () => {
    setJoining(true)
    setError('')

    const { error } = await supabase
      .from('group_members')
      .insert([{
        assignment_id: assignment.id,
        user_id: user.id,
        email: user.email,
        role: 'member',
        status: 'active'
      }])

    if (error) {
      setError('Failed to join. Please try again.')
    } else {
      setJoined(true)
    }

    setJoining(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-indigo-600 font-medium">Loading invite...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-700 mb-1">Asignio</h1>
          <p className="text-gray-500 text-sm">Group Assignment Invite</p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-6 mb-6">
          <p className="text-xs font-medium text-indigo-400 mb-1 uppercase tracking-wide">
            You're invited to join
          </p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {assignment.title}
          </h2>
          <p className="text-sm text-gray-500">
            Due: {assignment.due_date}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500">
            Joining as: <span className="font-medium text-gray-800">{user.email}</span>
          </p>
        </div>

        {joined ? (
          <div>
            <div className="bg-green-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-green-600 font-medium text-sm">
                ✓ You have joined this group
              </p>
              <p className="text-green-500 text-xs mt-1">
                The group owner will assign your task soon
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div>
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition mb-3"
            >
              {joining ? 'Joining...' : 'Join Group'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default JoinGroup