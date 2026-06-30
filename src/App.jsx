import AssignmentCard from './components/AssignmentCard'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-6 text-center">Asignio</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <AssignmentCard title="Software Engineering Report" dueDate="15th July 2026" />
        <AssignmentCard title="Database Design Assignment" dueDate="22nd July 2026" />
      </div>
    </div>
  )
}

export default App 