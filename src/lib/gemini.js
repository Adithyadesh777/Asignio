const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api/generate-plan'
  : '/api/generate-plan'

export const generateAssignmentPlan = async (extractedText, assignmentTitle) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: extractedText,
      title: assignmentTitle
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate plan')
  }

  const data = await response.json()
  return data.plan
}