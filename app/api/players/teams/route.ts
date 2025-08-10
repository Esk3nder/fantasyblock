import { NextResponse } from 'next/server';
import { fetchTeams } from '@/lib/services/google-sheets';

export async function GET() {
  try {
    const teams = await fetchTeams();
    
    return NextResponse.json({
      teams,
      count: teams.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/players/teams:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}