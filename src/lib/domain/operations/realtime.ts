/**
 * Nomes de canal estáveis para Supabase Realtime (uso futuro).
 * Prefixo por tenant evita vazamento acidental entre inquilinos no cliente.
 */
export const operationalRealtimeTopics = {
  units: (tenantId: string) => `ops:tenant:${tenantId}:units`,
  departments: (tenantId: string) => `ops:tenant:${tenantId}:departments`,
  schedules: (tenantId: string) => `ops:tenant:${tenantId}:schedules`,
  shifts: (tenantId: string) => `ops:tenant:${tenantId}:shifts`,
  shiftAssignments: (tenantId: string) => `ops:tenant:${tenantId}:shift_assignments`,
  shiftSwapRequests: (tenantId: string) => `ops:tenant:${tenantId}:shift_swap_requests`,
  availability: (tenantId: string) => `ops:tenant:${tenantId}:availability`,
} as const;
