import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function CalendarPage({ user }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)

    const { data: ownedData } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)

    const { data: memberData } = await supabase
      .from('group_members')
      .select('assignment_id')
      .eq('email', user.email)

    let joinedAssignments = []
    if (memberData && memberData.length > 0) {
      const assignmentIds = memberData.map((m) => m.assignment_id)
      const { data: groupData } = await supabase
        .from('assignments')
        .select('*')
        .in('id', assignmentIds)
      if (groupData) joinedAssignments = groupData
    }

    const owned = ownedData || []
    const merged = [
      ...owned,
      ...joinedAssignments.filter(
        (ja) => !owned.find((oa) => oa.id === ja.id)
      )
    ]
    setAssignments(merged)
    setLoading(false)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getAssignmentsForDay = (day) => {
    return assignments.filter(a => {
      const d = new Date(a.due_date)
      return d.getFullYear() === year &&
             d.getMonth() === month &&
             d.getDate() === day
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day
  }

  const selectedAssignments = selectedDay
    ? getAssignmentsForDay(selectedDay)
    : []

  // Build calendar grid
  const calendarDays = []

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      assignments: []
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      currentMonth: true,
      assignments: getAssignmentsForDay(d)
    })
  }

  // Next month days to fill grid
  const remaining = 42 - calendarDays.length
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      currentMonth: false,
      assignments: []
    })
  }

  const getDotColor = (assignment) => {
    if (assignment.status === 'done') return '#70A37F'
    const diff = Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return '#ef4444'
    if (diff <= 2) return '#f97316'
    if (diff <= 5) return '#eab308'
    return '#41658A'
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#414073' }}>
            Calendar
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#989788' }}>
            {assignments.filter(a => a.status === 'pending').length} pending deadlines
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <svg width="16" height="16" fill="none" stroke="#414073" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="font-semibold text-sm min-w-32 text-center" style={{ color: '#414073' }}>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <svg width="16" height="16" fill="none" stroke="#414073" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar grid */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
        >
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <div
                key={d}
                className="text-center text-xs font-semibold py-2"
                style={{ color: '#989788' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl animate-pulse"
                  style={{ background: '#f8f7f4' }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => (
                <button
                  key={i}
                  onClick={() => cell.currentMonth && setSelectedDay(
                    selectedDay === cell.day ? null : cell.day
                  )}
                  className="relative flex flex-col items-center py-2 rounded-xl transition-all"
                  style={{
                    background: selectedDay === cell.day && cell.currentMonth
                      ? '#414073'
                      : isToday(cell.day) && cell.currentMonth
                        ? '#f3f0ff'
                        : 'transparent',
                    cursor: cell.currentMonth ? 'pointer' : 'default',
                    minHeight: 52
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: !cell.currentMonth
                        ? '#d1ccc8'
                        : selectedDay === cell.day
                          ? '#E7EBC5'
                          : isToday(cell.day)
                            ? '#414073'
                            : '#414073'
                    }}
                  >
                    {cell.day}
                  </span>

                  {/* Assignment dots */}
                  {cell.currentMonth && cell.assignments.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                      {cell.assignments.slice(0, 3).map((a, idx) => (
                        <div
                          key={idx}
                          className="rounded-full"
                          style={{
                            width: 5,
                            height: 5,
                            background: selectedDay === cell.day
                              ? '#E7EBC5'
                              : getDotColor(a)
                          }}
                        />
                      ))}
                      {cell.assignments.length > 3 && (
                        <span
                          className="text-xs leading-none"
                          style={{
                            color: selectedDay === cell.day ? '#E7EBC5' : '#989788',
                            fontSize: 9
                          }}
                        >
                          +{cell.assignments.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">

          {/* Legend */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#414073' }}>Legend</p>
            <div className="space-y-2">
              {[
                { color: '#70A37F', label: 'Completed' },
                { color: '#41658A', label: 'On track' },
                { color: '#eab308', label: 'Due soon (5 days)' },
                { color: '#f97316', label: 'Urgent (2 days)' },
                { color: '#ef4444', label: 'Overdue' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs" style={{ color: '#6F5060' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day assignments */}
          <div
            className="rounded-2xl p-4"
            style={{ background: '#ffffff', border: '1px solid #f0ede8' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#414073' }}>
              {selectedDay
                ? `${monthNames[month]} ${selectedDay}`
                : 'Select a day'}
            </p>

            {!selectedDay ? (
              <p className="text-xs text-center py-4" style={{ color: '#989788' }}>
                Click a day to see assignments
              </p>
            ) : selectedAssignments.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#989788' }}>
                No assignments due this day
              </p>
            ) : (
              <div className="space-y-2">
                {selectedAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl"
                    style={{ background: '#f8f7f4' }}
                  >
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: '#414073' }}
                    >
                      {a.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="text-xs capitalize"
                        style={{ color: '#989788' }}
                      >
                        {a.type}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: a.status === 'done' ? '#dcfce7' : '#fef3c7',
                          color: a.status === 'done' ? '#16a34a' : '#d97706'
                        }}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* This month summary */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, #414073, #4C3957)', border: '1px solid #f0ede8' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: '#E7EBC5' }}>
              {monthNames[month]} Summary
            </p>
            <div className="space-y-2">
              {[
                {
                  label: 'Total this month',
                  value: assignments.filter(a => {
                    const d = new Date(a.due_date)
                    return d.getMonth() === month && d.getFullYear() === year
                  }).length
                },
                {
                  label: 'Pending',
                  value: assignments.filter(a => {
                    const d = new Date(a.due_date)
                    return d.getMonth() === month && d.getFullYear() === year && a.status === 'pending'
                  }).length
                },
                {
                  label: 'Completed',
                  value: assignments.filter(a => {
                    const d = new Date(a.due_date)
                    return d.getMonth() === month && d.getFullYear() === year && a.status === 'done'
                  }).length
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#A78682' }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: '#E7EBC5' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CalendarPage