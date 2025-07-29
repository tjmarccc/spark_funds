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
        console.log('Auth state changed:', event, session?.user?.id);
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
        console.error('Error fetching profile:', error);
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
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const connectWallet = async () => {
    setConnecting(true);

    try {
      const authClient = await AuthClient.create();

      // If already authenticated, skip login
      if (!authClient.isAuthenticated()) {
        await new Promise<void>((resolve, reject) => {
          authClient.login({
            identityProvider: "https://identity.ic0.app",
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
            maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
          });
        });
      }

      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      const principalId = principal.toString();
      const accountId = generateAccountId();

      setWallet({ principalId, accountId });

      // Check if there's a profile for this principal
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('principal_id', principalId)
        .maybeSingle();

      // Sign in anonymously with metadata
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            principal_id: principalId,
            account_id: accountId
          }
        }
      });

      if (error || !data?.user) {
        console.error('Supabase anonymous sign in error:', error);
        return { error };
      }

      if (existingProfile) {
        // Link existing profile to the session's user_id
        await supabase
          .from('profiles')
          .update({ user_id: data.user.id })
          .eq('principal_id', principalId);
      }

      return {
        success: true,
        isNewUser: !existingProfile,
        userId: data.user.id,
        principalId,
        accountId
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return { error };
    } finally {
      setConnecting(false);
    }
  };

  const createProfile = async (name: string, email: string, isCreator: boolean = false) => {
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
          total_received: 0
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { error: new Error('Profile with this principal_id already exists') };
        }
        console.error('Profile creation error:', error);
        return { error };
      }

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error in createProfile:', error);
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
      }
      return { error };
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
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
      }

      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
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
    isWalletConnected: !!wallet
  };
};

// Replace with actual derivation for ICP wallets if needed
const generateAccountId = (): string => {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};
