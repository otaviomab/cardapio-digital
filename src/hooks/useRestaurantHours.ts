import { useState, useEffect } from 'react'

interface OpeningHour {
  days: string
  hours: string
}

interface UseRestaurantHoursResult {
  isOpen: boolean
  nextOpeningTime: string | null
  currentSchedule: string | null
  isLoading: boolean
}

export function useRestaurantHours(openingHours: OpeningHour[]): UseRestaurantHoursResult {
  const [isOpen, setIsOpen] = useState(false)
  const [nextOpeningTime, setNextOpeningTime] = useState<string | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!openingHours || openingHours.length === 0) {
      console.warn('Nenhum horário de funcionamento fornecido')
      setIsLoading(false)
      return
    }

    const checkIsOpen = () => {
      const now = new Date()
      const currentDay = now.getDay() // 0 = Domingo, 1 = Segunda, ...
      const currentTime = now.getHours() * 60 + now.getMinutes() // Converte para minutos

      // Mapeia os dias da semana para os formatos do restaurante
      const dayMappings = {
        'Segunda à Sexta': [1, 2, 3, 4, 5],
        'Segunda a Sexta': [1, 2, 3, 4, 5],
        'Sábado e Domingo': [0, 6],
        'Sábado': [6],
        'Domingo': [0],
        'Todos os dias': [0, 1, 2, 3, 4, 5, 6]
      }

      let isCurrentlyOpen = false
      let nextOpening: string | null = null
      let current: string | null = null

      for (const schedule of openingHours) {
        // Encontra os dias que se aplicam a este horário
        const applicableDays = Object.entries(dayMappings).reduce((days, [key, value]) => {
          if (schedule.days.includes(key)) {
            return [...days, ...value]
          }
          return days
        }, [] as number[])

        // Se o dia atual está incluído neste horário
        if (applicableDays.includes(currentDay)) {
          current = `${schedule.days}: ${schedule.hours}`
          
          // Extrai as horas do formato "HH:mm às HH:mm"
          const [start, end] = schedule.hours.split(' às ').map(time => {
            const [hours, minutes] = time.split(':').map(Number)
            return hours * 60 + (minutes || 0) // Converte para minutos
          })

          // Verifica se o horário atual está dentro do período de funcionamento
          if (end < start) {
            // Caso especial: horário passa da meia-noite
            if (currentTime >= start || currentTime <= end) {
              isCurrentlyOpen = true
            }
          } else {
            // Caso normal: horário no mesmo dia
            if (currentTime >= start && currentTime <= end) {
              isCurrentlyOpen = true
            }
          }

          if (!isCurrentlyOpen && currentTime < start) {
            // Se ainda não abriu, este é o próximo horário de abertura
            nextOpening = schedule.hours.split(' às ')[0]
          }
        }
      }

      setIsOpen(isCurrentlyOpen)
      setNextOpeningTime(nextOpening)
      setCurrentSchedule(current)
      setIsLoading(false)
    }

    // Verifica imediatamente
    checkIsOpen()

    // Configura o intervalo para verificar a cada minuto
    const interval = setInterval(checkIsOpen, 60000)

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval)
  }, [openingHours])

  return { 
    isOpen, 
    nextOpeningTime, 
    currentSchedule,
    isLoading 
  }
} 