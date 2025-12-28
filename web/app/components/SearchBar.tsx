'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
  userRole: string;
}

export default function SearchBar({ query, onQueryChange, onSearch, loading, userRole }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search for products, brands, or SKUs..."
              className="text-lg h-12 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="h-12 px-8 bg-primary hover:bg-primary/90"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Smart Integrate Internal Tool
            </Badge>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Access
            </Badge>
          </div>
        </div>
      </form>
    </Card>
  );
}