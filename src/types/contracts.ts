// Government Contract Types

export interface Contract {
  id: string;
  awardId: string;
  recipientName: string;
  recipientUei?: string;
  awardAmount: number;
  description: string;
  awardingAgency: string;
  awardingSubAgency?: string;
  fundingAgency?: string;
  startDate: string;
  endDate?: string;
  lastModified?: string;
  contractType?: string;
  naicsCode?: string;
  naicsDescription?: string;
  pscCode?: string;
  pscDescription?: string;
  placeOfPerformance?: {
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  // AI-generated classifications
  category?: ContractCategory;
  subcategory?: string;
  snowflakeRelevance?: 'high' | 'medium' | 'low';
  keywords?: string[];
}

export type ContractCategory = 
  | 'Data Analytics'
  | 'Artificial Intelligence'
  | 'Machine Learning'
  | 'Cloud Services'
  | 'Cybersecurity'
  | 'Data Management'
  | 'Software Development'
  | 'IT Services'
  | 'Other';

export interface Contractor {
  name: string;
  uei?: string;
  totalAwards: number;
  totalAmount: number;
  contractCount: number;
  agencies: string[];
  categories: ContractCategory[];
  recentContracts: Contract[];
}

export interface ContractFilters {
  search?: string;
  agency?: string;
  contractor?: string;
  category?: ContractCategory;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  snowflakeRelevance?: 'high' | 'medium' | 'low';
}

export interface ContractStats {
  totalContracts: number;
  totalValue: number;
  avgContractValue: number;
  topContractors: { name: string; amount: number; count: number }[];
  topAgencies: { name: string; amount: number; count: number }[];
  categoryBreakdown: { category: ContractCategory; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number; count: number }[];
}

export interface Opportunity {
  id: string;
  contract: Contract;
  opportunityType: 'expiring' | 'new_solicitation' | 'competitor_renewal' | 'expansion';
  score: number;
  reasoning: string;
  competitorIncumbent?: string;
  expirationDate?: string;
}

// Key competitors to track
export const TRACKED_COMPETITORS = [
  'PALANTIR TECHNOLOGIES INC.',
  'PALANTIR USG INC',
  'AMAZON WEB SERVICES, INC.',
  'MICROSOFT CORPORATION',
  'GOOGLE LLC',
  'BOOZ ALLEN HAMILTON INC.',
  'CACI, INC. - FEDERAL',
  'LEIDOS, INC.',
  'GENERAL DYNAMICS INFORMATION TECHNOLOGY, INC.',
  'DELOITTE CONSULTING LLP',
  'ACCENTURE FEDERAL SERVICES LLC',
  'DATABRICKS, INC.',
  'SNOWFLAKE INC.',
  'IBM CORPORATION',
  'ORACLE AMERICA, INC.',
];

// Relevant NAICS codes for Data/AI
export const DATA_AI_NAICS = [
  '518210', // Data Processing, Hosting
  '513210', // Software Publishers
  '541511', // Custom Computer Programming Services
  '541512', // Computer Systems Design Services
  '541519', // Other Computer Related Services
  '541715', // R&D in Physical, Engineering, Life Sciences
  '541330', // Engineering Services
  '541690', // Other Scientific and Technical Consulting
];

// Keywords for identifying data/AI contracts
export const DATA_AI_KEYWORDS = [
  'artificial intelligence',
  'machine learning',
  'data analytics',
  'data warehouse',
  'data lake',
  'cloud computing',
  'big data',
  'data engineering',
  'data science',
  'predictive analytics',
  'business intelligence',
  'data visualization',
  'database',
  'ETL',
  'data integration',
  'data platform',
  'analytics platform',
  'deep learning',
  'neural network',
  'natural language processing',
  'NLP',
  'computer vision',
];
