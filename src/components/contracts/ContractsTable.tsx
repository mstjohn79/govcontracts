'use client';

import { useState } from 'react';
import { Contract } from '@/types/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';

interface ContractsTableProps {
  contracts: Contract[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRelevanceBadgeColor(relevance: string | undefined): string {
  switch (relevance) {
    case 'high':
      return 'bg-green-500 hover:bg-green-600';
    case 'medium':
      return 'bg-yellow-500 hover:bg-yellow-600';
    default:
      return 'bg-slate-400 hover:bg-slate-500';
  }
}

function getCategoryBadgeColor(category: string | undefined): string {
  switch (category) {
    case 'Artificial Intelligence':
      return 'bg-purple-500';
    case 'Machine Learning':
      return 'bg-indigo-500';
    case 'Data Analytics':
      return 'bg-blue-500';
    case 'Data Management':
      return 'bg-cyan-500';
    case 'Cloud Services':
      return 'bg-sky-500';
    case 'Cybersecurity':
      return 'bg-red-500';
    case 'Software Development':
      return 'bg-orange-500';
    default:
      return 'bg-slate-500';
  }
}

export function ContractsTable({ contracts, isLoading }: ContractsTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'awardAmount' | 'startDate'>('awardAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const searchLower = search.toLowerCase();
    return (
      contract.recipientName?.toLowerCase().includes(searchLower) ||
      contract.description?.toLowerCase().includes(searchLower) ||
      contract.awardingAgency?.toLowerCase().includes(searchLower) ||
      contract.awardId?.toLowerCase().includes(searchLower)
    );
  });

  // Sort contracts
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    if (sortField === 'awardAmount') {
      return sortOrder === 'desc' ? b.awardAmount - a.awardAmount : a.awardAmount - b.awardAmount;
    }
    if (sortField === 'startDate') {
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
    return 0;
  });

  const toggleSort = (field: 'awardAmount' | 'startDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'awardAmount' | 'startDate' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'desc' ? 
      <ChevronDown className="h-4 w-4 inline ml-1" /> : 
      <ChevronUp className="h-4 w-4 inline ml-1" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Contract Explorer</CardTitle>
            <CardDescription>
              {filteredContracts.length} of {contracts.length} contracts
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts, contractors, agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Contractor</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleSort('awardAmount')}
                >
                  Amount <SortIcon field="awardAmount" />
                </TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Relevance</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => toggleSort('startDate')}
                >
                  Date <SortIcon field="startDate" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Loading contracts...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                sortedContracts.map((contract) => (
                  <>
                    <TableRow 
                      key={contract.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                    >
                      <TableCell>
                        <div className="font-medium truncate max-w-[230px]" title={contract.recipientName}>
                          {contract.recipientName}
                        </div>
                        <div className="text-xs text-muted-foreground">{contract.awardId}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(contract.awardAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[150px]" title={contract.awardingAgency}>
                          {contract.awardingAgency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getCategoryBadgeColor(contract.category)} text-white text-xs`}>
                          {contract.category || 'Other'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRelevanceBadgeColor(contract.snowflakeRelevance)} text-white text-xs capitalize`}>
                          {contract.snowflakeRelevance || 'low'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(contract.startDate)}
                      </TableCell>
                    </TableRow>
                    {expandedId === contract.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold mb-1">Description</h4>
                              <p className="text-sm text-muted-foreground">
                                {contract.description || 'No description available'}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Start Date:</span>
                                <div className="font-medium">{formatDate(contract.startDate)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">End Date:</span>
                                <div className="font-medium">{formatDate(contract.endDate)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">NAICS:</span>
                                <div className="font-medium">{contract.naicsCode || 'N/A'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">PSC:</span>
                                <div className="font-medium">{contract.pscCode || 'N/A'}</div>
                              </div>
                            </div>
                            {contract.keywords && contract.keywords.length > 0 && (
                              <div>
                                <span className="text-muted-foreground text-sm">Keywords:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {contract.keywords.map((kw, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
