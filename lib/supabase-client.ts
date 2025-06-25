// lib/supabase-client.ts

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();

// Add the missing createClient function
export const createClient = () => createClientComponentClient();