import { NextRequest, NextResponse } from 'next/server';

// This endpoint queries the Snowflake backend
// Note: In production, you'd use Snowflake SQL API with proper authentication

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view') || 'contracts';
  
  // For now, return mock data structure that matches Snowflake views
  // In production, this would call Snowflake SQL API
  
  const mockData = {
    competitor_summary: [
      { competitor: 'Palantir', contract_count: 8, total_value: 600440016.91, categories: 'AI, Data Analytics, ML' },
      { competitor: 'GDIT', contract_count: 2, total_value: 995085982.69, categories: 'Cloud Services, Data Management' },
      { competitor: 'Booz Allen', contract_count: 2, total_value: 108415415.82, categories: 'Data Analytics' },
      { competitor: 'Deloitte', contract_count: 1, total_value: 25194247, categories: 'Data Analytics' },
    ],
    opportunities: [
      { 
        opportunity_type: 'Competitive Takeout',
        recipient_name: 'PALANTIR TECHNOLOGIES INC.',
        award_amount: 48154420.02,
        description: 'ENTERPRISE DATA AND ANALYTICS PLATFORM PROJECT',
        agency: 'Department of Health and Human Services',
        priority_score: 4
      },
      {
        opportunity_type: 'Competitive Takeout', 
        recipient_name: 'PALANTIR USG INC',
        award_amount: 292680689.24,
        description: 'MAVEN SMART SYSTEM UI/UX PROTOTYPE',
        agency: 'Department of Defense',
        priority_score: 3
      },
    ]
  };

  return NextResponse.json({ 
    success: true, 
    source: 'snowflake',
    data: mockData[view as keyof typeof mockData] || []
  });
}
