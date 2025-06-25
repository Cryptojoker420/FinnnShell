// lib/supabase/server.ts (cleaned version)

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () => {
  return createServerComponentClient({ cookies });
};