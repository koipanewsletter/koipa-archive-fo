import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tojqpiuiwemeqzxtirik.supabase.co";
const supabaseAnonKey = "sb_publishable_95H0G_9hZDsLO4kRgmkLIQ_8YQL8fAa";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
