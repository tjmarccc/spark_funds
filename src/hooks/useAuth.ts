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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setWallet(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
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
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(profileData);
      
      // If profile exists and has principal_id, set wallet
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
      // Create ICP AuthClient
      const authClient = await AuthClient.create();
      
      // Login with Internet Identity
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider: "https://identity.ic0.app",
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        });
      });
      
      // Get the identity from auth client
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      const principalId = principal.toString();
      
      // Generate account ID from principal
      const accountId = generateAccountId();
      
      // Set wallet info immediately
      setWallet({ principalId, accountId });
      
      // Check if profile exists with this principal
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('principal_id', principalId)
        .maybeSingle();

      if (existingProfile) {
        // Existing user - sign them in with the existing user_id
        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: {
              principal_id: principalId,
              account_id: accountId,
              existing_user_id: existingProfile.user_id
            }
          }
        });

        if (error) {
          console.error('Sign in error:', error);
          throw new Error('Failed to sign in existing user');
        }

        // Update the profile's user_id to match the new session
        if (data.user && data.user.id !== existingProfile.user_id) {
          await supabase
            .from('profiles')
            .update({ user_id: data.user.id })
            .eq('id', existingProfile.id);
        }

        return { success: true, isNewUser: false };
      } else {
        // New user - create anonymous session first
        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: {
              principal_id: principalId,
              account_id: accountId
            }
          }
        });

        if (error || !data.user) {
          console.error('Anonymous sign in error:', error);
          throw new Error('Failed to create user session');
        }

        return { 
          success: true, 
          isNewUser: true, 
          principalId, 
          accountId, 
          userId: data.user.id 
        };
      }
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
          wallet_balance: 100, // Starting balance
          total_donated: 0,
          total_received: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        return { error };
      }

      if (data) {
        setProfile(data);
        return { data, error: null };
      }

      return { error: new Error('Failed to create profile') };
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

// Generate a mock ICP Principal ID (replace with real ICP SDK)
const generatePrincipalId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567';
  let result = '';
  for (let i = 0; i < 27; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a mock Account ID (replace with real ICP SDK)
const generateAccountId = (): string => {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};