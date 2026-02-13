'use client';

import { useState, useEffect } from 'react';
import { Contract } from '@/types/contracts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  StatsCards, 
  TopContractorsChart, 
  CategoryBreakdown, 
  RelevanceBreakdown 
} from '@/components/dashboard/StatsCards';
import { ContractsTable } from '@/components/contracts/ContractsTable';
import { CompetitorTracker } from '@/components/competitors/CompetitorTracker';
import { 
  Search, 
  RefreshCw, 
  BarChart3, 
  FileText, 
  Users, 
  Target,
  Building,
  TrendingUp
} from 'lucide-react';

export default function Home() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Fetch contracts on load
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async (query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      params.set('limit', '100');
      
      const response = await fetch(`/api/contracts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setContracts(data.contracts);
      } else {
        setError('Failed to load contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Error fetching contracts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContracts(searchQuery);
  };

  const fetchCompetitorData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'keywords',
          keywords: ['Palantir', 'data analytics', 'artificial intelligence', 'machine learning', 'cloud', 'data warehouse'],
          limit: 300
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setContracts(data.contracts);
      }
    } catch (error) {
      console.error('Error fetching competitor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick search presets
  const quickSearches = [
    { label: 'AI/ML', query: 'artificial intelligence machine learning' },
    { label: 'Data Analytics', query: 'data analytics' },
    { label: 'Data Warehouse', query: 'data warehouse data lake' },
    { label: 'Cloud', query: 'cloud computing aws azure' },
    { label: 'Palantir', query: 'Palantir' },
    { label: 'Cybersecurity', query: 'cybersecurity' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GovContracts Intel</h1>
                <p className="text-xs text-muted-foreground">Federal Data/AI Contract Intelligence</p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts, contractors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {quickSearches.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(preset.query);
                  fetchContracts(preset.query);
                }}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contracts</span>
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Competitors</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Opportunities</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-muted-foreground">Loading contracts from USASpending.gov...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
                <Button variant="outline" size="sm" className="ml-4" onClick={() => fetchContracts()}>
                  Retry
                </Button>
              </div>
            )}
            
            {!isLoading && !error && contracts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No contracts found. Try a different search term.
              </div>
            )}
            
            {!isLoading && contracts.length > 0 && (
              <>
                <StatsCards contracts={contracts} />
            
            <div className="grid gap-6 lg:grid-cols-3">
              <TopContractorsChart contracts={contracts} />
              <CategoryBreakdown contracts={contracts} />
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <RelevanceBreakdown contracts={contracts} />
              
              {/* Recent High-Value Contracts */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contracts</CardTitle>
                  <CardDescription>Highest value data/AI contracts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contracts
                      .sort((a, b) => b.awardAmount - a.awardAmount)
                      .slice(0, 5)
                      .map((contract, i) => (
                        <div key={contract.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contract.recipientName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contract.description?.slice(0, 60)}...
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-green-600">
                              ${(contract.awardAmount / 1_000_000).toFixed(1)}M
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {contract.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
              </>
            )}
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <ContractsTable contracts={contracts} isLoading={isLoading} />
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors">
            <div className="mb-4">
              <Button onClick={fetchCompetitorData} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Competitor Data
                  </>
                )}
              </Button>
            </div>
            <CompetitorTracker contracts={contracts} />
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* High Relevance Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    High Relevance Opportunities
                  </CardTitle>
                  <CardDescription>
                    Contracts most aligned with Snowflake capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contracts
                      .filter(c => c.snowflakeRelevance === 'high')
                      .sort((a, b) => b.awardAmount - a.awardAmount)
                      .slice(0, 8)
                      .map((contract) => (
                        <div key={contract.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm truncate flex-1">
                              {contract.recipientName}
                            </span>
                            <Badge className="bg-green-500 ml-2">
                              ${(contract.awardAmount / 1_000_000).toFixed(1)}M
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {contract.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {contract.awardingAgency}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {contract.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {contracts.filter(c => c.snowflakeRelevance === 'high').length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No high relevance contracts found. Try searching for "data warehouse" or "data lake".
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Takeout */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Competitive Analysis
                  </CardTitle>
                  <CardDescription>
                    Competitor contracts that could be opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contracts
                      .filter(c => {
                        const name = c.recipientName.toUpperCase();
                        return name.includes('PALANTIR') || 
                               name.includes('DATABRICKS') ||
                               name.includes('ORACLE') ||
                               name.includes('IBM');
                      })
                      .sort((a, b) => b.awardAmount - a.awardAmount)
                      .slice(0, 8)
                      .map((contract) => (
                        <div key={contract.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-sm">
                                {contract.recipientName.split(' ').slice(0, 2).join(' ')}
                              </span>
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Competitor
                              </Badge>
                            </div>
                            <Badge className="bg-blue-500">
                              ${(contract.awardAmount / 1_000_000).toFixed(1)}M
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {contract.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {contract.awardingAgency}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {contracts.filter(c => {
                      const name = c.recipientName.toUpperCase();
                      return name.includes('PALANTIR') || name.includes('DATABRICKS');
                    }).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Search for "Palantir" or "Databricks" to see competitor contracts.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white/50 dark:bg-slate-950/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Data sourced from USASpending.gov API</p>
          <p className="mt-1">Federal contract data for research and analysis purposes</p>
        </div>
      </footer>
    </div>
  );
}
