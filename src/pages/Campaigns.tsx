import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import CampaignCard from '@/components/CampaignCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const categories = [
  'All',
  'Technology',
  'Education',
  'Health',
  'Environment',
  'Arts',
  'Community',
  'Sports',
  'Animals',
  'Other'
];

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'funded', label: 'Most Funded' },
  { value: 'ending', label: 'Ending Soon' },
];

export default function Campaigns() {
  const { campaigns } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (campaign.profiles?.name && campaign.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
      const matchesStatus = !showActiveOnly || campaign.is_active;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.donor_count - a.donor_count;
        case 'funded':
          return b.current_amount - a.current_amount;
        case 'ending':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [campaigns, searchTerm, selectedCategory, sortBy, showActiveOnly]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Browse Campaigns</h1>
          <p className="text-muted-foreground">
            Discover amazing projects and causes to support
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, creators, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active Filter */}
          <Button
            variant={showActiveOnly ? "default" : "outline"}
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className="lg:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showActiveOnly ? 'Active Only' : 'All Campaigns'}
          </Button>
        </div>

        {/* Filter Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {filteredAndSortedCampaigns.length} campaigns
          </span>
          {searchTerm && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
              Search: {searchTerm} ×
            </Badge>
          )}
          {selectedCategory !== 'All' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory('All')}>
              {selectedCategory} ×
            </Badge>
          )}
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredAndSortedCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🔍</div>
          <div>
            <h3 className="text-xl font-semibold">No campaigns found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all campaigns
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setShowActiveOnly(true);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}