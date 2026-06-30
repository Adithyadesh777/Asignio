function AssignmentCard(props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 m-2 sm:m-4 w-full max-w-sm">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800">{props.title}</h2>
      <p className="text-gray-500 mt-2">Due: {props.dueDate}</p>
    </div>
  )
}

export default AssignmentCard