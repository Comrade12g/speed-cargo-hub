import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

const AuthContext = createContext<{ session: Session | null; profile: Profile | null; loading: boolean; refreshProfile: () => Promise<void> }>({ session: null, profile: null, loading: true, refreshProfile: async () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId?: string) => {
    if (!userId) { setProfile(null); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, role, warehouse").eq("id", userId).single();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      window.setTimeout(() => loadProfile(nextSession?.user.id), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, profile, loading, refreshProfile: () => loadProfile(session?.user.id) }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
