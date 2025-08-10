import { NextResponse } from 'next/server';
import { fetchPlayerStats } from '@/lib/services/google-sheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    
    const stats = await fetchPlayerStats(week ? parseInt(week) : undefined);
    
    return NextResponse.json({
      stats,
      count: stats.length,
      week: week || 'all',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/players/stats:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}