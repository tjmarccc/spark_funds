import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Campaign type from useCampaigns hook
import { Calendar, MapPin, Users, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CampaignCardProps {
  campaign: any;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const progressPercentage = (campaign.current_amount / campaign.goal_amount) * 100;
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img
            src={campaign.image_url || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {campaign.category}
            </Badge>
          </div>
          {!campaign.is_active && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="destructive">Campaign Ended</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
            {campaign.description}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={campaign.profiles?.avatar_url || ""} />
            <AvatarFallback className="text-xs">
              {campaign.profiles?.name?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            by {campaign.profiles?.name || "Anonymous"}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {campaign.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{campaign.location}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{daysLeft} days left</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{campaign.current_amount.toFixed(2)} ICP raised</span>
            <span className="text-muted-foreground">of {campaign.goal_amount.toFixed(2)} ICP</span>
          </div>
          <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercentage.toFixed(1)}% funded</span>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{campaign.donor_count} donors</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full" variant={campaign.is_active ? "default" : "secondary"}>
          <Link to={`/campaigns/${campaign.id}`}>
            {campaign.is_active ? 'Support Campaign' : 'View Campaign'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}