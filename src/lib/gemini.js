import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

export const generateAssignmentPlan = async (extractedText, assignmentTitle) => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `
          You are an academic assistant helping a university student plan their assignment.
          
          Assignment Title: ${assignmentTitle}
          
          Assignment Guidelines:
          ${extractedText}
          
          Based on the above guidelines, create a clear, detailed, step-by-step action plan for the student to complete this assignment successfully.
          
          Format your response as a numbered list of steps. Each step should:
          - Be specific and actionable
          - Include a suggested time estimate
          - Be ordered logically from start to finish
          
          Keep it practical and student-friendly.
        `
      }
    ],
    max_tokens: 1024
  })

  return completion.choices[0].message.content
}