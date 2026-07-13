import { useState } from 'react'
import { supabase } from '../lib/supabase'

function NewAssignmentForm({ user, onAssignmentAdded, onClose }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [type, setType] = useState('individual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title || !dueDate) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('assignments')
      .insert([{
        title,
        due_date: dueDate,
        type,
        status: 'pending',
        user_id: user.id
      }])
      .select()

    if (error) {
      setError(error.message)
    } else {
      onAssignmentAdded(data[0])
      onClose()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">New Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            placeholder="e.g. Software Engineering Report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="individual">Individual</option>
            <option value="group">Group</option>
          </select>
        </div>

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
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Saving...' : 'Save Assignment'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default NewAssignmentForm