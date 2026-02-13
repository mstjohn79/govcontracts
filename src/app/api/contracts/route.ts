import { NextRequest, NextResponse } from 'next/server';
import { searchContracts, searchCompetitorContracts, searchByKeywords } from '@/lib/usaspending';
import { ContractFilters, TRACKED_COMPETITORS } from '@/types/contracts';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const filters: ContractFilters = {
    search: searchParams.get('search') || undefined,
    contractor: searchParams.get('contractor') || undefined,
    agency: searchParams.get('agency') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    minAmount: searchParams.get('minAmount') ? Number(searchParams.get('minAmount')) : undefined,
    maxAmount: searchParams.get('maxAmount') ? Number(searchParams.get('maxAmount')) : undefined,
  };

  const limit = Number(searchParams.get('limit')) || 100;

  try {
    const contracts = await searchContracts(filters, limit);
    return NextResponse.json({ success: true, contracts, count: contracts.length });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, keywords, competitor, limit = 100 } = body;

    if (type === 'keywords' && keywords) {
      const contracts = await searchByKeywords(keywords, limit);
      return NextResponse.json({ success: true, contracts, count: contracts.length });
    }

    if (type === 'competitor' && competitor) {
      const contracts = await searchCompetitorContracts(competitor, limit);
      return NextResponse.json({ success: true, contracts, count: contracts.length });
    }

    if (type === 'all_competitors') {
      // Fetch contracts for all tracked competitors
      const allContracts = await Promise.all(
        TRACKED_COMPETITORS.slice(0, 5).map(name => searchCompetitorContracts(name, 20))
      );
      const contracts = allContracts.flat();
      return NextResponse.json({ success: true, contracts, count: contracts.length });
    }

    return NextResponse.json({ success: false, error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
