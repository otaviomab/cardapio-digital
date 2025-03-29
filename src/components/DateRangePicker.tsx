'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onChange: (startDate: Date, endDate: Date) => void
  onPreviousPeriod: () => void
  onNextPeriod: () => void
  isNextDisabled?: boolean
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  onPreviousPeriod,
  onNextPeriod,
  isNextDisabled = false
}: DateRangePickerProps) {
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const [localStartDate, setLocalStartDate] = useState<Date>(startDate)
  const [localEndDate, setLocalEndDate] = useState<Date>(endDate)

  // Reset local state when props change
  useEffect(() => {
    setLocalStartDate(startDate)
    setLocalEndDate(endDate)
  }, [startDate, endDate])

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setLocalStartDate(date)
      // Se a data de início for posterior à data de término, ajuste a data de término
      if (date > localEndDate) {
        setLocalEndDate(date)
      }
      onChange(date, date > localEndDate ? date : localEndDate)
      setIsStartDateOpen(false)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      // Se a data de término for anterior à data de início, não permita a seleção
      if (date < localStartDate) {
        return
      }
      
      setLocalEndDate(date)
      onChange(localStartDate, date)
      setIsEndDateOpen(false)
    }
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-2 sm:w-auto">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPreviousPeriod}
        className="rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-1 text-sm text-gray-900 sm:gap-2">
        <Calendar className="hidden h-4 w-4 sm:block" />
        
        <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-0 p-1 font-normal shadow-none hover:bg-gray-100 hover:text-gray-700 sm:p-2"
            >
              {format(localStartDate, "dd 'de' MMM", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={localStartDate}
              onSelect={handleStartDateSelect}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        
        <span>-</span>
        
        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-0 p-1 font-normal shadow-none hover:bg-gray-100 hover:text-gray-700 sm:p-2"
            >
              {format(localEndDate, "dd 'de' MMM", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={localEndDate}
              onSelect={handleEndDateSelect}
              fromDate={localStartDate} // Impede selecionar datas anteriores à data inicial
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNextPeriod}
        disabled={isNextDisabled}
        className="rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
} 