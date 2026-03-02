import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfWeek, addDays, isSameMonth, isSameDay, getDay, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  availableDates?: Date[]
  className?: string
}

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  availableDates = [],
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 0 })
  const days = []
  let currentDate = calendarStart
  while (currentDate < calendarEnd) {
    days.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }

  const isDateAvailable = (date: Date) => {
    return availableDates.some((d) => isSameDay(d, date))
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      return next
    })
  }

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const prevDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      return prevDate
    })
  }

  return (
    <div className={cn("rounded-md border p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-accent rounded-md"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-accent rounded-md"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selected && isSameDay(day, selected)
          const isAvailable = isDateAvailable(day)

          return (
            <button
              key={idx}
              onClick={() => {
                if (isCurrentMonth && isAvailable && onSelect) {
                  onSelect(day)
                }
              }}
              className={cn(
                "aspect-square p-2 text-sm rounded-md transition-colors",
                {
                  "text-muted-foreground": !isCurrentMonth,
                  "bg-primary text-primary-foreground": isSelected,
                  "hover:bg-accent": isCurrentMonth && isAvailable && !isSelected,
                  "cursor-not-allowed opacity-50": !isAvailable,
                }
              )}
              disabled={!isAvailable || !isCurrentMonth}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
