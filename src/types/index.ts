export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  totalDonated: number;
  totalReceived: number;
  walletBalance: number;
  createdAt: Date;
  isCreator: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  creatorId: string;
  creator: User;
  goalAmount: number;
  currentAmount: number;
  category: string;
  location: string;
  createdAt: Date;
  deadline: Date;
  isActive: boolean;
  donorCount: number;
}

export interface Donation {
  id: string;
  campaignId: string;
  campaign: Campaign;
  donorId: string;
  donor: User;
  amount: number;
  message?: string;
  timestamp: Date;
  transactionId: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'donation_sent' | 'donation_received';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export type UserRole = 'donor' | 'creator' | 'both';