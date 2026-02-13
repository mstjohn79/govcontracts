'use client';

import { Contract, TRACKED_COMPETITORS } from '@/types/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2,
  DollarSign,
  FileText,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface CompetitorTrackerProps {
  contracts: Contract[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Normalize competitor names for matching
function normalizeCompetitorName(name: string): string {
  const normalized = name.toUpperCase().trim();
  
  if (normalized.includes('PALANTIR')) return 'Palantir';
  if (normalized.includes('AMAZON') || normalized.includes('AWS')) return 'AWS';
  if (normalized.includes('MICROSOFT')) return 'Microsoft';
  if (normalized.includes('GOOGLE')) return 'Google';
  if (normalized.includes('BOOZ ALLEN')) return 'Booz Allen';
  if (normalized.includes('CACI')) return 'CACI';
  if (normalized.includes('LEIDOS')) return 'Leidos';
  if (normalized.includes('GENERAL DYNAMICS')) return 'GDIT';
  if (normalized.includes('DELOITTE')) return 'Deloitte';
  if (normalized.includes('ACCENTURE')) return 'Accenture';
  if (normalized.includes('DATABRICKS')) return 'Databricks';
  if (normalized.includes('SNOWFLAKE')) return 'Snowflake';
  if (normalized.includes('IBM')) return 'IBM';
  if (normalized.includes('ORACLE')) return 'Oracle';
  
  return name;
}

interface CompetitorData {
  name: string;
  fullName: string;
  totalAmount: number;
  contractCount: number;
  avgContractSize: number;
  agencies: Set<string>;
  categories: Map<string, number>;
  recentContracts: Contract[];
}

export function CompetitorTracker({ contracts }: CompetitorTrackerProps) {
  // Build competitor data
  const competitorMap = new Map<string, CompetitorData>();
  
  contracts.forEach(contract => {
    const normalizedName = normalizeCompetitorName(contract.recipientName);
    
    // Only track known competitors
    if (!['Palantir', 'AWS', 'Microsoft', 'Google', 'Booz Allen', 'CACI', 'Leidos', 'GDIT', 'Deloitte', 'Accenture', 'Databricks', 'Snowflake', 'IBM', 'Oracle'].includes(normalizedName)) {
      return;
    }
    
    if (!competitorMap.has(normalizedName)) {
      competitorMap.set(normalizedName, {
        name: normalizedName,
        fullName: contract.recipientName,
        totalAmount: 0,
        contractCount: 0,
        avgContractSize: 0,
        agencies: new Set(),
        categories: new Map(),
        recentContracts: [],
      });
    }
    
    const data = competitorMap.get(normalizedName)!;
    data.totalAmount += contract.awardAmount;
    data.contractCount += 1;
    data.agencies.add(contract.awardingAgency);
    
    const cat = contract.category || 'Other';
    data.categories.set(cat, (data.categories.get(cat) || 0) + contract.awardAmount);
    
    data.recentContracts.push(contract);
  });
  
  // Calculate averages and sort by total
  const competitors = Array.from(competitorMap.values())
    .map(c => ({
      ...c,
      avgContractSize: c.contractCount > 0 ? c.totalAmount / c.contractCount : 0,
      agencyCount: c.agencies.size,
      recentContracts: c.recentContracts.sort((a, b) => 
        new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
      ).slice(0, 5),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Chart data
  const chartData = competitors.slice(0, 8).map(c => ({
    name: c.name,
    amount: c.totalAmount,
    contracts: c.contractCount,
  }));

  if (competitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Competitor Tracker</CardTitle>
          <CardDescription>No tracked competitors found in current data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Search for specific competitors or load more contract data to see competitor analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitor Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Comparison</CardTitle>
          <CardDescription>Total contract value by competitor</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'amount' ? 'Total Value' : 'Contracts'
                ]}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Competitor Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {competitors.slice(0, 6).map((competitor) => (
          <Card key={competitor.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{competitor.name}</CardTitle>
                <Badge variant="outline">{competitor.contractCount} contracts</Badge>
              </div>
              <CardDescription className="truncate text-xs">
                {competitor.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Total Value</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(competitor.totalAmount)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Avg Size</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(competitor.avgContractSize)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Agencies</span>
                  </div>
                  <span className="font-medium">{competitor.agencyCount}</span>
                </div>

                {/* Top Categories */}
                <div>
                  <span className="text-xs text-muted-foreground">Top Categories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(competitor.categories.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([cat]) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Recent Contract */}
                {competitor.recentContracts[0] && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Latest Contract</span>
                    <p className="text-sm truncate mt-1" title={competitor.recentContracts[0].description}>
                      {competitor.recentContracts[0].description?.slice(0, 80) || 'No description'}...
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(competitor.recentContracts[0].startDate || '').toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(competitor.recentContracts[0].awardAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
