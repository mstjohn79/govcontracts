// USASpending API Client

import { Contract, ContractFilters, DATA_AI_KEYWORDS, DATA_AI_NAICS } from '@/types/contracts';

const USA_SPENDING_API = 'https://api.usaspending.gov/api/v2';

interface USASpendingSearchParams {
  filters: {
    keywords?: string[];
    recipient_search_text?: string[];
    award_type_codes?: string[];
    time_period?: { start_date: string; end_date: string }[];
    agencies?: { type: string; tier: string; name: string }[];
    naics_codes?: { require: string[] };
    award_amounts?: { lower_bound?: number; upper_bound?: number }[];
  };
  fields: string[];
  limit: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface USASpendingResult {
  internal_id: number;
  'Award ID': string;
  'Recipient Name': string;
  'Award Amount': number;
  Description: string;
  'Awarding Agency': string;
  'Awarding Sub Agency'?: string;
  'Start Date': string;
  'End Date'?: string;
  'NAICS Code'?: string;
  'NAICS Description'?: string;
  'Product or Service Code'?: string;
  generated_internal_id: string;
}

// Transform USASpending response to our Contract type
function transformContract(result: USASpendingResult): Contract {
  const category = categorizeContract(result.Description || '', result['NAICS Description'] || '');
  const relevance = calculateSnowflakeRelevance(result.Description || '', category);
  
  return {
    id: result.generated_internal_id,
    awardId: result['Award ID'],
    recipientName: result['Recipient Name'],
    awardAmount: result['Award Amount'] || 0,
    description: result.Description || '',
    awardingAgency: result['Awarding Agency'],
    awardingSubAgency: result['Awarding Sub Agency'],
    startDate: result['Start Date'],
    endDate: result['End Date'],
    naicsCode: result['NAICS Code'],
    naicsDescription: result['NAICS Description'],
    pscCode: result['Product or Service Code'],
    category,
    snowflakeRelevance: relevance,
    keywords: extractKeywords(result.Description || ''),
  };
}

// Categorize contract based on description and NAICS
function categorizeContract(description: string, naicsDesc: string): Contract['category'] {
  const text = `${description} ${naicsDesc}`.toLowerCase();
  
  if (text.includes('artificial intelligence') || text.includes(' ai ') || text.includes('machine learning') || text.includes('ml ')) {
    return 'Artificial Intelligence';
  }
  if (text.includes('data analytics') || text.includes('analytics platform') || text.includes('business intelligence')) {
    return 'Data Analytics';
  }
  if (text.includes('machine learning') || text.includes('predictive') || text.includes('neural')) {
    return 'Machine Learning';
  }
  if (text.includes('cloud') || text.includes('aws') || text.includes('azure') || text.includes('hosting')) {
    return 'Cloud Services';
  }
  if (text.includes('cyber') || text.includes('security') || text.includes('encryption')) {
    return 'Cybersecurity';
  }
  if (text.includes('data warehouse') || text.includes('data lake') || text.includes('data management') || text.includes('database')) {
    return 'Data Management';
  }
  if (text.includes('software') || text.includes('development') || text.includes('application')) {
    return 'Software Development';
  }
  if (text.includes('it ') || text.includes('information technology') || text.includes('computer')) {
    return 'IT Services';
  }
  return 'Other';
}

// Calculate Snowflake relevance score
function calculateSnowflakeRelevance(description: string, category: Contract['category']): Contract['snowflakeRelevance'] {
  const text = description.toLowerCase();
  
  // High relevance: data warehouse, data lake, analytics, cloud data
  const highKeywords = ['data warehouse', 'data lake', 'data platform', 'analytics platform', 'data engineering', 'etl', 'data integration', 'cloud data'];
  if (highKeywords.some(k => text.includes(k))) {
    return 'high';
  }
  
  // Medium relevance: general data/analytics categories
  if (['Data Analytics', 'Data Management', 'Cloud Services'].includes(category || '')) {
    return 'medium';
  }
  
  // Medium relevance: AI/ML (potential Cortex opportunity)
  if (['Artificial Intelligence', 'Machine Learning'].includes(category || '')) {
    return 'medium';
  }
  
  return 'low';
}

// Extract keywords from description
function extractKeywords(description: string): string[] {
  const text = description.toLowerCase();
  return DATA_AI_KEYWORDS.filter(keyword => text.includes(keyword.toLowerCase()));
}

// Search contracts from USASpending API
export async function searchContracts(filters: ContractFilters = {}, limit = 100): Promise<Contract[]> {
  const params: USASpendingSearchParams = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'], // Contracts only
      time_period: [{
        start_date: filters.startDate || '2020-01-01',
        end_date: filters.endDate || new Date().toISOString().split('T')[0],
      }],
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Award Amount',
      'Description',
      'Awarding Agency',
      'Awarding Sub Agency',
      'Start Date',
      'End Date',
      'NAICS Code',
      'NAICS Description',
      'Product or Service Code',
    ],
    limit,
    sort: 'Award Amount',
    order: 'desc',
  };

  // Add keyword search - use single keyword string for better results
  if (filters.search) {
    params.filters.keywords = [filters.search];
  } else {
    // Default to data/AI keywords - use single term to avoid API issues
    params.filters.keywords = ['data analytics'];
  }

  // Add contractor filter
  if (filters.contractor) {
    params.filters.recipient_search_text = [filters.contractor];
  }

  // Add amount filter
  if (filters.minAmount || filters.maxAmount) {
    params.filters.award_amounts = [{
      lower_bound: filters.minAmount,
      upper_bound: filters.maxAmount,
    }];
  }

  try {
    const response = await fetch(`${USA_SPENDING_API}/search/spending_by_award/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`USASpending API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map(transformContract);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return [];
  }
}

// Search for competitor contracts
export async function searchCompetitorContracts(competitorName: string, limit = 50): Promise<Contract[]> {
  return searchContracts({
    contractor: competitorName,
    startDate: '2020-01-01',
  }, limit);
}

// Get contracts by specific keywords
export async function searchByKeywords(keywords: string[], limit = 100): Promise<Contract[]> {
  // Join keywords into single search string
  const searchString = keywords.join(' ');
  
  const params: USASpendingSearchParams = {
    filters: {
      keywords: [searchString],
      award_type_codes: ['A', 'B', 'C', 'D'],
      time_period: [{
        start_date: '2020-01-01',
        end_date: new Date().toISOString().split('T')[0],
      }],
    },
    fields: [
      'Award ID',
      'Recipient Name', 
      'Award Amount',
      'Description',
      'Awarding Agency',
      'Start Date',
      'End Date',
    ],
    limit,
    sort: 'Award Amount',
    order: 'desc',
  };

  try {
    const response = await fetch(`${USA_SPENDING_API}/search/spending_by_award/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`USASpending API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map(transformContract);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return [];
  }
}

// Get spending summary by agency
export async function getAgencySpending(): Promise<{ name: string; amount: number }[]> {
  // This would use the agency spending endpoint
  // For now, we'll aggregate from search results
  return [];
}
