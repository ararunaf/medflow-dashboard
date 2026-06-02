/**
 * Leitura de disponibilidade — usado pela tela Perfil e pelo dashboard
 * para sinalizar se o profissional está aberto a novos plantões.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { Database } from "@/lib/database.types";

type AvailabilityRow = Database["public"]["Tables"]["availability"]["Row"];

export type AvailabilityWindowItem = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  available: boolean;
};

export const getMyAvailabilityFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<AvailabilityWindowItem[]>> => {
    return runQuery(async (ctx) => {
      if (!ctx.professionalId) return [];
      const { data, error } = await ctx.client
        .from("availability")
        .select("id, weekday, start_time, end_time, available")
        .eq("tenant_id", ctx.tenantId)
        .eq("professional_id", ctx.professionalId)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw mapPostgresError(error);
      return (data ?? []).map(
        (
          row: Pick<AvailabilityRow, "id" | "weekday" | "start_time" | "end_time" | "available">,
        ) => ({
          id: row.id,
          weekday: row.weekday,
          startTime: row.start_time,
          endTime: row.end_time,
          available: row.available,
        }),
      );
    });
  },
);
