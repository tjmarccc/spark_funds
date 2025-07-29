// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { AuthClient } from '@dfinity/auth-client';

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

      console.log('✅ Profile loaded:', profileData);
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
    console.log('🔑 Attempting ICP wallet connection...');

    try {
      const authClient = await AuthClient.create();

      if (!authClient.isAuthenticated()) {
        console.log('📲 Launching Internet Identity login popup...');
        await new Promise<void>((resolve, reject) => {
          authClient.login({
            identityProvider: 'https://identity.ic0.app',
            onSuccess: () => {
              console.log('✅ Internet Identity login success');
              resolve();
            },
            onError: (err) => {
              console.error('❌ Internet Identity login error:', err);
              reject(err);
            },
            maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000),
          });
        });
      }

      const identity = authClient.getIdentity();
      const principalId = identity.getPrincipal().toString();
      const accountId = generateAccountId();

      setWallet({ principalId, accountId });
      console.log('🔐 Got principal ID:', principalId);

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('principal_id', principalId)
        .maybeSingle();

      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: { principal_id: principalId, account_id: accountId },
        },
      });

      if (error || !data?.user) {
        console.error('❌ Supabase anonymous sign-in failed:', error);
        return { error };
      }

      console.log('🆔 Signed in anonymously as:', data.user.id);

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ user_id: data.user.id })
          .eq('principal_id', principalId);
        console.log('🔗 Linked profile to user_id');
      }

      return {
        success: true,
        isNewUser: !existingProfile,
        userId: data.user.id,
        principalId,
        accountId,
      };
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
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
          return { error: new Error('Duplicate profile principal_id') };
        }
        console.error('❌ Profile creation error:', error);
        return { error };
      }

      console.log('✅ Created new profile:', data);
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
        console.log('🔌 Disconnected wallet');
        setUser(null);
        setSession(null);
        setProfile(null);
        setWallet(null);
      }
      return { error };
    } catch (error) {
      console.error('❌ disconnectWallet error:', error);
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
        console.log('✏️ Updated profile:', data);
      }

      return { data, error };
    } catch (error) {
      console.error('❌ updateProfile error:', error);
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

// Dummy Account ID generator (replace with proper ICP logic if needed)
const generateAccountId = (): string => {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};
