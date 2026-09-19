const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let tokenClient = null
let accessToken = null

export const initGoogleCalendar = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: (response) => {
          if (response.access_token) {
            accessToken = response.access_token
          }
        }
      })
      resolve()
    }
    document.head.appendChild(script)
  })
}

export const requestCalendarAccess = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Calendar not initialized'))
      return
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response)
        return
      }
      accessToken = response.access_token
      resolve(accessToken)
    }

    tokenClient.requestAccessToken({ prompt: '' })
  })
}

export const createCalendarEvent = async (assignment) => {
  if (!accessToken) {
    await requestCalendarAccess()
  }

  const event = {
    summary: `📚 ${assignment.title}`,
    description: assignment.ai_plan
      ? `AI Study Plan:\n\n${assignment.ai_plan}`
      : `Assignment due date for: ${assignment.title}`,
    start: {
      date: assignment.due_date,
      timeZone: 'Asia/Colombo'
    },
    end: {
      date: assignment.due_date,
      timeZone: 'Asia/Colombo'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 }
      ]
    }
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  )

  if (!response.ok) {
    accessToken = null
    throw new Error('Failed to create calendar event')
  }

  const data = await response.json()
  return data.id
}