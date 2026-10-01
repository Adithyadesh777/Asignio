const Groq = require('groq-sdk')

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, title } = req.body

  if (!text || !title) {
    return res.status(400).json({ error: 'Missing text or title' })
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: `
            You are an academic assistant helping a university student plan their assignment.

            Assignment Title: ${title}

            Assignment Guidelines:
            ${text}

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

    const plan = completion.choices[0].message.content
    res.status(200).json({ plan })

  } catch (error) {
    console.error('Groq error:', error)
    res.status(500).json({ error: 'Failed to generate plan' })
  }
}