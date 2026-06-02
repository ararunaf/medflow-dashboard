export type {
  UnitType,
  ScheduleStatus,
  ShiftStatus,
  AssignmentStatus,
  SwapRequestStatus,
} from "@/lib/database.types";

/** Convenção MedFlow: `date_part('dow', ...)` — 0 = domingo … 6 = sábado. */
export type Weekday0To6 = 0 | 1 | 2 | 3 | 4 | 5 | 6;
