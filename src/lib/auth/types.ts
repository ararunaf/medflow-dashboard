import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AuthContext = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  tenantId: string | null;
};

export const emptyAuthContext: AuthContext = {
  session: null,
  user: null,
  profile: null,
  tenantId: null,
};
