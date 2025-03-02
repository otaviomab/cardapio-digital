/**
 * Alterações necessárias no arquivo src/app/admin/settings/page.tsx
 * para usar o campo restaurant_type diretamente
 */

// 1. Ao salvar as configurações, modificar o objeto settingsData:
const settingsData = {
  user_id: user.id,
  name: settings.name.trim(),
  description: settings.description?.trim() || '',
  slug,
  logo_url: settings.logo || '',
  cover_url: settings.coverImage || '',
  address: {
    street: settings.address.street?.trim() || '',
    number: settings.address.number?.trim() || '',
    neighborhood: settings.address.neighborhood?.trim() || '',
    city: settings.address.city?.trim() || '',
    state: settings.address.state?.trim() || '',
    zipCode: settings.address.zipCode?.replace(/\D/g, '') || '',
    coordinates: settings.address.coordinates
  },
  contact: {
    phone: settings.contact.phone?.replace(/\D/g, '') || '',
    whatsapp: settings.contact.whatsapp?.replace(/\D/g, '') || '',
    email: settings.contact.email?.trim().toLowerCase() || ''
  },
  opening_hours: settings.openingHours
    .filter(hour => hour.enabled && hour.days.length > 0)
    .map(hour => {
      // Validar formato de horário apenas se estiver na aba de horários
      // ou se os horários estiverem sendo salvos
      if (activeTab !== 'hours' && (!validateHourFormat(hour.start) || !validateHourFormat(hour.end))) {
        // Se não estiver na aba de horários, não validar o formato
        return {
          days: hour.days.filter(day => VALID_WEEK_DAYS.includes(day)) as WeekDay[],
          start: hour.start,
          end: hour.end,
          enabled: hour.enabled
        }
      }
      
      return {
        days: hour.days.filter(day => VALID_WEEK_DAYS.includes(day)) as WeekDay[],
        start: hour.start.trim(),
        end: hour.end.trim(),
        enabled: hour.enabled
      }
    }),
  delivery_info: {
    minimumOrder: Number(settings.deliveryInfo.minimumOrder) || 0,
    deliveryTime: settings.deliveryInfo.deliveryTime?.trim() || '',
    paymentMethods: settings.deliveryInfo.paymentMethods || [],
    zones: settings.deliveryInfo.zones.map(zone => ({
      ...zone,
      minDistance: Number(zone.minDistance) || 0,
      maxDistance: Number(zone.maxDistance) || 0,
      fee: Number(zone.fee) || 0
    }))
    // Remover restaurantType daqui
  },
  restaurant_type: settings.restaurantType // Adicionar esta linha
}

// 2. Ao carregar as configurações, modificar o objeto settings:
setSettings({
  name: data.name || '',
  description: data.description || '',
  logo: data.logo_url || '',
  coverImage: data.cover_url || '',
  address: {
    street: data.address?.street || '',
    number: data.address?.number || '',
    neighborhood: data.address?.neighborhood || '',
    city: data.address?.city || '',
    state: data.address?.state || '',
    zipCode: data.address?.zipCode || '',
    coordinates: data.address?.coordinates
  },
  contact: {
    phone: data.contact?.phone || '',
    whatsapp: data.contact?.whatsapp || '',
    email: data.contact?.email || ''
  },
  openingHours: validatedOpeningHours.length > 0 
    ? validatedOpeningHours
    : [{ days: [], start: '', end: '', enabled: true }],
  deliveryInfo: {
    minimumOrder: data.delivery_info?.minimumOrder || 0,
    deliveryTime: data.delivery_info?.deliveryTime || '',
    paymentMethods: data.delivery_info?.paymentMethods || [],
    zones: data.delivery_info?.zones || []
    // Remover restaurantType daqui
  },
  restaurantType: data.restaurant_type || 'restaurant' // Modificar esta linha
}); 