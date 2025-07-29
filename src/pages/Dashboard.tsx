import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { 
  Plus, 
  TrendingUp, 
  Heart, 
  Wallet, 
  Calendar,
  Users,
  Target,
  DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { profile, campaigns, loading } = useApp();

  if (loading) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h1>
        <Button asChild>
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  // Get user's campaigns if they're a creator
  const userCampaigns = campaigns.filter(c => c.creator_id === profile.id);
  
  // Calculate stats
  const totalRaised = userCampaigns.reduce((sum, c) => sum + c.current_amount, 0);
  const activeCampaigns = userCampaigns.filter(c => c.is_active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile.name}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your campaigns and donations
          </p>
        </div>
        
        {profile.is_creator && (
          <Button asChild className="bg-gradient-primary hover:bg-gradient-primary/90">
            <Link to="/create-campaign">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.wallet_balance.toFixed(2)} ICP</div>
            <p className="text-xs text-muted-foreground">
              Available for donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.total_donated.toFixed(2)} ICP</div>
            <p className="text-xs text-muted-foreground">
              Total contributed
            </p>
          </CardContent>
        </Card>

        {profile.is_creator && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRaised.toFixed(2)} ICP</div>
                <p className="text-xs text-muted-foreground">
                  From {userCampaigns.length} campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">
                  Currently fundraising
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Campaigns */}
        {profile.is_creator && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Campaigns</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/create-campaign">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Manage your fundraising campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userCampaigns.length > 0 ? (
                userCampaigns.slice(0, 3).map((campaign) => {
                  const progressPercentage = (campaign.current_amount / campaign.goal_amount) * 100;
                  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <div key={campaign.id} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-medium">{campaign.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{campaign.donor_count} donors</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{daysLeft} days left</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={campaign.is_active ? "default" : "secondary"}>
                          {campaign.is_active ? "Active" : "Ended"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{campaign.current_amount.toFixed(2)} ICP</span>
                          <span className="text-muted-foreground">of {campaign.goal_amount.toFixed(2)} ICP</span>
                        </div>
                        <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                      </div>
                      
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={`/campaigns/${campaign.id}`}>View Details</Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No campaigns yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link to="/create-campaign">Create your first campaign</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest donations and transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Recent activity coming soon</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/campaigns">Browse campaigns to support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions you might want to take
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-auto p-4 flex-col">
              <Link to="/campaigns">
                <Heart className="h-6 w-6 mb-2" />
                <span>Browse Campaigns</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="h-auto p-4 flex-col">
              <Link to="/wallet">
                <Wallet className="h-6 w-6 mb-2" />
                <span>Manage Wallet</span>
              </Link>
            </Button>
            
            {profile.is_creator && (
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link to="/create-campaign">
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Create Campaign</span>
                </Link>
              </Button>
            )}
            
            <Button variant="outline" asChild className="h-auto p-4 flex-col">
              <Link to="/profile">
                <Users className="h-6 w-6 mb-2" />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}