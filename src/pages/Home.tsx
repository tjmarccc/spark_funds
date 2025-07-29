import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { 
  Zap, 
  Users, 
  Target, 
  Shield, 
  ArrowRight, 
  TrendingUp,
  Heart,
  Globe,
  Plus
} from 'lucide-react';
import CampaignCard from '@/components/CampaignCard';

export default function Home() {
  const { campaigns, currentUser } = useApp();
  
  // Get featured campaigns (top 3 by amount raised)
  const featuredCampaigns = campaigns
    .filter(c => c.isActive)
    .sort((a, b) => b.currentAmount - a.currentAmount)
    .slice(0, 3);

  const stats = {
    totalCampaigns: campaigns.length,
    totalDonors: new Set(campaigns.flatMap(c => c.donorCount)).size,
    totalRaised: campaigns.reduce((sum, c) => sum + c.currentAmount, 0),
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-16">
        <div className="space-y-4">
          <Badge variant="secondary" className="px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            Powered by Internet Computer Protocol
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Spark Change with{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Micro-Donations
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Support local creators and causes through secure, transparent micro-donations 
            on the Internet Computer blockchain. Every small contribution creates a big impact.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {currentUser ? (
            <>
              <Button size="lg" asChild className="bg-gradient-primary hover:bg-gradient-primary/90">
                <Link to="/campaigns">
                  <Heart className="mr-2 h-5 w-5" />
                  Browse Campaigns
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/create-campaign">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Campaign
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" asChild className="bg-gradient-primary hover:bg-gradient-primary/90">
                <Link to="/auth">
                  <Zap className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/campaigns">
                  Explore Campaigns
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Active fundraising campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRaised.toFixed(2)} ICP</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDonors}+</div>
            <p className="text-xs text-muted-foreground">
              Active donors and creators
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Featured Campaigns */}
      {featuredCampaigns.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Featured Campaigns</h2>
              <p className="text-muted-foreground">
                Discover impactful projects making a difference
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/campaigns">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Why Choose Spark Funds?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built on the Internet Computer Protocol for maximum security, transparency, and efficiency
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Secure & Transparent</CardTitle>
              <CardDescription>
                All transactions are recorded on the Internet Computer blockchain, 
                ensuring complete transparency and security.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Instant Micro-Donations</CardTitle>
              <CardDescription>
                Make small but meaningful contributions instantly. Every donation, 
                no matter the size, creates real impact.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Global Reach</CardTitle>
              <CardDescription>
                Support creators and causes worldwide with no geographical restrictions 
                or traditional banking limitations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section className="text-center space-y-6 py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold">Ready to Make an Impact?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users already making a difference through micro-donations. 
            Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-primary hover:bg-gradient-primary/90">
              <Link to="/auth">
                <Zap className="mr-2 h-5 w-5" />
                Connect Wallet
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/campaigns">
                Browse Campaigns
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}