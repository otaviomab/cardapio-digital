export type WeekDay = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'

/**
 * Converte um horário no formato HH:mm para minutos
 * @param time Horário no formato HH:mm
 * @returns Total de minutos
 */
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Formata um intervalo de tempo
 * @param start Horário de início no formato HH:mm
 * @param end Horário de término no formato HH:mm
 * @returns String formatada (ex: 08:00 - 12:00)
 */
export const formatTimeRange = (start: string, end: string): string => {
  return `${start} - ${end}`;
};

/**
 * Traduz o dia da semana para o formato amigável em português
 * @param day Dia da semana no formato interno
 * @returns Nome do dia traduzido
 */
export const translateWeekDay = (day: WeekDay): string => {
  const translations = {
    'domingo': 'Domingo',
    'segunda': 'Segunda-feira',
    'terca': 'Terça-feira',
    'quarta': 'Quarta-feira',
    'quinta': 'Quinta-feira',
    'sexta': 'Sexta-feira',
    'sabado': 'Sábado'
  };
  return translations[day] || day;
};

/**
 * Obtém o nome do dia da semana atual
 * @returns Dia da semana como WeekDay
 */
export const getCurrentWeekDay = (): WeekDay => {
  const days: WeekDay[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const today = new Date().getDay();
  return days[today];
};

/**
 * Formata a hora atual no formato HH:mm
 * @returns Hora atual formatada
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}; 