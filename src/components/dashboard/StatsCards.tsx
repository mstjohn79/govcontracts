'use client';

import { useEffect, useState } from 'react';
import { Contract, ContractStats, TRACKED_COMPETITORS } from '@/types/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  FileText, 
  Building2, 
  TrendingUp,
  Users,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface StatsCardsProps {
  contracts: Contract[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function StatsCards({ contracts }: StatsCardsProps) {
  const totalValue = contracts.reduce((sum, c) => sum + c.awardAmount, 0);
  const avgValue = contracts.length > 0 ? totalValue / contracts.length : 0;
  
  // Count unique contractors
  const uniqueContractors = new Set(contracts.map(c => c.recipientName)).size;
  
  // Count unique agencies
  const uniqueAgencies = new Set(contracts.map(c => c.awardingAgency)).size;

  // High relevance count
  const highRelevance = contracts.filter(c => c.snowflakeRelevance === 'high').length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            {contracts.length} contracts analyzed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Contract Size</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(avgValue)}</div>
          <p className="text-xs text-muted-foreground">
            Across all data/AI contracts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contractors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueContractors}</div>
          <p className="text-xs text-muted-foreground">
            Unique companies winning
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Relevance</CardTitle>
          <Target className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{highRelevance}</div>
          <p className="text-xs text-muted-foreground">
            Snowflake opportunities
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function TopContractorsChart({ contracts }: StatsCardsProps) {
  // Aggregate by contractor
  const contractorMap = new Map<string, { amount: number; count: number }>();
  
  contracts.forEach(contract => {
    const existing = contractorMap.get(contract.recipientName) || { amount: 0, count: 0 };
    contractorMap.set(contract.recipientName, {
      amount: existing.amount + contract.awardAmount,
      count: existing.count + 1,
    });
  });

  // Sort and take top 10
  const topContractors = Array.from(contractorMap.entries())
    .map(([name, data]) => ({ name: name.split(' ').slice(0, 2).join(' '), fullName: name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Top Contractors by Award Value</CardTitle>
        <CardDescription>Largest recipients of data/AI contracts</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={topContractors} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => topContractors.find(c => c.name === label)?.fullName || label}
            />
            <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CategoryBreakdown({ contracts }: StatsCardsProps) {
  // Aggregate by category
  const categoryMap = new Map<string, number>();
  
  contracts.forEach(contract => {
    const cat = contract.category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + contract.awardAmount);
  });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Categories</CardTitle>
        <CardDescription>Distribution by contract type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RelevanceBreakdown({ contracts }: StatsCardsProps) {
  const high = contracts.filter(c => c.snowflakeRelevance === 'high');
  const medium = contracts.filter(c => c.snowflakeRelevance === 'medium');
  const low = contracts.filter(c => c.snowflakeRelevance === 'low');

  const data = [
    { name: 'High', count: high.length, amount: high.reduce((s, c) => s + c.awardAmount, 0), fill: '#22c55e' },
    { name: 'Medium', count: medium.length, amount: medium.reduce((s, c) => s + c.awardAmount, 0), fill: '#eab308' },
    { name: 'Low', count: low.length, amount: low.reduce((s, c) => s + c.awardAmount, 0), fill: '#94a3b8' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snowflake Relevance</CardTitle>
        <CardDescription>Opportunity scoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(item.amount)}</div>
                <div className="text-xs text-muted-foreground">{item.count} contracts</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
