// lib/supabase-api.ts

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => {
  return createRouteHandlerClient({ cookies });
};