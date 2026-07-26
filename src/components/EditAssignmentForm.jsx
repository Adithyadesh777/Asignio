import { useState } from 'react'
import { supabase } from '../lib/supabase'

function EditAssignmentForm({ user, assignment, onAssignmentUpdated, onClose }) {
  const [title, setTitle] = useState(assignment.title)
  const [dueDate, setDueDate] = useState(assignment.due_date)
  const [type, setType] = useState(assignment.type)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setError('')
    } else {
      setError('Please upload a PDF file only')
      setFile(null)
    }
  }

  const uploadNewFile = async () => {
    if (!file) return assignment.file_url

    if (assignment.file_url) {
      await supabase.storage
        .from('guidelines')
        .remove([assignment.file_url])
    }

    const filePath = `${user.id}/${Date.now()}_${file.name}`

    const { error } = await supabase.storage
      .from('guidelines')
      .upload(filePath, file)

    if (error) {
      setError(error.message)
      return null
    }

    return filePath
  }

  const handleSubmit = async () => {
    if (!title || !dueDate) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    const fileUrl = await uploadNewFile()
    if (fileUrl === null && file) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('assignments')
      .update({
        title,
        due_date: dueDate,
        type,
        file_url: fileUrl
      })
      .eq('id', assignment.id)
      .select()

    if (error) {
      setError(error.message)
    } else {
      onAssignmentUpdated(data[0])
      onClose()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Edit Assignment</h2>
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

        <div className="mb-4">
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

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Replace Guideline PDF <span className="text-gray-400">(optional)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center hover:border-indigo-400 transition">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="edit-file-upload"
            />
            <label htmlFor="edit-file-upload" className="cursor-pointer">
              {file ? (
                <div>
                  <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Click to change file</p>
                </div>
              ) : assignment.file_url ? (
                <div>
                  <p className="text-sm text-green-600 font-medium">✓ PDF already attached</p>
                  <p className="text-xs text-gray-400 mt-1">Click to replace with a new PDF</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">Click to upload PDF</p>
                  <p className="text-xs text-gray-400 mt-1">PDF files only</p>
                </div>
              )}
            </label>
          </div>
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default EditAssignmentForm