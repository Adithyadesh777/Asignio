import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NewAssignmentForm from './NewAssignmentForm'

function Dashboard({ user }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })

    if (error) console.log(error)
    else setAssignments(data)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }
  const handleAssignmentAdded = (newAssignment) => {
    setAssignments([...assignments, newAssignment])
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
  return (
    <div className="min-h-screen bg-gray-100">
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">My Assignments</h2>
          <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + New Assignment
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No assignments yet</p>
            <p className="text-gray-400 text-sm">Click "+ New Assignment" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm p-6">
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
                <p className="text-sm text-gray-500">Due: {assignment.due_date}</p>
                <p className="text-xs text-indigo-400 mt-1">{assignment.type}</p>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                    className={`text-xs font-medium transition ${
                      assignment.status === 'done'
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-green-500 hover:text-green-600'
                    }`}
                  >
                    {assignment.status === 'done' ? 'Mark as pending' : 'Mark as Done'}
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
  <NewAssignmentForm
    user={user}
    onAssignmentAdded={handleAssignmentAdded}
    onClose={() => setShowForm(false)}
  />
)}
    </div>
  )
}

export default Dashboard