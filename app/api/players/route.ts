import { NextResponse } from 'next/server';
import { fetchPlayersFromSheet } from '@/lib/services/google-sheets';

export async function GET() {
  try {
    const players = await fetchPlayersFromSheet();
    
    return NextResponse.json({
      players,
      count: players.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/players:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}