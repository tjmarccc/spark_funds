// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  principal_id?: string;
  wallet_balance: number;
  total_donated: number;
  total_received: number;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
}

interface ICPWallet {
  principalId: string;
  accountId: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<ICPWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔥 Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setWallet(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📦 Initial session check:', session);
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('📥 Fetching profile for user:', userId);

      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileData && !error) {
        const { data: { session } } = await supabase.auth.getSession();
        const principalId = session?.user?.user_metadata?.principal_id;

        if (principalId) {
          const { data: principalProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('principal_id', principalId)
            .maybeSingle();

          if (principalProfile) {
            await supabase
              .from('profiles')
              .update({ user_id: userId })
              .eq('id', principalProfile.id);

            profileData = { ...principalProfile, user_id: userId };
          }
        }
      }

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return;
      }

      setProfile(profileData);

      if (profileData?.principal_id) {
        setWallet({
          principalId: profileData.principal_id,
          accountId: generateAccountId()
        });
      }

    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
    }
  };

  const connectWallet = async () => {
    setConnecting(true);
    console.log('🔑 Starting ICP wallet connection...');

    try {
      const authClient = await AuthClient.create();

      // 🔁 Always show login popup — reuses existing II identity
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider: 'https://identity.ic0.app',
          onSuccess: () => {
            console.log('✅ ICP login successful');
            resolve();
          },
          onError: (err) => {
            console.error('❌ ICP login error:', err);
            reject(err);
          },
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
        });
      });

      const identity = authClient.getIdentity();
      const principalId = identity.getPrincipal().toString();
      const accountId = generateAccountId();

      setWallet({ principalId, accountId });
      console.log('👤 Principal ID:', principalId);

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('principal_id', principalId)
        .maybeSingle();

      // 👻 Anonymous Supabase session w/ principal metadata
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: { principal_id: principalId, account_id: accountId },
        },
      });

      if (error || !data?.user) {
        console.error('❌ Supabase sign-in failed:', error);
        return { error };
      }

      console.log('🔗 Anonymous Supabase user:', data.user.id);

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ user_id: data.user.id })
          .eq('principal_id', principalId);

        console.log('🔗 Linked existing profile to new session');
      }

      return {
        success: true,
        isNewUser: !existingProfile,
        userId: data.user.id,
        principalId,
        accountId,
      };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      return { error };
    } finally {
      setConnecting(false);
    }
  };

  const createProfile = async (name: string, email: string, isCreator = false) => {
    if (!user || !wallet) {
      return { error: new Error('No wallet connected') };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name,
          email,
          is_creator: isCreator,
          principal_id: wallet.principalId,
          wallet_balance: 100,
          total_donated: 0,
          total_received: 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { error: new Error('Profile already exists for this principal') };
        }
        console.error('❌ Profile creation failed:', error);
        return { error };
      }

      setProfile(data);
      return { data };
    } catch (error) {
      console.error('❌ createProfile failed:', error);
      return { error };
    }
  };

  const disconnectWallet = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setWallet(null);
        console.log('🔌 Disconnected Supabase session');
      }
      return { error };
    } catch (error) {
      console.error('❌ disconnectWallet failed:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error('No profile found') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
        console.log('✏️ Profile updated:', data);
      }

      return { data, error };
    } catch (error) {
      console.error('❌ updateProfile failed:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    profile,
    wallet,
    loading,
    connecting,
    connectWallet,
    createProfile,
    disconnectWallet,
    updateProfile,
    isAuthenticated: !!user && !!profile,
    isWalletConnected: !!wallet,
  };
};

// 🧪 Dummy Account ID generator (replace with ICP hash if needed)
const generateAccountId = (): string => {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};
