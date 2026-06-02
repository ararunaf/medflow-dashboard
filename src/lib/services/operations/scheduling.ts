import type { OperationalClient } from "./types";

export async function listUnitsByHospital(client: OperationalClient, hospitalId: string) {
  return client.from("units").select("*").eq("hospital_id", hospitalId).order("name");
}

export async function listDepartmentsByUnit(client: OperationalClient, unitId: string) {
  return client.from("departments").select("*").eq("unit_id", unitId).order("name");
}

export async function listSchedulesByDepartment(client: OperationalClient, departmentId: string) {
  return client
    .from("schedules")
    .select("*")
    .eq("department_id", departmentId)
    .order("start_date", { ascending: false });
}

export async function listShiftsBySchedule(client: OperationalClient, scheduleId: string) {
  return client.from("shifts").select("*").eq("schedule_id", scheduleId).order("starts_at");
}

export async function listAssignmentsForShift(client: OperationalClient, shiftId: string) {
  return client.from("shift_assignments").select("*").eq("shift_id", shiftId).order("assigned_at");
}

export async function listSwapRequestsForShift(client: OperationalClient, shiftId: string) {
  return client
    .from("shift_swap_requests")
    .select("*")
    .eq("shift_id", shiftId)
    .order("requested_at");
}

export async function listAvailabilityForProfessional(
  client: OperationalClient,
  professionalId: string,
) {
  return client
    .from("availability")
    .select("*")
    .eq("professional_id", professionalId)
    .order("weekday")
    .order("start_time");
}
