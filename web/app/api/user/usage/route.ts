import { NextRequest, NextResponse } from 'next/server';

// Mock usage data - in real implementation, this would come from database
const mockUsageData = {
  searchesThisMonth: 12,
  searchLimit: 25, // Updated to 25 for free tier
  quotesGenerated: 4,
  isLimitReached: false
};

export async function GET(request: NextRequest) {
  try {
    // In real implementation, you would:
    // 1. Get user ID from JWT token
    // 2. Query database for current month usage
    // 3. Calculate if limit is reached
    
    return NextResponse.json(mockUsageData);
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}