import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Campaign {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  creator_id: string;
  goal_amount: number;
  current_amount: number;
  category: string;
  location?: string;
  deadline: string;
  is_active: boolean;
  donor_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
  };
}

interface CreateCampaignData {
  title: string;
  description: string;
  image_url?: string;
  goal_amount: number;
  category: string;
  location?: string;
  deadline: string;
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        profiles:creator_id (
          name,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCampaigns(data);
    }
    setLoading(false);
  };

  const createCampaign = async (campaignData: CreateCampaignData) => {
    if (!profile) {
      return { error: new Error('Must be authenticated to create campaigns') };
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        creator_id: profile.id
      })
      .select()
      .single();

    if (!error && data) {
      await fetchCampaigns(); // Refresh campaigns list
    }

    return { data, error };
  };

  const donateToCampaign = async (campaignId: string, amount: number, message?: string) => {
    if (!profile) {
      return { error: new Error('Must be authenticated to donate') };
    }

    // Check if user has sufficient balance
    if (profile.wallet_balance < amount) {
      return { error: new Error('Insufficient wallet balance') };
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Start transaction
      const { error: donationError } = await supabase
        .from('donations')
        .insert({
          campaign_id: campaignId,
          donor_id: profile.id,
          amount,
          message,
          transaction_id: transactionId
        });

      if (donationError) throw donationError;

      // Update donor's wallet balance and total donated
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: profile.wallet_balance - amount,
          total_donated: profile.total_donated + amount
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'donation_sent',
          amount,
          description: `Donation to campaign`,
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      // Refresh campaigns to show updated amounts
      await fetchCampaigns();

      return { success: true };
    } catch (error) {
      return { error };
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    loading,
    createCampaign,
    donateToCampaign,
    refreshCampaigns: fetchCampaigns
  };
};