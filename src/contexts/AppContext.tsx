import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCampaigns } from '@/hooks/useCampaigns';

interface AppContextType {
  // Auth
  currentUser: any;
  profile: any;
  isAuthenticated: boolean;
  isWalletConnected: boolean;
  connectWallet: () => Promise<any>;
  disconnectWallet: () => Promise<any>;
  logout: () => Promise<any>;
  loading: boolean;
  
  // Campaigns
  campaigns: any[];
  campaignsLoading: boolean;
  createCampaign: (data: any) => Promise<any>;
  donateToCampaign: (campaignId: string, amount: number, message?: string) => Promise<any>;
  refreshCampaigns: () => Promise<void>;
  
  // Legacy support for existing components
  donations: any[];
  transactions: any[];
  depositFunds: (amount: number) => void;
  withdrawFunds: (amount: number) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const campaigns = useCampaigns();

  return (
    <AppContext.Provider value={{ 
      // Auth
      currentUser: auth.profile,
      profile: auth.profile,
      isAuthenticated: auth.isAuthenticated,
      isWalletConnected: auth.isWalletConnected,
      connectWallet: auth.connectWallet,
      disconnectWallet: auth.disconnectWallet,
      logout: auth.disconnectWallet,
      loading: auth.loading,
      
      // Campaigns
      campaigns: campaigns.campaigns,
      campaignsLoading: campaigns.loading,
      createCampaign: campaigns.createCampaign,
      donateToCampaign: campaigns.donateToCampaign,
      refreshCampaigns: campaigns.refreshCampaigns,
      
      // Legacy support (mock data for now)
      donations: [],
      transactions: [],
      depositFunds: () => {},
      withdrawFunds: () => true
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};