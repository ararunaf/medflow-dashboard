/**
 * Adaptadores de escopo para queries de timeline (filtros PostgREST / or()).
 */

/**
 * Monta expressão `.or()` para eventos ligados a um plantão:
 * linha do próprio shift + assignments/swaps que carregam `shift_id` no metadata.
 */
export function shiftTimelineOrFilter(shiftId: string): string {
  const sid = encodeURIComponent(shiftId);
  return [
    `and(entity_type.eq.shift,entity_id.eq.${sid})`,
    `and(entity_type.eq.assignment,metadata->>shift_id.eq.${sid})`,
    `and(entity_type.eq.swap,metadata->>shift_id.eq.${sid})`,
  ].join(",");
}

/**
 * Eventos em que o profissional aparece como dono da entidade ou nos metadados.
 */
export function professionalTimelineOrFilter(professionalId: string): string {
  const pid = encodeURIComponent(professionalId);
  return [
    `and(entity_type.eq.availability,metadata->>professional_id.eq.${pid})`,
    `and(entity_type.eq.assignment,metadata->>professional_id.eq.${pid})`,
    `and(entity_type.eq.swap,metadata->>requester_professional_id.eq.${pid})`,
    `and(entity_type.eq.swap,metadata->>target_professional_id.eq.${pid})`,
  ].join(",");
}

export type TimelineScope =
  | { kind: "global" }
  | { kind: "shift"; shiftId: string }
  | { kind: "professional"; professionalId: string }
  | { kind: "swap"; swapId: string };
