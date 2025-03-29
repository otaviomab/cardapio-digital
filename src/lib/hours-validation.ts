export type WeekDay = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'

export interface OpeningHour {
  days: WeekDay[]
  start: string
  end: string
  enabled: boolean
}

// Valida o formato do horário (HH:mm)
export const validateHourFormat = (hour: string): boolean => {
  if (!hour) return false
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!regex.test(hour)) return false

  const [hours, minutes] = hour.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

// Converte horário em minutos para comparação
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Valida se o horário final é maior que o inicial
export const validateHourSequence = (start: string, end: string): boolean => {
  if (!validateHourFormat(start) || !validateHourFormat(end)) return false
  return timeToMinutes(end) > timeToMinutes(start)
}

// Verifica sobreposição de horários no mesmo dia
export const checkTimeOverlap = (hour1: OpeningHour, hour2: OpeningHour): boolean => {
  // Se não compartilham dias, não há sobreposição
  const hasCommonDays = hour1.days.some(day => hour2.days.includes(day))
  if (!hasCommonDays) return false

  const start1 = timeToMinutes(hour1.start)
  const end1 = timeToMinutes(hour1.end)
  const start2 = timeToMinutes(hour2.start)
  const end2 = timeToMinutes(hour2.end)

  return (start1 < end2 && end1 > start2)
}

// Verifica conflitos entre todos os horários
export const checkConflicts = (hours: OpeningHour[]): { 
  hasConflicts: boolean
  conflicts: Array<{
    index1: number
    index2: number
    days: WeekDay[]
  }>
} => {
  const conflicts: Array<{
    index1: number
    index2: number
    days: WeekDay[]
  }> = []

  for (let i = 0; i < hours.length; i++) {
    for (let j = i + 1; j < hours.length; j++) {
      if (hours[i].enabled && hours[j].enabled && checkTimeOverlap(hours[i], hours[j])) {
        // Encontra os dias em conflito
        const conflictingDays = hours[i].days.filter(day => 
          hours[j].days.includes(day)
        ) as WeekDay[]

        if (conflictingDays.length > 0) {
          conflicts.push({
            index1: i,
            index2: j,
            days: conflictingDays
          })
        }
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  }
}

// Normaliza os horários para formato consistente
export const normalizeHours = (hours: OpeningHour[]): OpeningHour[] => {
  return hours
    .filter(hour => 
      hour.days?.length > 0 && 
      hour.start && 
      hour.end && 
      validateHourFormat(hour.start) && 
      validateHourFormat(hour.end)
    )
    .map(hour => ({
      ...hour,
      start: hour.start.trim(),
      end: hour.end.trim(),
      days: [...new Set(hour.days)].sort() as WeekDay[] // Remove duplicatas e ordena
    }))
}

// Traduz os dias da semana para exibição
export const translateWeekDay = (day: WeekDay): string => {
  const translations: Record<WeekDay, string> = {
    domingo: 'Domingo',
    segunda: 'Segunda',
    terca: 'Terça',
    quarta: 'Quarta',
    quinta: 'Quinta',
    sexta: 'Sexta',
    sabado: 'Sábado'
  }
  return translations[day]
}

// Formata horário para exibição
export const formatTimeRange = (start: string, end: string): string => {
  return `${start} às ${end}`
}

// Agrupa horários por dia para melhor visualização
export const groupHoursByDay = (hours: OpeningHour[]): Record<WeekDay, string[]> => {
  const grouped: Record<WeekDay, string[]> = {
    domingo: [],
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: []
  }

  hours.forEach(hour => {
    if (hour.enabled) {
      const timeRange = formatTimeRange(hour.start, hour.end)
      hour.days.forEach(day => {
        grouped[day].push(timeRange)
      })
    }
  })

  return grouped
} 