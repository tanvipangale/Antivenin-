import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadHospital(userId) {
    try {
      const { data, error } = await supabase.from('staff_applications').select('*').eq('user_id', userId).maybeSingle();
      if (error) {
        console.error('Could not load hospital:', error);
        return setHospital(null);
      }
      setHospital(data || null);
    } catch (error) {
      console.error('Hospital lookup failed:', error);
      setHospital(null);
    }
  }

  async function loadAdminStatus(userId) {
    try {
      const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
      if (error) {
        console.error('Could not check admin status:', error);
        return setIsAdmin(false);
      }
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Admin check failed:', error);
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        await Promise.all([loadHospital(session.user.id), loadAdminStatus(session.user.id)]);
      }
      setLoading(false);
    }
    loadSession();

    // Listen for login/logout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        await Promise.all([loadHospital(newSession.user.id), loadAdminStatus(newSession.user.id)]);
      } else {
        setHospital(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };

    setSession(data.session);
    if (data.user) {
      await Promise.all([loadHospital(data.user.id), loadAdminStatus(data.user.id)]);
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    setHospital(null);
    setIsAdmin(false);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout failed:', error);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, hospital, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}