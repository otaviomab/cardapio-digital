import { WeekDay, timeToMinutes } from './index';

export interface OpeningHour {
  days: WeekDay[]
  start: string
  end: string
  enabled: boolean
}

/**
 * Valida o formato do horário (HH:mm)
 * @param hour Horário a ser validado
 * @returns true se o formato for válido
 */
export const validateHourFormat = (hour: string): boolean => {
  if (!hour) return false;
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!regex.test(hour)) return false;

  const [hours, minutes] = hour.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Valida se o horário de início é anterior ao horário de término
 * @param start Horário de início (HH:mm)
 * @param end Horário de término (HH:mm)
 * @returns true se a sequência for válida
 */
export const validateHourSequence = (start: string, end: string): boolean => {
  if (!validateHourFormat(start) || !validateHourFormat(end)) return false;
  return timeToMinutes(start) < timeToMinutes(end);
};

/**
 * Verifica se há sobreposição entre dois horários
 * @param hour1 Primeiro período de horário
 * @param hour2 Segundo período de horário
 * @returns true se houver sobreposição
 */
export const checkTimeOverlap = (hour1: OpeningHour, hour2: OpeningHour): boolean => {
  if (!hour1.enabled || !hour2.enabled) return false;
  
  // Verifica se há dias em comum
  const hasCommonDays = hour1.days.some(day => hour2.days.includes(day));
  if (!hasCommonDays) return false;
  
  // Converte horários para minutos
  const start1 = timeToMinutes(hour1.start);
  const end1 = timeToMinutes(hour1.end);
  const start2 = timeToMinutes(hour2.start);
  const end2 = timeToMinutes(hour2.end);
  
  // Verifica sobreposição
  return (start1 < end2 && start2 < end1);
};

/**
 * Verifica conflitos entre horários de funcionamento
 * @param hours Lista de horários de funcionamento
 * @returns Objeto contendo informações sobre conflitos
 */
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
  }> = [];
  
  for (let i = 0; i < hours.length; i++) {
    const hour1 = hours[i];
    if (!hour1.enabled) continue;
    
    for (let j = i + 1; j < hours.length; j++) {
      const hour2 = hours[j];
      if (!hour2.enabled) continue;
      
      // Encontra dias em comum
      const commonDays = hour1.days.filter(day => hour2.days.includes(day));
      if (commonDays.length === 0) continue;
      
      // Verifica sobreposição de horários
      const start1 = timeToMinutes(hour1.start);
      const end1 = timeToMinutes(hour1.end);
      const start2 = timeToMinutes(hour2.start);
      const end2 = timeToMinutes(hour2.end);
      
      if (start1 < end2 && start2 < end1) {
        conflicts.push({
          index1: i,
          index2: j,
          days: commonDays
        });
      }
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
};

/**
 * Agrupa horários por dia da semana
 * @param hours Lista de horários de funcionamento
 * @returns Objeto com dias como chaves e arrays de horários como valores
 */
export const groupHoursByDay = (hours: OpeningHour[]): Record<WeekDay, string[]> => {
  const result: Record<WeekDay, string[]> = {
    domingo: [],
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: []
  };
  
  hours.forEach(hour => {
    if (hour.enabled) {
      const timeStr = `${hour.start} - ${hour.end}`;
      hour.days.forEach(day => {
        result[day].push(timeStr);
      });
    }
  });
  
  return result;
};

/**
 * Normaliza horários para evitar duplicações e simplificar a estrutura
 * @param hours Lista de horários de funcionamento
 * @returns Lista normalizada de horários
 */
export const normalizeHours = (hours: OpeningHour[]): OpeningHour[] => {
  // Remove horários desativados
  const enabledHours = hours.filter(hour => hour.enabled);
  
  // Agrupa por horário (start-end)
  const hourGroups: Record<string, WeekDay[]> = {};
  
  enabledHours.forEach(hour => {
    const key = `${hour.start}-${hour.end}`;
    if (!hourGroups[key]) {
      hourGroups[key] = [...hour.days];
    } else {
      hour.days.forEach(day => {
        if (!hourGroups[key].includes(day)) {
          hourGroups[key].push(day);
        }
      });
    }
  });
  
  // Converte de volta para o formato OpeningHour
  return Object.entries(hourGroups).map(([key, days]) => {
    const [start, end] = key.split('-');
    return {
      days,
      start,
      end,
      enabled: true
    };
  });
}; 